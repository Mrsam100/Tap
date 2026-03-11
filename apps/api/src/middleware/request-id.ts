import { createMiddleware } from 'hono/factory';
import { randomUUID } from 'crypto';

/**
 * Adds a unique request ID to every request.
 * - Reads `X-Request-Id` from the incoming request (e.g. from a load balancer).
 * - Falls back to a server-generated UUID.
 * - Sets `X-Request-Id` on the response for client-side debugging.
 * - Accessible via `c.get('requestId')` in downstream handlers.
 */

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
  }
}

// Only accept safe request IDs: UUID-like or alphanumeric (max 64 chars)
const VALID_REQUEST_ID = /^[a-zA-Z0-9\-_]{1,64}$/;

export const requestId = createMiddleware(async (c, next) => {
  const incoming = c.req.header('x-request-id');
  const id = (incoming && VALID_REQUEST_ID.test(incoming)) ? incoming : randomUUID();
  c.set('requestId', id);
  await next();
  c.header('X-Request-Id', id);
});
