import { Redis } from "@upstash/redis";

// Redis.fromEnv() reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// HTTP-based -- no connection pooling needed on serverless
export const redis = Redis.fromEnv();
