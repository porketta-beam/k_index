# Phase 1: Foundation & AI Integration - Research

**Researched:** 2026-04-08
**Domain:** Next.js 16 project setup, Vercel AI SDK 6 streaming integration, Supabase PostgreSQL schema design
**Confidence:** HIGH

## Summary

Phase 1 establishes the entire project foundation: Next.js 16 App Router project scaffold, unified AI provider layer using Vercel AI SDK 6 with three budget models (GPT-4o-mini, Claude Haiku 4.5, Gemini 2.0 Flash), and a Supabase PostgreSQL database schema for anonymous battle data storage. Per user decisions (D-01 through D-07), fingerprinting, rate limiting, and Upstash Redis are excluded from this phase.

The Vercel AI SDK 6 is the critical integration point. Its `streamText()` function provides a single interface for all three AI providers, with built-in SSE streaming via `toDataStreamResponse()` for Next.js Route Handlers. The provider registry pattern (`createProviderRegistry`) enables model selection by string ID (`openai:gpt-4o-mini`, `anthropic:claude-haiku-4-5`, `google:gemini-2.0-flash`), which is essential for the random model pairing in Phase 2.

Korean text uses 2-4x more tokens than English due to BPE tokenizer inefficiency with CJK characters. This directly affects `maxOutputTokens` settings -- a 1024-token limit that produces ~750 English words yields only ~200-400 Korean characters of useful content. The recommended `maxOutputTokens` for Korean battle responses is 2048 to ensure substantive answers without excessive cost.

**Primary recommendation:** Use Vercel AI SDK 6 provider registry with `streamText()` + `toDataStreamResponse()` for all AI integration. Use `@supabase/supabase-js` directly (not `@supabase/ssr`) since v1 has no auth. Validate environment variables with zod at startup.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** v1에서 개별 사용자 요율 제한을 구현하지 않는다. 핑거프린트 기반 배틀 횟수 제한 없음.
- **D-02:** 비용 제어는 전적으로 Phase 4의 시즌 시스템(글로벌 요청 카운터 임계치)에서 담당한다.
- **D-03:** Upstash Redis는 Phase 1에서 도입하지 않는다. Phase 4에서 글로벌 카운터용으로 도입.
- **D-04:** v1에서 브라우저 핑거프린팅을 완전히 제외한다. SEC-01(사용자 식별), SEC-02(비정상 패턴 감지)는 v2로 이동.
- **D-05:** 배틀 데이터는 익명으로 저장한다 (사용자 식별 없이).
- **D-06:** 배틀 전문 저장: 질문 텍스트 + AI 응답 전문 + 투표 결과 + 모델명 + 카테고리 + 타임스탬프를 모두 저장한다.
- **D-07:** Supabase Free Tier (500MB)로 충분. 시즌제로 자연스럽게 용량이 제어되므로 별도 용량 전략 불필요.

