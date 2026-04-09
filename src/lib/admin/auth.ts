import crypto from "node:crypto";
import { env } from "@/lib/env";

/**
 * Verify admin API key from Authorization header (D-01, SEASON-04).
 * Uses crypto.timingSafeEqual for constant-time comparison to prevent timing attacks.
 * Matches pattern from src/lib/battle/session.ts which also uses timingSafeEqual.
 */
export function verifyAdminKey(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;

  const key = authHeader.slice(7); // Remove "Bearer " prefix
  if (!key) return false;

  try {
    const keyBuffer = Buffer.from(key);
    const expectedBuffer = Buffer.from(env.ADMIN_API_KEY);

    // timingSafeEqual requires same length buffers
    if (keyBuffer.length !== expectedBuffer.length) return false;

    return crypto.timingSafeEqual(keyBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
