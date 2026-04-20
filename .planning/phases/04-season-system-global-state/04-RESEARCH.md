# Phase 4: Season System & Global State - Research

**Researched:** 2026-04-09
**Domain:** Season lifecycle management, serverless Redis counters, admin API authorization
**Confidence:** HIGH

## Summary

Phase 4 introduces a season system that gates battle access through a global counter stored in Upstash Redis, with season metadata persisted in Supabase PostgreSQL. The implementation touches four layers: (1) a new `seasons` table and `season_id` column on `battles`, (2) an Upstash Redis atomic counter that tracks battles per season, (3) admin API routes for manual season control, and (4) client-side handling of season-ended state.

The core technical challenge is minimal: Redis INCR is inherently atomic (single-threaded event loop guarantees no race conditions), and the season gate is a simple check at `/api/battle/start`. The existing `get_model_win_rates` PostgreSQL function can be extended with a new `season_filter` parameter using a DEFAULT value, preserving backward compatibility via `CREATE OR REPLACE FUNCTION`.

**Primary recommendation:** Use Upstash Redis `INCR` on a key like `season:{id}:battles` for the atomic counter, store season metadata in a `seasons` Supabase table, and gate new battles at the `/api/battle/start` route by checking season status before issuing tokens. Admin routes use a simple `ADMIN_API_KEY` bearer token check.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Secret API key for admin auth. Environment variable `ADMIN_API_KEY`, verified via `Authorization: Bearer` header on admin API calls.
- **D-02:** Admin can only start/end seasons. POST `/api/admin/season/start`, POST `/api/admin/season/end`.
- **D-03:** Season battle threshold via environment variable `SEASON_BATTLE_THRESHOLD`. Changes require redeployment.
- **D-04:** Global battle counter is NOT displayed in UI. Server-internal only, used for auto-shutdown.
- **D-05:** Season-end detection via battle start rejection. No polling/SSE/Realtime needed. Client discovers season ended when `/api/battle/start` returns a rejection response.
- **D-06:** Season-end UI: "시즌 N 배틀이 끝났습니다!" + "다음 시즌을 기다려주세요". Replaces battle UI entirely.
- **D-07:** In-flight battles complete normally. Only new battle starts are blocked when season ends.
- **D-08:** `season_id` column on `battles` table for season tagging.
- **D-09:** Win rates reset per season. `getModelWinRates` gets `season_id` filter; new season starts at 0%.

### Claude's Discretion
- Upstash Redis global counter implementation: atomic increment, TTL, caching strategy
- `seasons` table schema design (id, number, status, threshold, created_at, etc.)
- Season status check performance optimization (runs every battle start)
- Season-end screen detailed design (Phase 5 UI Polish can refine)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEASON-01 | 서버 전체 요청 수를 추적하는 글로벌 카운터가 존재한다 | Upstash Redis INCR atomic counter pattern; key `season:{id}:battles` |
| SEASON-02 | 글로벌 요청이 임계치에 도달하면 시즌이 자동 종료된다 | INCR returns new value; compare against threshold in `/api/battle/start`; update season status in Supabase |
| SEASON-03 | 시즌 종료 시 "시즌 N 배틀이 끝났습니다" 메시지가 표시된다 | API returns `{ seasonEnded: true, seasonNumber: N }` on rejection; client renders season-end screen |
| SEASON-04 | 관리자가 시즌 시작/종료를 수동으로 제어할 수 있다 | Admin API routes with bearer token auth; updates `seasons` table status |
| DATA-02 | 글로벌 요청 카운터가 실시간으로 업데이트되고 조회 가능하다 | Redis INCR on every vote (when battle completes); Redis GET for admin queries |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack:** Next.js 16 + Supabase + Upstash Redis + Zustand + Zod + shadcn/ui + Tailwind 4
- **No separate Python backend:** All logic in Next.js Route Handlers
- **No individual AI SDKs:** Vercel AI SDK only (not relevant to this phase but general constraint)
- **No NextAuth/Auth.js:** Admin auth uses simple API key, not auth library
- **No Prisma:** Supabase client + SQL migrations only
- **No WebSockets/Socket.io:** Season-end detection via HTTP response, not push
- **Monolith architecture:** Everything in one Next.js codebase
- **Lazy env validation pattern:** Extend existing `env.ts` with new variables
- **Biome for linting:** No ESLint

