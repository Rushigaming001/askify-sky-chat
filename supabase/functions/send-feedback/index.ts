import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, message, userId } = await req.json();

    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Askify Feedback <onboarding@resend.dev>',
          to: ['opgamer012321@gmail.com'],
          subject: `Askify Feedback from ${email || 'Anonymous'}`,
          html: `
            <h2>New Feedback from Askify</h2>
            <p><strong>From:</strong> ${email || 'Anonymous'}</p>
            <p><strong>User ID:</strong> ${userId || 'Not logged in'}</p>
            <hr/>
            <p>${message.replace(/\n/g, '<br/>')}</p>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
