import crypto from "node:crypto";
import { env } from "@/lib/env";
import type { BattleSession } from "@/lib/types";

const ALGORITHM = "sha256";
const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function createBattleToken(session: BattleSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto
    .createHmac(ALGORITHM, env.BATTLE_SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyBattleToken(token: string): BattleSession | null {
  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac(ALGORITHM, env.BATTLE_SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const session = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf-8"),
  ) as BattleSession;

  // Reject tokens older than 30 minutes
  if (Date.now() - session.ts > TOKEN_TTL_MS) return null;

  return session;
}

export type { BattleSession };
