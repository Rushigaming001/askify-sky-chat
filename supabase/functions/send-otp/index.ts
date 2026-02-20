import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, purpose } = await req.json();

    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const validPurposes = ['login', 'register'];
    const otpPurpose = validPurposes.includes(purpose) ? purpose : 'login';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Rate limit: max 5 OTP requests per email per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('email', email.toLowerCase().trim())
      .gte('created_at', tenMinutesAgo);

    if ((count || 0) >= 5) {
      return new Response(JSON.stringify({ error: 'Too many OTP requests. Please wait a few minutes.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Invalidate any existing codes for this email+purpose
    await supabase
      .from('otp_codes')
      .delete()
      .eq('email', email.toLowerCase().trim())
      .eq('purpose', otpPurpose);

    // Insert new code
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        email: email.toLowerCase().trim(),
        code,
        purpose: otpPurpose,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to generate verification code' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Askify Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f0f7ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: white; border-radius: 24px; box-shadow: 0 10px 40px rgba(59, 130, 246, 0.1); overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6, #06b6d4); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">ASKIFY</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 8px 0 0; font-weight: 500;">Your Intelligent AI Companion</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin: 0 0 8px; text-align: center;">
                ${otpPurpose === 'register' ? 'Welcome to Askify!' : 'Verify Your Identity'}
              </h2>
              <p style="color: #64748b; font-size: 15px; line-height: 1.6; text-align: center; margin: 0 0 30px;">
                ${otpPurpose === 'register'
                  ? 'Thank you for joining Askify. Use this verification code to complete your registration:'
                  : 'A sign-in attempt was detected for your account. Enter this code to verify:'}
              </p>
              <div style="background: linear-gradient(135deg, #eff6ff, #ecfeff); border: 2px solid #bfdbfe; border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 30px;">
                <p style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 12px;">Verification Code</p>
                <p style="color: #1e40af; font-size: 42px; font-weight: 800; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace;">${code}</p>
              </div>
              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0 0 8px;">
                ⏱ This code expires in <strong>10 minutes</strong>
              </p>
              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
                🔒 If you didn't request this, please ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #f8fafc; padding: 20px 30px; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} Askify — Made by Mr. Rudra<br>
                Your data is securely protected. Never share your verification code.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY');
    let emailSent = false;

    if (resendKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Askify <noreply@minequest.fun>',
            to: [email.toLowerCase().trim()],
            subject: `${code} — Your Askify Verification Code`,
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log('Email sent via Resend successfully');
        } else {
          const errText = await emailResponse.text();
          console.error('Resend error:', emailResponse.status, errText);
        }
      } catch (e) {
        console.error('Resend fetch error:', e);
      }
    }

    if (!emailSent) {
      console.warn('Email not sent - Resend API key missing or failed');
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Verification code sent to your email',
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('OTP error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