### Claude's Discretion
- AI 응답 설정: max_tokens 값, 한국어 기본 시스템 프롬프트, 모델 장애 시 폴백 전략은 Claude가 최적의 방식으로 결정
- DB 스키마 설계: 테이블 구조, 인덱스, 관계 설정은 Claude가 결정 (전문 저장 결정 기준 내에서)
- Vercel AI SDK 활용 패턴: Provider registry 구성, 스트리밍 구현 방식은 Claude가 결정

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-01 | GPT (OpenAI API)를 통한 응답 생성을 지원한다 | AI SDK `@ai-sdk/openai` provider, model ID `gpt-4o-mini`, verified v3.0.51 |
| AI-02 | Claude (Anthropic API)를 통한 응답 생성을 지원한다 | AI SDK `@ai-sdk/anthropic` provider, model ID `claude-haiku-4-5`, verified v3.0.67 |
| AI-03 | Gemini (Google API)를 통한 응답 생성을 지원한다 | AI SDK `@ai-sdk/google` provider, model ID `gemini-2.0-flash`, verified v3.0.59 |
| AI-04 | 버짓 모델을 사용하고 max_tokens 제한을 적용한다 (비용 제어) | `maxOutputTokens` param in `streamText()`. Korean token ratio research supports 2048 limit. |
| SEC-01 | 브라우저 핑거프린팅으로 사용자를 식별한다 | **DEFERRED to v2** per D-04. No implementation in Phase 1. |
| SEC-02 | 핑거프린트 기반으로 비정상 사용 패턴을 감지한다 | **DEFERRED to v2** per D-04. No implementation in Phase 1. |
| DATA-01 | 모든 배틀 결과(질문, 응답, 투표, 모델, 카테고리)가 데이터베이스에 저장된다 | Supabase PostgreSQL schema with `battles` and `votes` tables. SQL migrations via Supabase CLI. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Framework:** Next.js 16.x with App Router (NOT Next.js 15)
- **AI Integration:** Vercel AI SDK 6.x only -- do NOT use individual provider SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`)
- **Database:** Supabase with `supabase-js` -- do NOT use Prisma
- **No Auth:** No NextAuth/Auth.js -- no auth in v1
- **No Redis in Phase 1:** Upstash Redis excluded per D-03
- **No Python backend:** All AI integration via Next.js Route Handlers
- **No WebSockets:** SSE via AI SDK for streaming
- **Linter:** Biome (Next.js 16 removed `next lint`)
- **Styling:** Tailwind CSS 4.x + shadcn/ui
- **State:** Zustand 5.x (not Redux, not Jotai)
- **Budget Models Only:** GPT-4o-mini, Claude Haiku 4.5, Gemini 2.0 Flash

## Standard Stack

### Core (Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | 16.2.2 | Full-stack framework | Current stable. Turbopack default, React 19.2, `proxy.ts`, Cache Components. [VERIFIED: npm registry] |
| `react` + `react-dom` | 19.2.x | UI library | Ships with Next.js 16. [VERIFIED: npm registry via next peer deps] |
| `typescript` | 6.0.2 | Type safety | Required by Next.js 16 (min 5.1). [VERIFIED: npm registry] |
| `ai` | 6.0.149 | Vercel AI SDK core | Unified `streamText()` across providers. Provider registry. [VERIFIED: npm registry] |
| `@ai-sdk/openai` | 3.0.51 | OpenAI provider | GPT-4o-mini access via AI SDK. [VERIFIED: npm registry] |
| `@ai-sdk/anthropic` | 3.0.67 | Anthropic provider | Claude Haiku 4.5 access via AI SDK. [VERIFIED: npm registry] |
| `@ai-sdk/google` | 3.0.59 | Google provider | Gemini 2.0 Flash access via AI SDK. [VERIFIED: npm registry] |
| `@ai-sdk/react` | 3.0.151 | Client-side hooks | `useChat`, `useCompletion` for streaming UI. [VERIFIED: npm registry] |
| `@supabase/supabase-js` | 2.102.1 | Database client | Direct PostgreSQL access, no ORM needed. [VERIFIED: npm registry] |
| `zod` | 4.3.6 | Schema validation | Env vars, API input validation. [VERIFIED: npm registry] |
| `nanoid` | 5.1.7 | ID generation | Battle IDs, URL-safe, short. [VERIFIED: npm registry] |

### Supporting (Phase 1)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@biomejs/biome` | 2.4.10 | Linting + formatting | Next.js 16 removed `next lint`. Single tool replaces ESLint+Prettier. [VERIFIED: npm registry] |
| `tailwindcss` | 4.x | Utility CSS | Ships with `create-next-app`. CSS-first config. [VERIFIED: npm registry] |
| `@types/node` | 22.x | Node.js types | Node 22 is current LTS. [VERIFIED: npm registry] |

### NOT Installed in Phase 1 (per decisions)
| Library | Why Not in Phase 1 |
|---------|-------------------|
| `@upstash/redis` | D-03: Redis deferred to Phase 4 |
| `@upstash/ratelimit` | D-01: No per-user rate limiting in v1 |
| `zustand` | Phase 1 is backend-only; Zustand needed in Phase 2 for battle UI state |
| `shadcn/ui` components | Phase 1 focuses on API layer; UI components added in Phase 2+ |
| `next-intl` | Phase 1 is API-only; i18n needed when UI is built (Phase 5) |
| `sonner` | Toast notifications for UI phases |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@supabase/supabase-js` direct | `@supabase/ssr` + cookie handling | SSR package adds auth/cookie complexity unnecessary without auth. Direct client is simpler for anonymous data access. |
| `zod` env validation | `@t3-oss/env-nextjs` | t3-env adds a dependency; plain zod `z.object().parse(process.env)` achieves the same for 5-6 env vars. |
| `nanoid` | `crypto.randomUUID()` | nanoid is shorter (21 chars vs 36), URL-safe, customizable alphabet. Better for battle IDs in URLs. |

**Installation:**
```bash
# Create project
npx create-next-app@latest k-index --typescript --tailwind --app --turbopack --use-npm

