---
phase: 01-foundation-ai-integration
plan: 01
subsystem: foundation
tags: [next.js, typescript, supabase, zod, ai-sdk, tailwind, biome, postgresql]

# Dependency graph
requires: []
provides:
  - Next.js 16 project scaffold with Turbopack builds
  - Zod-validated environment variables (env.ts)
  - Shared TypeScript types for Battle, Vote, BudgetModelId, BattleStatus
  - Supabase PostgreSQL schema (battles + votes tables)
  - Type-safe database query functions (insertBattle, updateBattleResponse, updateBattleStatus, insertVote, getBattleById)
  - Biome linter/formatter configuration
affects: [01-02, 01-03, 02-battle-loop, all-future-phases]

# Tech tracking
tech-stack:
  added: [next@16.2.2, react@19.2.4, ai@6.0.149, "@ai-sdk/openai@3.0.51", "@ai-sdk/anthropic@3.0.67", "@ai-sdk/google@3.0.59", "@ai-sdk/react@3.0.151", "@supabase/supabase-js@2.102.1", "zod@3.25.76", "nanoid@5.1.7", "@biomejs/biome@2.4.10", "tailwindcss@4.x", "typescript@5.x"]
  patterns: [lazy-env-validation-proxy, server-only-supabase-client, type-safe-query-functions]

key-files:
  created:
    - src/lib/env.ts
    - src/lib/types.ts
    - src/lib/db/client.ts
    - src/lib/db/queries.ts
    - supabase/migrations/00001_create_battles.sql
    - biome.json
    - .env.local.example
    - src/app/layout.tsx
    - src/app/page.tsx
  modified:
    - .gitignore
    - package.json
    - tsconfig.json

key-decisions:
  - "Lazy env validation via Proxy so next build succeeds without env vars present; runtime access triggers validation"
  - "Replaced Python-centric .gitignore with Node.js/Next.js-focused one"
  - "Removed ESLint config from create-next-app scaffold, using Biome exclusively"
  - "Used src/ directory structure with @/* path alias mapped to ./src/*"

patterns-established:
  - "Lazy Proxy env: import { env } from '@/lib/env' triggers zod validation on first property access"
  - "Server-only DB client: src/lib/db/client.ts uses service role key, must not be imported in client components"
  - "Type-safe queries: all DB operations via exported async functions in src/lib/db/queries.ts"
  - "Budget model IDs as const tuple: BUDGET_MODELS array with BudgetModelId union type"

requirements-completed: [DATA-01]

# Metrics
duration: 8min
completed: 2026-04-08
---

# Phase 01 Plan 01: Project Foundation Summary

**Next.js 16 scaffold with AI SDK 6, Supabase schema (battles+votes), Zod env validation, and type-safe query layer**

## Performance

- **Duration:** 8 min
- **Started:** 2026-04-07T17:24:38Z
- **Completed:** 2026-04-07T17:33:11Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments
- Next.js 16.2.2 project with Turbopack, React 19.2, Tailwind CSS 4, and Biome linting
- All Phase 1 dependencies installed: AI SDK 6 + 3 provider packages, Supabase client, zod, nanoid
- Zod environment validation with lazy Proxy pattern ensuring build compatibility
- Shared TypeScript types: Battle, Vote, BudgetModelId, BattleStatus, StreamRequest
- Supabase PostgreSQL migration with battles/votes tables, CHECK constraints, and query indexes
- Five type-safe query functions: insertBattle, updateBattleResponse, updateBattleStatus, insertVote, getBattleById

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Next.js 16 project with dependencies, env validation, and shared types** - `10d7a96` (feat)
2. **Task 2: Create Supabase database schema, client, and query layer** - `d9c99c5` (feat)

