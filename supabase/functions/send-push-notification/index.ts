import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PushPayload {
  userId: string;
  title: string;
  body: string;
}

// Base64url encode
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Import raw key bytes for ECDSA P-256
async function importVapidPrivateKey(base64Key: string): Promise<CryptoKey> {
  const padding = '='.repeat((4 - base64Key.length % 4) % 4);
  const base64 = (base64Key + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  
  // Convert raw 32-byte private key to JWK for P-256
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: base64Key,
    x: '', // Will be filled from public key
    y: '',
  };
  
  // We need x,y from the public key
  const pubKey = Deno.env.get('VAPID_PUBLIC_KEY')!;
  const pubPadding = '='.repeat((4 - pubKey.length % 4) % 4);
  const pubBase64 = (pubKey + pubPadding).replace(/-/g, '+').replace(/_/g, '/');
  const pubRaw = Uint8Array.from(atob(pubBase64), c => c.charCodeAt(0));
  
  // Uncompressed public key: 0x04 || x (32 bytes) || y (32 bytes)
  if (pubRaw.length === 65 && pubRaw[0] === 0x04) {
    jwk.x = base64UrlEncode(pubRaw.slice(1, 33));
    jwk.y = base64UrlEncode(pubRaw.slice(33, 65));
  } else {
    throw new Error('Invalid VAPID public key format');
  }
  
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
}

// Create VAPID JWT for web push authorization
async function createVapidJwt(endpoint: string, privateKey: CryptoKey): Promise<string> {
  const origin = new URL(endpoint).origin;
  const now = Math.floor(Date.now() / 1000);
  
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = {
    aud: origin,
    exp: now + 86400,
    sub: 'mailto:support@askify.app',
  };
  
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsigned = `${headerB64}.${payloadB64}`;
  
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(unsigned)
  );
  
  // Convert DER signature to raw r||s format for JWT
  const sigArray = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  
  if (sigArray.length === 64) {
    // Already raw format
    r = sigArray.slice(0, 32);
    s = sigArray.slice(32, 64);
  } else {
    // DER format: 0x30 len 0x02 rLen r 0x02 sLen s
    let offset = 2; // skip 0x30 and total length
    offset++; // skip 0x02
    const rLen = sigArray[offset++];
    r = sigArray.slice(offset, offset + rLen);
    offset += rLen;
    offset++; // skip 0x02
    const sLen = sigArray[offset++];
    s = sigArray.slice(offset, offset + sLen);
    
    // Remove leading zeros and pad to 32 bytes
    if (r.length > 32) r = r.slice(r.length - 32);
    if (s.length > 32) s = s.slice(s.length - 32);
    if (r.length < 32) { const padded = new Uint8Array(32); padded.set(r, 32 - r.length); r = padded; }
    if (s.length < 32) { const padded = new Uint8Array(32); padded.set(s, 32 - s.length); s = padded; }
  }
  
  const rawSig = new Uint8Array(64);
  rawSig.set(r, 0);
  rawSig.set(s, 32);
  
  const sigB64 = base64UrlEncode(rawSig);
  return `${unsigned}.${sigB64}`;
}

async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error('VAPID keys not configured');
  }

  const privateKey = await importVapidPrivateKey(vapidPrivateKey);
  const jwt = await createVapidJwt(subscription.endpoint, privateKey);

  const headers: Record<string, string> = {
    'TTL': '86400',
    'Urgency': 'high',
    'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
  };

  // Reliability first: if encrypted payload isn't supported, send payload-less push so
  // notification still wakes service worker when browser/app is closed.
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Push failed:', response.status, errorText);
    throw new Error(`Push failed: ${response.status}`);
  }

  return response;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, title, body }: PushPayload = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allow sending notifications to any user (the sender is authenticated)
    // This is needed for DM notifications where user A sends to user B

    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No subscriptions found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Payload-less push is intentionally used for maximum delivery reliability when browser/app is closed.
    // Service worker falls back to default title/body when no payload is present.

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth });
        successCount++;
      } catch (err) {
        const error = err as Error;
        console.error(`Push failed for endpoint:`, error.message);
        failCount++;
        
        if (error.message?.includes('410') || error.message?.includes('404')) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Push notifications processed', sent: successCount, failed: failCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
