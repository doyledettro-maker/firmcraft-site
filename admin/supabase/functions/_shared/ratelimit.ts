// Best-effort in-memory rate limiting, scoped to a single Edge Function isolate.
//
// Supabase Edge Functions are stateless across isolates, so this is a fast first
// line of defense, not a global guarantee. Where correctness matters (location
// updates), the function ALSO enforces a DB-backed check. The architecture's
// documented enforcement points are "Edge Function middleware" (widget/portal)
// and "Edge Function dedup" (location), which is exactly this split.

interface Window {
  count: number;
  resetAt: number; // epoch ms
}

const windows = new Map<string, Window>();

// Sliding fixed-window limiter. Returns { allowed, retryAfterMs }.
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || now >= w.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (w.count < limit) {
    w.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }
  return { allowed: false, retryAfterMs: Math.max(0, w.resetAt - now) };
}

// Periodically drop expired windows so the map cannot grow unbounded.
export function sweepRateLimitWindows(): void {
  const now = Date.now();
  for (const [k, w] of windows) {
    if (now >= w.resetAt) windows.delete(k);
  }
}
