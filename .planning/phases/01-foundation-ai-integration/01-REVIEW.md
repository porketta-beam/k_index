---
phase: 01-foundation-ai-integration
reviewed: 2026-04-08T12:00:00Z
depth: standard
files_reviewed: 13
files_reviewed_list:
  - src/app/api/battle/stream/route.ts
  - src/lib/ai/config.ts
  - src/lib/ai/registry.ts
  - src/lib/db/client.ts
  - src/lib/db/queries.ts
  - src/lib/env.ts
  - src/lib/types.ts
  - src/app/layout.tsx
  - src/app/page.tsx
  - scripts/test-stream.sh
  - supabase/migrations/00001_create_battles.sql
  - next.config.ts
  - .env.local.example
findings:
  critical: 1
  warning: 5
  info: 2
  total: 8
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-08T12:00:00Z
**Depth:** standard
**Files Reviewed:** 13 (1 file missing: `.env.local.example` does not exist on disk)
**Status:** issues_found

## Summary

The foundation layer for K-Index is well-structured. The AI provider registry pattern using Vercel AI SDK is clean and correct. Zod-based environment validation with lazy proxy access is a solid pattern. The SQL schema is straightforward and appropriate for the domain.

Key concerns: (1) the database migration lacks Row Level Security, leaving tables publicly accessible if the anon key is ever used; (2) the streaming endpoint has no rate limiting despite project constraints requiring abuse prevention; (3) the Supabase service-role client has no `server-only` guard and could leak credentials if accidentally imported client-side.

## Critical Issues

### CR-01: Database tables lack Row Level Security (RLS)

**File:** `supabase/migrations/00001_create_battles.sql:6-27`
**Issue:** Neither the `battles` nor `votes` table has RLS enabled. The CLAUDE.md explicitly states the project uses Supabase with "Row Level Security for protecting data even without auth." While the current server-side code uses the service role key (which bypasses RLS), the env schema validates `NEXT_PUBLIC_SUPABASE_ANON_KEY` -- indicating client-side Supabase usage is anticipated. Without RLS enabled, any client with the anon key has full read/write access to all battles and votes. An attacker could read all model identities (breaking blind comparison), insert fake votes, or delete battle data.
**Fix:** Enable RLS on both tables and add appropriate policies. At minimum:
```sql
-- Enable RLS
alter table battles enable row level security;
alter table votes enable row level security;

-- Allow anonymous reads of completed battles (for leaderboard)
create policy "Anyone can read completed battles"
  on battles for select
  using (status = 'completed');

-- Only service role can insert/update battles
-- (no anon policy for insert/update -- server handles via service role key)

-- Allow anonymous vote insertion (one vote per battle enforced at app layer)
create policy "Anyone can insert votes"
  on votes for insert
  with check (true);

-- Allow anonymous reads of votes
create policy "Anyone can read votes"
  on votes for select
  using (true);
```

## Warnings

### WR-01: No rate limiting on AI streaming endpoint

**File:** `src/app/api/battle/stream/route.ts:19`
**Issue:** The `/api/battle/stream` POST handler has no rate limiting. The project constraints in CLAUDE.md state: "v1에서 로그인 없으므로, API 남용 방지 메커니즘 필수" (No auth in v1, so API abuse prevention mechanisms are mandatory). Each request to this endpoint invokes a paid AI API. Without rate limiting, any client can make unlimited requests, running up API costs. The tech stack includes `@upstash/ratelimit` specifically for this purpose but it is not used here.
**Fix:** Add Upstash rate limiting before the AI call. This is likely planned for a later phase, but should be tracked:
```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per minute
});

// Inside POST handler, before streamText:
const ip = req.headers.get("x-forwarded-for") ?? "unknown";
const { success } = await ratelimit.limit(ip);
if (!success) {
  return Response.json({ error: "Too many requests" }, { status: 429 });
}
```

### WR-02: Supabase service-role client lacks `server-only` guard

