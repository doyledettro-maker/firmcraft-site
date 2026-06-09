// JSON response helpers + a typed error used across the scheduling functions.

import { corsHeaders } from "./cors.ts";

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function ok(data: unknown, status = 200): Response {
  return json({ ok: true, data }, status);
}

export function fail(error: string, status = 400, details?: unknown): Response {
  return json({ ok: false, error, ...(details ? { details } : {}) }, status);
}

// Thrown by the auth layer and validation; carried up to the request handler,
// which renders it with fail(). Keeps each function's body free of try/catch noise.
export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

// Wraps a handler so thrown HttpErrors (and unexpected errors) become clean JSON.
export function withErrors(
  handler: (req: Request) => Promise<Response>,
): (req: Request) => Promise<Response> {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpError) {
        return fail(err.message, err.status, err.details);
      }
      console.error("Unhandled error:", err);
      const message = err instanceof Error ? err.message : "Internal error";
      return fail(message, 500);
    }
  };
}