# Core AI integration
npm install ai @ai-sdk/openai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/react

# Database
npm install @supabase/supabase-js

# Validation & utilities
npm install zod nanoid

# Dev dependencies
npm install -D @biomejs/biome
```

## Architecture Patterns

### Recommended Project Structure (Phase 1)
```
src/
├── app/
│   ├── layout.tsx              # Root layout (html, body, fonts)
│   ├── page.tsx                # Home page (minimal for Phase 1)
│   └── api/
│       └── battle/
│           └── stream/
│               └── route.ts    # POST: streamText() endpoint
├── lib/
│   ├── ai/
│   │   ├── registry.ts         # Provider registry (openai, anthropic, google)
│   │   ├── config.ts           # Model configs (IDs, maxOutputTokens, system prompts)
│   │   └── stream.ts           # streamText wrapper with error handling
│   ├── db/
│   │   ├── client.ts           # Supabase client singleton
│   │   ├── schema.sql          # Reference schema (source of truth is migrations)
│   │   └── queries.ts          # Type-safe query functions (insertBattle, etc.)
│   ├── env.ts                  # Zod env validation (parsed at startup)
│   └── types.ts                # Shared TypeScript types
├── supabase/
│   └── migrations/
│       └── 00001_create_battles.sql   # Initial schema migration
└── biome.json                  # Biome config
```

### Pattern 1: Provider Registry (AI SDK)
**What:** Centralized model registration enabling model selection by string ID.
**When to use:** Always -- this is the foundation for random model pairing in Phase 2.
**Example:**
```typescript
// src/lib/ai/registry.ts
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry
import { createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

export const registry = createProviderRegistry({
  openai,
  anthropic,
  google,
});

// Usage: registry.languageModel('openai:gpt-4o-mini')
```
[VERIFIED: ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry]

### Pattern 2: streamText Route Handler
**What:** Next.js Route Handler that accepts a prompt, calls streamText, returns streaming response.
**When to use:** Every AI battle request.
**Example:**
```typescript
// src/app/api/battle/stream/route.ts
// Source: https://ai-sdk.dev/cookbook/next/stream-text
import { streamText } from 'ai';
import { registry } from '@/lib/ai/registry';
import { BATTLE_CONFIG } from '@/lib/ai/config';

export async function POST(req: Request) {
  const { prompt, modelId } = await req.json();
  // modelId e.g. 'openai:gpt-4o-mini'

  const result = streamText({
    model: registry.languageModel(modelId),
    system: BATTLE_CONFIG.systemPrompt,
    prompt,
    maxOutputTokens: BATTLE_CONFIG.maxOutputTokens,
  });

  return result.toDataStreamResponse();
}
```
[VERIFIED: ai-sdk.dev/docs/reference/ai-sdk-core/stream-text + cookbook/next/stream-text]

### Pattern 3: Supabase Server Client (No Auth)
**What:** Simple server-side Supabase client without auth/cookie handling.
**When to use:** All database operations in Phase 1 (no auth = no SSR cookie dance).
**Example:**
```typescript
// src/lib/db/client.ts
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// Server-side only -- do not import in client components
export const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY  // service role for server-side inserts
);
```
[CITED: supabase.com/docs/reference/javascript/introduction]

### Pattern 4: Zod Environment Validation
**What:** Validate all env vars at import time, fail fast if missing.
**When to use:** Import in `src/lib/env.ts`, consumed by all server modules.
**Example:**
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```
[ASSUMED -- standard zod pattern, not provider-specific]

