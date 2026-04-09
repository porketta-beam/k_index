import { z } from "zod";

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  ANTHROPIC_API_KEY: z.string().min(1, "ANTHROPIC_API_KEY is required"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(
    1,
    "GOOGLE_GENERATIVE_AI_API_KEY is required",
  ),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(
    "NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(
    1,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is required",
  ),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(
    1,
    "SUPABASE_SERVICE_ROLE_KEY is required",
  ),
  BATTLE_SESSION_SECRET: z.string().min(32, "BATTLE_SESSION_SECRET must be at least 32 characters"),
  // Season system (Phase 4)
  ADMIN_API_KEY: z.string().min(32, "ADMIN_API_KEY must be at least 32 characters"),
  SEASON_BATTLE_THRESHOLD: z.coerce.number().int().positive("SEASON_BATTLE_THRESHOLD must be a positive integer"),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated environment variables.
 * Lazily parsed on first access so that `next build` can complete
 * static generation steps without requiring every env var to be set
 * at import time. Once accessed at runtime (e.g. in Route Handlers),
 * missing vars cause an immediate, descriptive error.
 */
let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

/**
 * Convenience proxy: import { env } from '@/lib/env'
 * Each property access triggers lazy validation.
 */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
});
