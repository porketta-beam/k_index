import { Redis } from "@upstash/redis";

// HTTP-based Redis client -- no connection pooling needed on serverless.
// Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from process.env.
// Does NOT use our env.ts lazy proxy -- Upstash handles its own env reading.
export const redis = Redis.fromEnv();