## Standard Stack

### Core (New for Phase 4)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@upstash/redis` | 1.37.0 | Serverless Redis client | HTTP-based, no connection pooling needed. `Redis.fromEnv()` auto-reads credentials. Atomic INCR for counter. [VERIFIED: npm registry] |

### Already Installed (Extended in Phase 4)
| Library | Version | Purpose | Extension Needed |
|---------|---------|---------|-----------------|
| `@supabase/supabase-js` | ^2.102.0 | Database client | New `seasons` table queries, `season_id` on inserts |
| `zod` | ^3.24.0 | Schema validation | Admin API request validation, env var validation |
| `zustand` | ^5.0.12 | Client state | Season-ended state in battle store |

### Not Needed
| Library | Why Not |
|---------|---------|
| `@upstash/ratelimit` | D-04 says counter is server-internal, not rate limiting. Plain INCR + threshold check is sufficient. Ratelimit library is for per-user rate limiting, not global counters. |
| `ioredis` / `redis` | Self-hosted Redis client. Upstash HTTP client avoids connection pooling on serverless. |

**Installation:**
```bash
npm install @upstash/redis
```

**Version verification:**
- `@upstash/redis`: 1.37.0 (latest stable, verified 2026-04-09) [VERIFIED: npm registry]

## Architecture Patterns

### New Files Structure
```
src/
├── lib/
│   ├── redis/
│   │   └── client.ts           # Redis.fromEnv() singleton
│   ├── season/
│   │   ├── counter.ts          # incrementBattleCounter(), getBattleCount()
│   │   ├── queries.ts          # Season CRUD: getCurrentSeason(), createSeason(), endSeason()
│   │   └── gate.ts             # checkSeasonActive() -- combined Redis+Supabase check
│   ├── admin/
│   │   └── auth.ts             # verifyAdminKey() helper
│   ├── db/
│   │   └── queries.ts          # MODIFIED: insertBattleWithVote gets season_id param
│   ├── store/
│   │   └── battle-store.ts     # MODIFIED: add seasonEnded state + setter
│   ├── env.ts                  # MODIFIED: add ADMIN_API_KEY, SEASON_BATTLE_THRESHOLD, Upstash vars
│   └── types.ts                # MODIFIED: Battle gets season_id, new Season type
├── app/
│   └── api/
│       ├── battle/
│       │   └── start/route.ts  # MODIFIED: season gate before token creation
│       │   └── vote/route.ts   # MODIFIED: increment counter after successful vote
│       └── admin/
│           └── season/
│               ├── start/route.ts  # POST: create new season
│               └── end/route.ts    # POST: end current season
├── components/
│   └── battle/
│       ├── battle-arena.tsx    # MODIFIED: handle season-ended response
│       └── season-ended.tsx    # NEW: season-end message screen
└── supabase/
    └── migrations/
        ├── 00003_create_seasons.sql       # seasons table + battles.season_id
        └── 00004_update_win_rate_function.sql  # Add season_filter param
```