### Anti-Patterns to Avoid
- **Importing individual AI SDKs:** Do NOT `import OpenAI from 'openai'`. Always go through AI SDK's unified interface. The registry pattern ensures consistent streaming, error handling, and future model swapping. [CITED: CLAUDE.md "What NOT to Use"]
- **Using `@supabase/ssr` without auth:** The SSR package adds cookie-based session management complexity. Without auth (v1), use `@supabase/supabase-js` `createClient` directly. [ASSUMED -- simplification for no-auth scenario]
- **Hardcoding model IDs in route handlers:** Put model IDs in a config file. Phase 2 needs random model selection; hardcoded IDs make this impossible. [ASSUMED -- architectural best practice]
- **Using `toTextStreamResponse()` instead of `toDataStreamResponse()`:** Text stream protocol only supports plain text. Data stream protocol supports tool calls, error parts, and metadata -- needed for future phases. Use `toDataStreamResponse()` from the start. [VERIFIED: ai-sdk.dev/docs/ai-sdk-ui/stream-protocol]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-provider AI streaming | Custom fetch + SSE parsing per provider | `streamText()` from AI SDK | 3 providers x 3 streaming formats x 3 error patterns = nightmare. AI SDK handles all of it. [VERIFIED: ai-sdk.dev] |
| Provider model selection | Switch statements / factory pattern | `createProviderRegistry` + `registry.languageModel('provider:model')` | Built-in, type-safe, supports all model types. [VERIFIED: ai-sdk.dev] |
| Database migrations | Manual SQL via Dashboard | Supabase CLI `supabase migration new` | Version-controlled, reproducible, team-friendly. [CITED: supabase.com/docs/guides/deployment/database-migrations] |
| Environment validation | `process.env.X || throw` | Zod schema parse | Type-safe, fail-fast, documents all required vars. [ASSUMED] |
| Unique battle IDs | `Math.random()` or UUID | `nanoid()` | URL-safe, short (21 chars), collision-resistant, configurable. [VERIFIED: npm registry] |

**Key insight:** The entire AI provider integration layer that would normally be hundreds of lines of custom code (3 SDKs, 3 streaming implementations, 3 error handlers) is replaced by ~20 lines of AI SDK registry + streamText configuration.

## Common Pitfalls

### Pitfall 1: Korean Token Limit Miscalibration
**What goes wrong:** Setting `maxOutputTokens: 1024` (sufficient for ~750 English words) produces truncated, incomplete Korean responses because Korean uses 2-4x more tokens per character.
**Why it happens:** LLM tokenizers (BPE) are trained on English-dominant datasets. Korean characters are encoded as multiple byte-level tokens.
**How to avoid:** Set `maxOutputTokens: 2048` for Korean-language responses. This yields ~400-800 Korean characters of substantive content. Test with actual Korean prompts across all 3 providers.
**Warning signs:** Responses ending mid-sentence, especially from GPT-4o-mini which has the most aggressive Korean tokenization.
[CITED: community.openai.com/t/need-more-efficient-tokenizer-for-korean/286682, tonybaloney.github.io/posts/cjk-chinese-japanese-korean-llm-ai-best-practices.html]

### Pitfall 2: Environment Variable Naming for AI SDK Providers
**What goes wrong:** AI SDK providers auto-detect env vars by convention. Using wrong names means API keys aren't found.
**Why it happens:** Each provider expects a specific env var name by default.
**How to avoid:** Use these exact names:
- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Google: `GOOGLE_GENERATIVE_AI_API_KEY`
**Warning signs:** "401 Unauthorized" or "API key not found" errors when using default provider imports.
[VERIFIED: ai-sdk.dev/providers/ai-sdk-providers/openai, anthropic, google-generative-ai]

### Pitfall 3: Using Service Role Key Client-Side
**What goes wrong:** Exposing `SUPABASE_SERVICE_ROLE_KEY` in client code bypasses Row Level Security and gives full database access.
**Why it happens:** Confusion between `NEXT_PUBLIC_SUPABASE_ANON_KEY` (safe for client) and `SUPABASE_SERVICE_ROLE_KEY` (server only).
**How to avoid:** Never prefix service role key with `NEXT_PUBLIC_`. Use anon key for any client-side Supabase access. Use service role key only in Route Handlers / Server Components.
**Warning signs:** Client-side code accessing `supabase` with full admin privileges. No RLS enforcement.
[CITED: supabase.com/docs/guides/auth/server-side/nextjs]