**File:** `src/lib/db/client.ts:1-9`
**Issue:** The file exports a Supabase client initialized with the service role key. The comment on line 5 says "Server-side only -- do NOT import in client components," but comments are not enforced. If a developer accidentally imports this module in a client component, Next.js will bundle the service role key into client-side JavaScript, fully exposing it. The `SUPABASE_SERVICE_ROLE_KEY` grants unrestricted access to all Supabase data, bypassing RLS.
**Fix:** Add the `server-only` package import at the top of the file. This causes a build-time error if the module is imported from a client component:
```typescript
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
// ... rest of file
```
Note: You may need to install the `server-only` package (`npm install server-only`) if not already present.

### WR-03: Malformed JSON request body returns 500 instead of 400

**File:** `src/app/api/battle/stream/route.ts:21`
**Issue:** `req.json()` on line 21 throws a `SyntaxError` when the request body is not valid JSON. This error is not a `z.ZodError`, so it falls through to the generic catch block on line 50-52, which returns a 500 "Internal server error." A malformed request is a client error (4xx), not a server error (5xx). This can confuse clients and pollute error monitoring with false server errors.
**Fix:** Add explicit handling for JSON parse failures:
```typescript
try {
  const body = await req.json();
  const { prompt, modelId } = requestSchema.parse(body);
  // ... rest of handler
} catch (error) {
  if (error instanceof SyntaxError) {
    return Response.json(
      { error: "Invalid JSON in request body" },
      { status: 400 },
    );
  }
  if (error instanceof z.ZodError) {
    return Response.json(
      { error: "Invalid request", details: error.errors },
      { status: 400 },
    );
  }
  console.error("[battle/stream] Error:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

### WR-04: Database update queries do not verify rows were affected

**File:** `src/lib/db/queries.ts:28-39`
**Issue:** `updateBattleResponse` and `updateBattleStatus` execute UPDATE queries filtered by `battleId` but do not check whether any row was actually updated. If a non-existent `battleId` is passed, the query succeeds silently (Supabase returns no error for an UPDATE that matches zero rows). This can mask bugs where a caller passes an incorrect or stale battle ID.
**Fix:** Add a `.select()` and verify the result, or use `.select().single()` to ensure exactly one row was updated:
```typescript
export async function updateBattleResponse(
  battleId: string,
  field: "response_a" | "response_b",
  response: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("battles")
    .update({ [field]: response })
    .eq("id", battleId)
    .select("id")
    .single();

  if (error)
    throw new Error(`Failed to update battle response: ${error.message}`);
  if (!data)
    throw new Error(`Battle not found: ${battleId}`);
}
```

### WR-05: Unchecked type assertions on Supabase query results

**File:** `src/lib/db/queries.ts:25,70,86`
**Issue:** Multiple functions cast Supabase results using `as Battle` or `as Vote` (lines 25, 70, 86) without runtime validation. If the database schema drifts from the TypeScript types (e.g., a column is renamed, a new required field is added, or Supabase returns unexpected shapes), these casts will silently produce objects that do not match the declared interface. This can cause runtime errors far from the source.
**Fix:** For Phase 1 this is acceptable as a known trade-off (Supabase's `supabase-js` does not have built-in typed-client generation in use here). Consider generating types from the database schema in a future phase:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/db/database.types.ts
```
Then pass the generated `Database` type to `createClient<Database>(...)` in `client.ts` for type-safe queries.

## Info

### IN-01: `console.log` in production code path

**File:** `src/app/api/battle/stream/route.ts:36-38`
**Issue:** The `onFinish` callback uses `console.log` for token usage monitoring. While intentional per the Phase 1 comment (line 31-35), this will produce noise in production logs. In a Vercel deployment, these logs count toward log limits and mix with actionable log entries.
**Fix:** Either prefix with a structured logging format or replace with a proper logging utility before production deployment. Low priority for Phase 1.

### IN-02: `NEXT_PUBLIC_SUPABASE_ANON_KEY` validated but unused

**File:** `src/lib/env.ts:13-16`
**Issue:** The env schema validates `NEXT_PUBLIC_SUPABASE_ANON_KEY` but no code in the current codebase uses it. The only Supabase client (`src/lib/db/client.ts`) uses the service role key. Requiring this env var means deployment will fail if it is not set, even though it serves no purpose yet.
**Fix:** This is likely forward-looking for Phase 2 (client-side Supabase usage). No action needed if intentional, but consider making it optional if it blocks deployment:
```typescript
NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
```

---

_Reviewed: 2026-04-08T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