### Pattern 1: Redis Atomic Counter
**What:** Use Redis INCR for the global battle counter. INCR is atomic and returns the new value in one operation -- no read-then-write race condition possible.
**When to use:** Every completed battle (at vote time, not start time -- aligns with D-07's insertBattleWithVote pattern).

```typescript
// Source: Upstash official docs + Redis.io INCR documentation
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

export async function incrementBattleCounter(seasonId: string): Promise<number> {
  // INCR is atomic -- safe for concurrent requests
  // Returns the NEW value after increment
  const count = await redis.incr(`season:${seasonId}:battles`);
  return count;
}

export async function getBattleCount(seasonId: string): Promise<number> {
  const count = await redis.get<number>(`season:${seasonId}:battles`);
  return count ?? 0;
}
```
[VERIFIED: Redis INCR atomicity confirmed via redis.io/docs/latest/commands/incr/]
[VERIFIED: @upstash/redis initialization via Upstash official docs]

### Pattern 2: Season Gate at Battle Start
**What:** Before issuing a battle token, check if the current season is active and under the threshold. If not, return a rejection response the client uses to show the season-end screen.
**When to use:** `/api/battle/start` route, before any model selection or token creation.

```typescript
// In /api/battle/start/route.ts
import { checkSeasonActive } from "@/lib/season/gate";

export async function POST(req: Request) {
  // Season gate -- FIRST check before anything else
  const seasonCheck = await checkSeasonActive();
  if (!seasonCheck.active) {
    return Response.json(
      {
        error: "season_ended",
        seasonNumber: seasonCheck.seasonNumber,
        message: `시즌 ${seasonCheck.seasonNumber} 배틀이 끝났습니다!`,
      },
      { status: 503 },
    );
  }
  // ... existing token creation logic, now with seasonCheck.seasonId
}
```

### Pattern 3: Counter Increment at Vote Time (not Start Time)
**What:** Increment the Redis counter AFTER the battle is completed (at vote time), not when the battle starts. This aligns with D-07 (in-flight battles complete normally) and the existing insertBattleWithVote pattern.
**Why:** If we increment at start time, we'd count abandoned battles. Incrementing at vote time counts only completed battles.

```typescript
// In /api/battle/vote/route.ts -- after insertBattleWithVote succeeds
import { incrementBattleCounter } from "@/lib/season/counter";
import { getCurrentSeason, endSeasonIfThresholdReached } from "@/lib/season/queries";

// After successful DB write:
const season = await getCurrentSeason();
if (season) {
  const newCount = await incrementBattleCounter(season.id);
  // Auto-end season if threshold reached (SEASON-02)
  if (newCount >= season.threshold) {
    await endSeasonIfThresholdReached(season.id);
  }
}
```

### Pattern 4: Admin Bearer Token Auth
**What:** Simple middleware-style check for admin routes. Compare `Authorization: Bearer <key>` against `ADMIN_API_KEY` env var.
**When to use:** All `/api/admin/*` routes.

```typescript
// src/lib/admin/auth.ts
import { env } from "@/lib/env";

export function verifyAdminKey(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return false;
  const key = authHeader.slice(7);
  // Constant-time comparison to prevent timing attacks
  if (key.length !== env.ADMIN_API_KEY.length) return false;
  let mismatch = 0;
  for (let i = 0; i < key.length; i++) {
    mismatch |= key.charCodeAt(i) ^ env.ADMIN_API_KEY.charCodeAt(i);
  }
  return mismatch === 0;
}
```
[ASSUMED: Constant-time comparison via manual XOR loop. Node.js `crypto.timingSafeEqual` would be more robust but requires Buffer conversion.]

### Pattern 5: Supabase Migration for Seasons
**What:** Create `seasons` table and add `season_id` column to `battles`.

```sql
-- 00003_create_seasons.sql
CREATE TABLE seasons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_number integer NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  threshold integer NOT NULL,
  battle_count integer NOT NULL DEFAULT 0,  -- denormalized for quick reads
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- Add season_id to battles (nullable for backward compatibility with existing battles)
ALTER TABLE battles ADD COLUMN season_id uuid REFERENCES seasons(id);

-- Index for fast lookups
CREATE INDEX idx_battles_season_id ON battles(season_id);
CREATE INDEX idx_seasons_status ON seasons(status);
```

### Pattern 6: Win Rate Function Update
**What:** Add `season_filter` parameter to existing `get_model_win_rates` function. Uses DEFAULT NULL for backward compatibility -- PostgreSQL allows adding parameters with defaults via `CREATE OR REPLACE FUNCTION`.

```sql
-- 00004_update_win_rate_function.sql
CREATE OR REPLACE FUNCTION get_model_win_rates(
  category_filter text DEFAULT 'general',
  season_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  model_id text,
  wins bigint,
  total bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH battle_models AS (
    SELECT b.id as battle_id, b.model_a as model_id,
           CASE WHEN v.winner = 'a' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed'
      AND b.category = category_filter
      AND (season_filter IS NULL OR b.season_id = season_filter)
    UNION ALL
    SELECT b.id as battle_id, b.model_b as model_id,
           CASE WHEN v.winner = 'b' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed'
      AND b.category = category_filter
      AND (season_filter IS NULL OR b.season_id = season_filter)
  )
  SELECT
    bm.model_id,
    SUM(bm.won)::bigint as wins,
    COUNT(*)::bigint as total
  FROM battle_models bm
  GROUP BY bm.model_id;
END;
$$ LANGUAGE plpgsql STABLE;
```
[VERIFIED: PostgreSQL CREATE OR REPLACE FUNCTION supports adding parameters with DEFAULT values without breaking existing calls -- PostgreSQL official docs]

### Anti-Patterns to Avoid
- **Incrementing counter at battle start:** Counts abandoned battles, inflates the counter. Increment at vote time when the battle actually completes.
- **Storing counter only in PostgreSQL:** INCR in PostgreSQL requires SELECT FOR UPDATE or serializable transaction. Redis INCR is single-operation atomic and far simpler.
- **Polling for season status:** D-05 explicitly says no polling/SSE/Realtime. Season-end detection happens when battle start is rejected.
- **Caching season status in Redis with TTL:** Creates a window where the season could be ended but cached as active. Since the check only happens at battle start (not on every page load), a direct Supabase query is fast enough.
- **Using @upstash/ratelimit for the global counter:** Ratelimit is designed for per-identifier rate limiting with sliding windows. A simple INCR + threshold comparison is more appropriate for a global counter.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic counter | PostgreSQL SELECT + UPDATE with locks | Redis INCR via `@upstash/redis` | Redis INCR is single-operation atomic, no transactions needed |
| Admin auth | Full auth system | Simple bearer token comparison | D-01 specifies secret key approach; no user management needed |
| Season status check | Complex state machine with pub/sub | Single Supabase query on active season | Only runs at battle start, not high frequency |
| Counter deduplication | Custom idempotency keys | Counter at vote time (natural dedup via votes_battle_id_unique constraint) | Each battle can only have one vote, so counter increments exactly once per battle |

**Key insight:** The season system is fundamentally simple: a counter, a threshold, and a gate. The existing patterns (Zod validation, Supabase queries, HMAC tokens) handle 80% of the complexity. The only new infrastructure is the Redis client.

## Common Pitfalls

### Pitfall 1: Race Condition Between Counter Check and Increment
**What goes wrong:** Two simultaneous battle starts both read counter=99 (threshold=100), both pass the gate, both create battles. Counter ends up at 101.
**Why it happens:** Check-then-act pattern with separate read and write.
**How to avoid:** The counter is incremented at VOTE time, not start time. The season gate at start time checks season STATUS (from Supabase `seasons` table), not the counter directly. The auto-end logic runs after each INCR and updates the season status. Worst case: a few extra battles complete after threshold, which is acceptable for v1.
**Warning signs:** Counter consistently exceeds threshold by more than a few.

### Pitfall 2: Forgetting to Pass season_id to insertBattleWithVote
**What goes wrong:** Battles are inserted without `season_id`, making win rate filtering by season impossible.
**Why it happens:** `season_id` must be threaded through from the season gate check in `/api/battle/start` to the vote handler.
**How to avoid:** Include `season_id` in the HMAC battle token (BattleSession type). The vote handler reads it from the verified token, same pattern as `cat` and `sp`.
**Warning signs:** `battles` rows with NULL `season_id` during an active season.

### Pitfall 3: Season Status Stale After Admin End
**What goes wrong:** Admin ends season, but in-flight battle starts (between admin action and next request) still pass the gate.
**Why it happens:** No cache invalidation mechanism.
**How to avoid:** The season gate queries Supabase directly (not a cache). A direct query adds ~50-100ms but only runs at battle start, which is acceptable. Any request after the admin update will see the new status.
**Warning signs:** Battles created after admin ends season.

### Pitfall 4: Env Var Validation Crash at Build Time
**What goes wrong:** Adding ADMIN_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN as required env vars causes `next build` to fail when they are not set during static generation.
**Why it happens:** The existing `env.ts` uses lazy validation (proxy pattern). New vars must follow the same pattern.
**How to avoid:** Keep using the existing lazy `getEnv()` pattern. Never import `env` at module scope in files that might be evaluated during build. New season-related env vars should be in the same Zod schema with `.min(1)` validation.
**Warning signs:** Build failures mentioning missing env vars.

### Pitfall 5: Upstash Free Tier Command Budget
**What goes wrong:** Running out of Upstash commands before the season ends.
**Why it happens:** Each battle uses ~2 Redis commands (1 INCR at vote time, 1 GET at start time for season check). With 500K commands/month free tier, this supports ~250K battles/month.
**How to avoid:** For MVP this is more than sufficient. The SEASON_BATTLE_THRESHOLD will likely be set to hundreds or low thousands per season.
**Warning signs:** HTTP 429 responses from Upstash.

### Pitfall 6: PostgreSQL CREATE OR REPLACE FUNCTION Signature Change
**What goes wrong:** Attempting to add a required (non-default) parameter to `get_model_win_rates` via CREATE OR REPLACE fails because PostgreSQL requires the same argument types for replacement.
**Why it happens:** PostgreSQL treats functions with different parameter signatures as different functions.
**How to avoid:** Always add new parameters with DEFAULT values. The `season_filter uuid DEFAULT NULL` pattern works because existing calls without this parameter will continue to work.
**Warning signs:** Migration error: "cannot change return type of existing function" or similar.

## Code Examples

### Redis Client Singleton
```typescript
// src/lib/redis/client.ts
// Source: Upstash official docs
import { Redis } from "@upstash/redis";

// Redis.fromEnv() reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
// HTTP-based -- no connection pooling needed on serverless
export const redis = Redis.fromEnv();
```
[VERIFIED: Upstash Redis fromEnv pattern from official GitHub README]

### Season Type Definition
```typescript
// Addition to src/lib/types.ts
export type SeasonStatus = "active" | "ended";

export interface Season {
  id: string;
  season_number: number;
  status: SeasonStatus;
  threshold: number;
  battle_count: number;
  started_at: string;
  ended_at: string | null;
}
```

### Updated Battle Type
```typescript
// Modification to existing Battle interface in src/lib/types.ts
export interface Battle {
  id: string;
  question: string;
  model_a: BudgetModelId;
  model_b: BudgetModelId;
  response_a: string | null;
  response_b: string | null;
  position_a: "left" | "right";
  category: string;
  season_id: string | null;  // NEW: nullable for pre-season battles
  status: BattleStatus;
  created_at: string;
  completed_at: string | null;
}
```

### Updated BattleSession (HMAC Token Payload)
```typescript
// Addition to BattleSession in src/lib/types.ts
export interface BattleSession {
  sid: string;
  q: string;
  mA: BudgetModelId;
  mB: BudgetModelId;
  pA: "left" | "right";
  cat: string;
  sp: string;
  sId: string;  // NEW: season_id -- threaded from gate to vote
  ts: number;
}
```

### Season Gate Check
```typescript
// src/lib/season/gate.ts
import { supabase } from "@/lib/db/client";
import type { Season } from "@/lib/types";

interface SeasonGateResult {
  active: boolean;
  seasonId: string | null;
  seasonNumber: number | null;
}

export async function checkSeasonActive(): Promise<SeasonGateResult> {
  const { data, error } = await supabase
    .from("seasons")
    .select("id, season_number, status")
    .eq("status", "active")
    .order("season_number", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    // No active season found
    return { active: false, seasonId: null, seasonNumber: null };
  }

  return {
    active: true,
    seasonId: data.id,
    seasonNumber: data.season_number,
  };
}
```

### Updated Env Schema
```typescript
// Additions to src/lib/env.ts
const envSchema = z.object({
  // ... existing vars ...
  ADMIN_API_KEY: z.string().min(32, "ADMIN_API_KEY must be at least 32 characters"),
  SEASON_BATTLE_THRESHOLD: z.coerce.number().int().positive("SEASON_BATTLE_THRESHOLD must be a positive integer"),
  UPSTASH_REDIS_REST_URL: z.string().url("UPSTASH_REDIS_REST_URL must be a valid URL"),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, "UPSTASH_REDIS_REST_TOKEN is required"),
});
```

### Battle Store Season State
```typescript
// Additions to battle-store.ts
interface BattleState {
  // ... existing state ...
  seasonEnded: boolean;
  seasonNumber: number | null;

  // ... existing actions ...
  setSeasonEnded: (seasonNumber: number) => void;
}

// In create():
seasonEnded: false,
seasonNumber: null,

setSeasonEnded: (seasonNumber: number) =>
  set({ seasonEnded: true, seasonNumber }),
```

### Season-Ended Client Handling
```typescript
// In battle-arena.tsx handleStartBattle
const res = await fetch("/api/battle/start", { ... });

if (res.status === 503) {
  const data = await res.json();
  if (data.error === "season_ended") {
    store.setSeasonEnded(data.seasonNumber);
    return;
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Connection-based Redis clients (ioredis) | HTTP-based Redis (@upstash/redis) | 2023+ | No connection pooling needed on serverless |
| Per-request DB transactions for counters | Redis atomic INCR | Always available | Single-operation atomicity, no locks |
| Upstash free tier 10K commands/day | 500K commands/month | March 2025 | Much more generous for MVP usage |

**Current:** `@upstash/redis` 1.37.0 uses `Redis.fromEnv()` pattern and HTTP REST API. No config beyond two env vars. [VERIFIED: npm registry]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SEASON-01 | Redis INCR counter increments correctly | unit | `npx vitest run src/lib/season/counter.test.ts -t "increment" --reporter=verbose` | Wave 0 |
| SEASON-02 | Auto-end when threshold reached | unit | `npx vitest run src/lib/season/gate.test.ts -t "threshold" --reporter=verbose` | Wave 0 |
| SEASON-03 | Season-end message returned on rejection | unit | `npx vitest run src/lib/season/gate.test.ts -t "season_ended" --reporter=verbose` | Wave 0 |
| SEASON-04 | Admin start/end routes with auth | unit | `npx vitest run src/lib/admin/auth.test.ts --reporter=verbose` | Wave 0 |
| DATA-02 | Counter updates and is queryable | unit | `npx vitest run src/lib/season/counter.test.ts -t "get count" --reporter=verbose` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/lib/season/counter.test.ts` -- covers SEASON-01, DATA-02 (mock @upstash/redis)
- [ ] `src/lib/season/gate.test.ts` -- covers SEASON-02, SEASON-03 (mock Supabase)
- [ ] `src/lib/admin/auth.test.ts` -- covers SEASON-04 (bearer token validation)
- [ ] `src/lib/season/queries.test.ts` -- covers season CRUD operations (mock Supabase)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes (admin only) | Bearer token comparison with constant-time check |
| V3 Session Management | No | Existing HMAC token handles battle sessions |
| V4 Access Control | Yes | Admin routes check ADMIN_API_KEY before any action |
| V5 Input Validation | Yes | Zod schemas on all admin API inputs |
| V6 Cryptography | No | No new crypto beyond existing HMAC (season_id in token) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Admin API key brute force | Spoofing | Minimum 32-char key, constant-time comparison |
| Counter manipulation via replay | Tampering | Counter incremented server-side only (at vote time), tied to unique battle_id |
| Unauthorized season control | Elevation of Privilege | Bearer token check on all admin routes |
| Season status bypass | Tampering | Server-side gate in route handler; client cannot bypass |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Constant-time string comparison via manual XOR loop is sufficient for admin key | Pattern 4 | LOW -- could use Node.js crypto.timingSafeEqual instead for stronger guarantee |
| A2 | ~50-100ms latency for Supabase season check at battle start is acceptable | Pitfall 3 | LOW -- could add short Redis cache if too slow, but unlikely for MVP |
| A3 | A few battles exceeding the threshold (counter race at vote time) is acceptable | Pitfall 1 | LOW -- threshold is a soft limit for cost control, not a hard security boundary |

## Open Questions (RESOLVED)

1. **Initial Season Creation** — RESOLVED: Create via admin API call. Gate returns `active: false` gracefully when no season exists, showing the season-end screen. No seed migration needed.
   - What we know: Admin can start/end seasons via API. The system needs at least one active season for battles to work.
   - What's unclear: Should the first season be created via admin API call, or auto-created via a seed migration?
   - Recommendation: Create via admin API call. Include a note in deployment docs. If no active season exists, the gate returns `active: false` and shows the season-end screen (graceful degradation).

2. **Season Number Sequence** — RESOLVED: Auto-increment via MAX(season_number) + 1 query in createSeason.
   - What we know: D-06 mentions "시즌 N" in the message.
   - What's unclear: Should season numbers auto-increment or be manually set?
   - Recommendation: Auto-increment. When admin starts a new season, query MAX(season_number) + 1 from the seasons table.

3. **battle_count Denormalization** — RESOLVED: Yes, store battle_count in seasons table. Updated when season ends by copying final Redis counter value.
   - What we know: The Redis counter is the source of truth for the current count.
   - What's unclear: Should we also store battle_count in the `seasons` table for historical reference?
   - Recommendation: Yes -- update `seasons.battle_count` when season ends (copy final Redis value). Useful for analytics without querying Redis history.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Upstash Redis | Global counter (SEASON-01, DATA-02) | Requires signup | N/A (cloud service) | None -- core requirement |
| Supabase | Season metadata, battles.season_id | Already configured | supabase-js 2.102.x | -- |
| Node.js | Runtime | Yes | 20.x+ (required by Next.js 16) | -- |

**Missing dependencies with no fallback:**
- Upstash Redis account and credentials must be provisioned before this phase can be deployed. Development can use Upstash's free tier.

**Missing dependencies with fallback:**
- None

## Sources

### Primary (HIGH confidence)
- [npm registry: @upstash/redis 1.37.0](https://www.npmjs.com/package/@upstash/redis) -- version verified
- [npm registry: @upstash/ratelimit 2.0.8](https://www.npmjs.com/package/@upstash/ratelimit) -- version verified (not used)
- [Redis INCR command](https://redis.io/docs/latest/commands/incr/) -- atomicity guarantee
- [Upstash Redis GitHub README](https://github.com/upstash/redis-js) -- initialization patterns
- [Upstash Next.js tutorial](https://upstash.com/docs/redis/tutorials/nextjs_with_redis) -- counter pattern
- [PostgreSQL CREATE FUNCTION docs](https://www.postgresql.org/docs/current/sql-createfunction.html) -- parameter default compatibility
- [Upstash pricing page](https://upstash.com/pricing/redis) -- 500K commands/month free tier (updated March 2025)

### Secondary (MEDIUM confidence)
- [Upstash blog: view counter with App Router](https://upstash.com/blog/nextjs13-approuter-view-counter) -- INCR pattern in Next.js
- Existing codebase patterns: `src/lib/env.ts`, `src/lib/db/queries.ts`, `src/lib/battle/session.ts`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Upstash Redis is the locked choice from Phase 1 context. Version verified via npm.
- Architecture: HIGH -- Patterns follow existing codebase conventions. Season gate, counter, and admin auth are all straightforward.
- Pitfalls: HIGH -- Race conditions and PostgreSQL function signatures are well-understood. Upstash free tier confirmed generous enough.

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable domain, no fast-moving dependencies)