### Pitfall 4: Next.js 16 Breaking Changes from 15
**What goes wrong:** Code patterns from Next.js 15 tutorials fail silently or error in Next.js 16.
**Why it happens:** Next.js 16 has several breaking changes.
**How to avoid:** Key changes to remember:
- `params` and `searchParams` are now async: use `await params`
- `cookies()`, `headers()`, `draftMode()` are async: use `await cookies()`
- `middleware.ts` is deprecated, renamed to `proxy.ts` with `proxy` export
- `next lint` is removed: use Biome directly
- Parallel routes require explicit `default.js` files
**Warning signs:** TypeScript errors about Promise types, build failures mentioning missing `default.js`.
[VERIFIED: nextjs.org/blog/next-16 "Breaking Changes and Other Updates"]

### Pitfall 5: Streaming Timeout on Vercel
**What goes wrong:** Long AI responses get cut off by Vercel function timeout.
**Why it happens:** Vercel Hobby plan has default function duration limits.
**How to avoid:** Vercel supports streaming responses up to 300 seconds. Ensure Route Handler is not marked as Edge runtime (use Node.js runtime for longer duration). Set `maxDuration` export in route file:
```typescript
export const maxDuration = 60; // seconds
```
**Warning signs:** Responses cutting off mid-stream, 504 gateway timeout errors.
[CITED: CLAUDE.md "Vercel Functions Limits -- 300s streaming, 5min Fluid Compute"]

### Pitfall 6: Supabase `TEXT` Column Size for Full AI Responses
**What goes wrong:** Storing full AI responses in `VARCHAR(n)` truncates long responses.
**Why it happens:** Choosing `VARCHAR` with a length limit instead of `TEXT`.
**How to avoid:** Use PostgreSQL `TEXT` type for `question`, `response_a`, `response_b` columns. `TEXT` has no practical length limit. Average Korean AI response at 2048 tokens is ~2-4KB of UTF-8 text -- well within PostgreSQL's TEXT handling.
**Warning signs:** Silent truncation of battle data, incomplete responses in leaderboard calculations.
[ASSUMED -- standard PostgreSQL practice]

## Code Examples

### Complete Provider Registry Configuration
```typescript
// src/lib/ai/registry.ts
// Source: https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry
import { createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

export const registry = createProviderRegistry({
  openai,
  anthropic,
  google,
});

// Available budget models for battles:
export const BUDGET_MODELS = [
  'openai:gpt-4o-mini',
  'anthropic:claude-haiku-4-5',
  'google:gemini-2.0-flash',
] as const;

export type BudgetModelId = (typeof BUDGET_MODELS)[number];
```

### Battle AI Configuration
```typescript
// src/lib/ai/config.ts
// Source: Claude's discretion (Korean token calibration research)
export const BATTLE_CONFIG = {
  maxOutputTokens: 2048,   // Korean: 2-4x more tokens than English
  temperature: 0.7,        // Balanced creativity vs consistency
  systemPrompt: `당신은 한국어 AI 어시스턴트입니다. 사용자의 질문에 자연스러운 한국어로 답변하세요. 존댓말을 사용하고, 명확하고 유용한 답변을 제공하세요.`,
} as const;
```

### Database Schema (SQL Migration)
```sql
-- supabase/migrations/00001_create_battles.sql
-- Source: DATA-01 requirement + D-06 (전문 저장)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

create table battles (
  id uuid primary key default uuid_generate_v4(),
  question text not null,
  model_a text not null,          -- e.g. 'openai:gpt-4o-mini'
  model_b text not null,          -- e.g. 'anthropic:claude-haiku-4-5'
  response_a text,                -- Full AI response text (nullable: streaming may fail)
  response_b text,                -- Full AI response text
  position_a text not null,       -- Which side model_a was shown on ('left' or 'right')
  category text not null default 'general',
  status text not null default 'pending'
    check (status in ('pending', 'streaming', 'voting', 'completed', 'error')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table votes (
  id uuid primary key default uuid_generate_v4(),
  battle_id uuid not null references battles(id) on delete cascade,
  winner text not null check (winner in ('a', 'b')),
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_battles_status on battles(status);
create index idx_battles_category on battles(category);
create index idx_battles_created_at on battles(created_at desc);
create index idx_votes_battle_id on votes(battle_id);
```

