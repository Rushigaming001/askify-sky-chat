// Shared in-memory DDoS / per-IP rate limiter for Edge Functions.
// NOTE: state is per edge instance (best-effort), not global. For stronger
// protection use Cloudflare/WAF in front. This blocks burst abuse.

const buckets = new Map<string, Map<string, { count: number; resetAt: number }>>();

export interface DDoSOptions {
  /** Unique key per function so different functions have separate buckets */
  key: string;
  /** Max requests per IP per window */
  limit: number;
  /** Window in ms (default 60_000 = 1 minute) */
  windowMs?: number;
}

export function checkDDoS(req: Request, corsHeaders: Record<string, string>, opts: DDoSOptions): Response | null {
  const windowMs = opts.windowMs ?? 60_000;
  const ip =
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  let bucket = buckets.get(opts.key);
  if (!bucket) {
    bucket = new Map();
    buckets.set(opts.key, bucket);
  }

  const now = Date.now();
  const entry = bucket.get(ip);

  if (entry && now < entry.resetAt) {
    entry.count++;
    if (entry.count > opts.limit) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please slow down.' }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfter),
          },
        }
      );
    }
  } else {
    bucket.set(ip, { count: 1, resetAt: now + windowMs });
  }

  // Periodic cleanup to prevent unbounded growth
  if (bucket.size > 1000) {
    for (const [k, v] of bucket) {
      if (now > v.resetAt) bucket.delete(k);
    }
  }

  return null;
}