## Files Created/Modified
- `package.json` - K-Index project with all Phase 1 dependencies
- `tsconfig.json` - TypeScript config with src/ path alias
- `biome.json` - Biome linter/formatter config
- `next.config.ts` - Next.js 16 config (default Turbopack)
- `.env.local.example` - Documents all 6 required environment variables
- `.gitignore` - Node.js/Next.js focused ignore rules
- `postcss.config.mjs` - PostCSS with Tailwind CSS 4 plugin
- `src/lib/env.ts` - Zod environment validation with lazy Proxy
- `src/lib/types.ts` - Shared TypeScript types (Battle, Vote, BudgetModelId, BattleStatus)
- `src/app/layout.tsx` - Root layout with Geist fonts, Korean lang attribute
- `src/app/page.tsx` - Minimal placeholder page
- `src/app/globals.css` - Tailwind CSS base styles
- `supabase/migrations/00001_create_battles.sql` - Battles + votes tables with constraints and indexes
- `src/lib/db/client.ts` - Server-side Supabase client (service role key)
- `src/lib/db/queries.ts` - Type-safe CRUD query functions

## Decisions Made
- **Lazy env validation:** Used a Proxy-based lazy pattern for `env` export so that `next build` succeeds during static page generation without requiring all env vars. Runtime access (Route Handlers, server components) triggers zod validation on first property access. This avoids the common "build fails without env vars" problem.
- **Removed ESLint entirely:** The create-next-app scaffold included eslint and eslint-config-next. Since the plan specifies Biome as the linter (Next.js 16 removed `next lint`), these were removed from package.json and the lint script now uses Biome.
- **src/ directory structure:** Configured tsconfig.json path alias `@/*` to map to `./src/*` for cleaner project organization, matching the recommended project structure from RESEARCH.md.
- **zod v3 (not v4):** RESEARCH.md cited zod 4.3.6 but the npm-resolved version is 3.25.76 (latest stable v3). The `z.object().parse()` API is identical in v3 and fully meets the plan's requirements. zod v4 is a separate package with different import semantics.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced Python .gitignore with Node.js/Next.js version**
- **Found during:** Task 1 (project scaffold)
- **Issue:** The repo was initialized with a Python-centric .gitignore that lacked node_modules/, .next/, .env.local patterns
- **Fix:** Replaced with a comprehensive Node.js/Next.js .gitignore, retaining essential Python entries at the bottom
- **Files modified:** .gitignore
- **Verification:** `git status` correctly ignores node_modules/, .next/
- **Committed in:** 10d7a96 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Lazy env validation for build compatibility**
- **Found during:** Task 1 (env.ts creation)
- **Issue:** Plan specified `envSchema.parse(process.env)` at module level, which would fail during `next build` static generation when env vars aren't set
- **Fix:** Implemented lazy Proxy pattern that defers validation to first runtime access
- **Files modified:** src/lib/env.ts
- **Verification:** `npm run build` succeeds without env vars; runtime access would trigger validation
- **Committed in:** 10d7a96 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 missing critical)
**Impact on plan:** Both necessary for correctness. No scope creep. The lazy env pattern preserves the plan's intent (fail fast on missing vars) while enabling builds to succeed.

## Issues Encountered
None - both tasks executed smoothly.

## User Setup Required

**External services require manual configuration.** Before running `npm run dev`:
1. Create a Supabase project at https://supabase.com/dashboard
2. Copy `.env.local.example` to `.env.local`
3. Fill in all 6 environment variables from their respective dashboards:
   - `OPENAI_API_KEY` from OpenAI dashboard
   - `ANTHROPIC_API_KEY` from Anthropic console
   - `GOOGLE_GENERATIVE_AI_API_KEY` from Google AI Studio
   - `NEXT_PUBLIC_SUPABASE_URL` from Supabase Project Settings > API
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase Project Settings > API
   - `SUPABASE_SERVICE_ROLE_KEY` from Supabase Project Settings > API
4. Run the SQL migration in `supabase/migrations/00001_create_battles.sql` against your Supabase database

## Next Phase Readiness
- Project foundation complete: Next.js 16 builds and runs
- AI SDK packages installed, ready for provider registry setup in Plan 02
- Database schema designed, ready for push to Supabase in Plan 03
- Type contracts established: Battle, Vote, BudgetModelId shared across all plans
- Query layer ready: insertBattle, updateBattleResponse, updateBattleStatus, insertVote, getBattleById

## Self-Check: PASSED

- All 15 created/modified files verified present on disk
- Commit 10d7a96 (Task 1) verified in git log
- Commit d9c99c5 (Task 2) verified in git log
- `npm run build` passes without errors
- `npx tsc --noEmit` passes without type errors

---
*Phase: 01-foundation-ai-integration*
*Completed: 2026-04-08*