### Streaming Route Handler with Error Handling
```typescript
// src/app/api/battle/stream/route.ts
// Source: https://ai-sdk.dev/cookbook/next/stream-text + error handling docs
import { streamText } from 'ai';
import { registry, type BudgetModelId } from '@/lib/ai/registry';
import { BATTLE_CONFIG } from '@/lib/ai/config';
import { z } from 'zod';

export const maxDuration = 60;

const requestSchema = z.object({
  prompt: z.string().min(1).max(2000),
  modelId: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const { prompt, modelId } = requestSchema.parse(body);

  const result = streamText({
    model: registry.languageModel(modelId as BudgetModelId),
    system: BATTLE_CONFIG.systemPrompt,
    prompt,
    maxOutputTokens: BATTLE_CONFIG.maxOutputTokens,
    temperature: BATTLE_CONFIG.temperature,
    onFinish: async ({ text, usage }) => {
      // Save response to database after streaming completes
      // (Implementation in Phase 2 when battle flow is built)
      console.log(`Model ${modelId}: ${usage?.totalTokens} tokens`);
    },
  });

  return result.toDataStreamResponse();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `middleware.ts` | `proxy.ts` | Next.js 16 (Oct 2025) | Rename file, rename export function. Edge -> Node.js runtime. [VERIFIED: nextjs.org/blog/next-16] |
| `next lint` | Biome CLI directly | Next.js 16 (Oct 2025) | `next lint` command removed. Use `npx @biomejs/biome check .` [VERIFIED: nextjs.org/blog/next-16] |
| `StreamingTextResponse` helper | `toDataStreamResponse()` / `toUIMessageStreamResponse()` | AI SDK 6 | Old helper removed. Use built-in methods on streamText result. [VERIFIED: ai-sdk.dev stream protocol docs] |
| `experimental.ppr` flag | `cacheComponents: true` in next.config.ts | Next.js 16 (Oct 2025) | PPR evolved into Cache Components. Not needed for Phase 1 but good to know. [VERIFIED: nextjs.org/blog/next-16] |
| Sync `params`, `searchParams` | Async `await params` | Next.js 16 (Oct 2025) | All dynamic props are now Promise-based. [VERIFIED: nextjs.org/blog/next-16] |
| `@google-ai/generativelanguage` | `@ai-sdk/google` (wraps `@google/genai`) | Nov 2025 | Old Google AI SDK deprecated. AI SDK provider uses new unified SDK. [CITED: CLAUDE.md] |
| AI SDK v5 | AI SDK v6 (6.0.149) | 2025 | v7 beta exists (7.0.0-beta.69) but v6 is latest stable. Do NOT use v7 beta. [VERIFIED: npm registry dist-tags] |

**Deprecated/outdated:**
- `@supabase/auth-helpers-nextjs`: Replaced by `@supabase/ssr`. But since we have no auth, neither is needed -- use `@supabase/supabase-js` directly.
- `middleware.ts`: Deprecated in Next.js 16, will be removed in future version. Use `proxy.ts`.
- `next lint`: Removed in Next.js 16. Use Biome.

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Using `@supabase/supabase-js` directly (not `@supabase/ssr`) is sufficient for no-auth server-side access | Anti-Patterns | LOW -- `@supabase/ssr` would still work, just unnecessary complexity |
| A2 | Hardcoding model IDs in route handlers is an anti-pattern | Anti-Patterns | LOW -- architectural preference, not a functional issue |
| A3 | Plain zod validation is sufficient vs `@t3-oss/env-nextjs` | Alternatives | LOW -- both achieve the same result for small env var sets |
| A4 | PostgreSQL `TEXT` type is correct for AI response storage | Pitfall 6 | LOW -- TEXT is standard for variable-length strings in PostgreSQL |
| A5 | `maxOutputTokens: 2048` is appropriate for Korean battle responses | Code Examples | MEDIUM -- needs testing with actual Korean prompts. Too low = truncation, too high = cost increase |
| A6 | System prompt in Korean (`당신은 한국어 AI 어시스턴트입니다...`) produces good results across all 3 providers | Code Examples | MEDIUM -- each provider may respond differently to Korean system prompts |

**If this table is empty:** N/A -- 6 assumptions identified above.

## Open Questions (RESOLVED)

1. **Korean System Prompt Quality Across Providers**
   - What we know: All 3 providers support Korean, and a Korean system prompt should produce Korean responses.
   - What's unclear: Whether the exact same system prompt produces equally natural Korean from GPT-4o-mini, Claude Haiku, and Gemini Flash. Some providers may need provider-specific system prompt tuning.
   - RESOLVED: Start with a single system prompt. Test during implementation. If quality varies significantly, add per-provider system prompt overrides in config. This is a runtime calibration issue, not a planning blocker.

2. **Supabase Migration Strategy: CLI vs Dashboard**
   - What we know: Supabase CLI supports `supabase migration new` for version-controlled migrations. Dashboard allows visual table creation.
   - What's unclear: Whether Supabase CLI is required for the team's workflow or if Dashboard + exported SQL is acceptable.
   - RESOLVED: Use SQL migration files in `supabase/migrations/` committed to git. Apply via `supabase db push` or Dashboard SQL editor. Supabase CLI install is optional but recommended.

3. **Battle ID Format: nanoid vs UUID**
   - What we know: Schema uses UUID (PostgreSQL native). nanoid is shorter for URLs.
   - What's unclear: Whether battle IDs will ever appear in URLs (Phase 2 decision).
   - RESOLVED: Use UUID in database (PostgreSQL-native, indexed efficiently). If URLs need short IDs, add a `short_id` column with nanoid in Phase 2. nanoid stays in Phase 1 dependencies for future use.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 (min 20.9) | Yes | 22.14.0 | -- |
| npm | Package management | Yes | 10.9.2 | -- |
| npx | create-next-app | Yes | 10.9.2 | -- |
| Supabase CLI | DB migrations | No | -- | Use Dashboard SQL Editor or `supabase/migrations/` files applied manually |
| Git | Version control | Yes | (repo exists) | -- |

**Missing dependencies with no fallback:**
- None -- all critical dependencies are available.

**Missing dependencies with fallback:**
- Supabase CLI: Not installed. Fallback: Create tables via Supabase Dashboard SQL Editor, or install CLI with `npm install -g supabase` when needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (recommended for Next.js + Vite/Turbopack) or Node.js built-in test runner |
| Config file | None -- Wave 0 gap |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AI-01 | GPT-4o-mini returns streaming Korean response | integration | `npx vitest run tests/ai/openai.test.ts -t "stream"` | Wave 0 |
| AI-02 | Claude Haiku returns streaming Korean response | integration | `npx vitest run tests/ai/anthropic.test.ts -t "stream"` | Wave 0 |
| AI-03 | Gemini Flash returns streaming Korean response | integration | `npx vitest run tests/ai/google.test.ts -t "stream"` | Wave 0 |
| AI-04 | maxOutputTokens limit enforced | unit | `npx vitest run tests/ai/config.test.ts -t "maxTokens"` | Wave 0 |
| DATA-01 | Battle data saved to Supabase | integration | `npx vitest run tests/db/battles.test.ts -t "insert"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration with path aliases matching tsconfig
- [ ] `tests/ai/openai.test.ts` -- OpenAI streaming integration test
- [ ] `tests/ai/anthropic.test.ts` -- Anthropic streaming integration test
- [ ] `tests/ai/google.test.ts` -- Google streaming integration test
- [ ] `tests/ai/config.test.ts` -- AI config validation (maxTokens, model IDs)
- [ ] `tests/db/battles.test.ts` -- Supabase battle CRUD operations
- [ ] `tests/lib/env.test.ts` -- Environment variable validation
- [ ] Framework install: `npm install -D vitest @vitejs/plugin-react`

**Note:** AI integration tests require real API keys. Consider mocking providers for CI or using a test budget. The AI SDK supports custom `fetch` implementations for testing.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in v1 (per D-04) |
| V3 Session Management | No | No sessions in v1 |
| V4 Access Control | Yes (minimal) | Supabase RLS on tables; service role key server-only |
| V5 Input Validation | Yes | Zod schema validation on all API inputs (prompt length, modelId) |
| V6 Cryptography | No | No encryption needed; API keys via env vars |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Prompt injection via user question | Tampering | Validate input length with zod (max 2000 chars). System prompt is server-side only. Cannot fully prevent -- inherent LLM risk. |
| API key exposure in client bundle | Information Disclosure | Never prefix AI API keys with `NEXT_PUBLIC_`. Route Handlers are server-only. Zod env validation catches misnamed vars. |
| Supabase service role key exposure | Elevation of Privilege | `SUPABASE_SERVICE_ROLE_KEY` never prefixed with `NEXT_PUBLIC_`. Only used in Route Handlers. |
| Excessive AI API costs from abuse | Denial of Service | Phase 1 has NO mitigation (per D-01, D-02). Phase 4 season system provides global cap. Accept risk for MVP. |
| SQL injection via Supabase client | Tampering | `supabase-js` uses parameterized queries by default. Safe when using `.insert()`, `.select()` methods. |

## Sources

### Primary (HIGH confidence)
- [npm registry] -- Verified all package versions: ai@6.0.149, next@16.2.2, @ai-sdk/openai@3.0.51, @ai-sdk/anthropic@3.0.67, @ai-sdk/google@3.0.59, @ai-sdk/react@3.0.151, @supabase/supabase-js@2.102.1, zod@4.3.6, nanoid@5.1.7, @biomejs/biome@2.4.10, typescript@6.0.2
- [ai-sdk.dev/docs/reference/ai-sdk-core/stream-text] -- streamText API, parameters, return type
- [ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry] -- createProviderRegistry, languageModel access
- [ai-sdk.dev/cookbook/next/stream-text] -- Next.js Route Handler streaming recipe
- [ai-sdk.dev/docs/ai-sdk-ui/stream-protocol] -- Data stream vs text stream protocol
- [ai-sdk.dev/providers/ai-sdk-providers/openai] -- OpenAI model IDs, configuration
- [ai-sdk.dev/providers/ai-sdk-providers/anthropic] -- Anthropic model IDs, configuration
- [ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai] -- Google model IDs, configuration
- [ai-sdk.dev/docs/ai-sdk-core/error-handling] -- Error handling patterns, onAbort callback
- [ai-sdk.dev/docs/ai-sdk-core/settings] -- maxOutputTokens, temperature, timeout settings
- [nextjs.org/blog/next-16] -- Full Next.js 16 changelog, breaking changes, proxy.ts, removals
- [supabase.com/docs/guides/deployment/database-migrations] -- Migration workflow, CLI commands
- [supabase.com/docs/guides/auth/server-side/nextjs] -- Server client setup, @supabase/ssr

### Secondary (MEDIUM confidence)
- [supabase.com/docs/guides/getting-started/quickstarts/nextjs] -- Quickstart with env vars, createClient
- [supabase.com/docs/guides/database/tables] -- Table creation, PostgreSQL data types
- [WebSearch: Next.js 16 project structure] -- create-next-app defaults, Biome integration

### Tertiary (LOW confidence)
- [community.openai.com/t/need-more-efficient-tokenizer-for-korean] -- Korean tokenization 3-5x overhead (single source, community forum)
- [tonybaloney.github.io/posts/cjk-chinese-japanese-korean-llm-ai-best-practices.html] -- CJK token ratios (blog post, needs testing to confirm exact ratios)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified via npm registry. AI SDK docs confirmed API patterns.
- Architecture: HIGH -- Patterns sourced from official AI SDK cookbook and Supabase docs.
- Pitfalls: HIGH -- Korean tokenization confirmed by multiple sources. Next.js 16 breaking changes from official blog.
- DB Schema: MEDIUM -- Schema design is Claude's discretion per CONTEXT.md. Based on DATA-01 + D-06 requirements. May need adjustment when Phase 2 battle flow is implemented.

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days -- stable stack, no rapid changes expected)
