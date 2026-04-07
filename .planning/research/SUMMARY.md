# Project Research Summary

**Project:** K-Index (Korean AI Battle Arena)
**Domain:** AI Model Comparison Platform (Blind Battle Arena)
**Researched:** 2026-04-07
**Confidence:** HIGH

## Executive Summary

K-Index is a Korean-language blind AI battle arena where university students submit prompts and vote on which anonymous AI model responded better. The product is modeled on the LMSYS Chatbot Arena approach but with deliberate Korean-language specialization as the core differentiator. Research strongly confirms this type of product is well-understood: the open-source FastChat architecture, Vercel AI SDK parallel streaming patterns, and prior arena implementations provide a solid playbook. The recommended build is a single Next.js 16 full-stack application integrating three AI providers (GPT, Claude, Gemini) via the Vercel AI SDK, persisting data to Supabase, and enforcing rate limits via Upstash Redis -- all on free/generous tiers for MVP.

The biggest risk is not technical complexity but cost exposure combined with abuse. Without hard API token limits and layered rate limiting in place from day one, a single viral event can generate thousands of API calls and run up hundreds of dollars in bills within hours. The second major risk is data quality: if responses are displayed with speed or length asymmetry, or if model identity leaks before voting, the vote data becomes meaningless and the core product value -- unbiased Korean language evaluation -- is lost. Both risks are preventable with upfront architectural decisions, not expensive retrofits.

The recommended phase order mirrors the architecture dependency chain: foundation (database, AI provider layer, rate limiting) first, then the core battle loop (creation, streaming, voting, reveal), then season management and UX polish, then analytics and differentiators. Features explicitly deferred include full ELO ranking, user authentication, shareable battle cards, and multi-turn conversations -- all are tempting but out of scope for a product that has not yet proven user demand.

## Key Findings

### Recommended Stack

The stack is unified, team-familiar, and deliberately avoids introducing new technology risk. Next.js 16 with the Vercel AI SDK is the central choice: it eliminates the need for a separate Python backend, normalizes streaming across all three AI providers with a single interface, and deploys to Vercel with zero configuration friction. The Vercel AI SDK streamText() call works identically for OpenAI, Anthropic, and Google -- critical for a product that dispatches two simultaneous provider calls per battle.

Supporting infrastructure is equally clean: Supabase (PostgreSQL) for persistent battle/vote/season data with Row Level Security protecting anonymous access, Upstash Redis for serverless HTTP-based rate limiting (no connection pooling issues on Vercel), Zustand 5.x for lightweight client battle state, and Tailwind 4 + shadcn/ui for zero-runtime-overhead UI with full Korean customization. All three infrastructure services operate on free tiers at MVP scale.

**Core technologies:**
- **Next.js 16 + TypeScript**: Full-stack framework -- Turbopack builds, App Router, proxy.ts middleware, no separate backend needed
- **Vercel AI SDK 6.x**: Unified AI provider interface -- single streamText() across OpenAI, Anthropic, Google; handles SSE, error normalization, abort
- **@ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google**: Provider adapters -- do NOT install individual vendor SDKs directly
- **Supabase (supabase-js 2.x)**: PostgreSQL for battles/votes/seasons -- team familiarity, RLS for anon access, v2 auth built-in
- **Upstash Redis + @upstash/ratelimit**: Serverless rate limiting -- HTTP-based (no pooling), sliding window algorithms, edge-compatible
- **Zustand 5.x**: Client state -- 3KB, battle state and UI state in one store
- **Tailwind CSS 4.x + shadcn/ui + Pretendard**: Styling -- 0KB runtime, full ownership for Korean customization, Hangul-optimized font
- **Biome**: Linting/formatting -- replaces ESLint+Prettier, required since Next.js 16 removed next lint
- **Zod + nanoid**: Input validation and URL-safe ID generation

**What NOT to use:** Individual AI provider SDKs, Prisma, NextAuth, self-hosted Redis, tRPC, Socket.io, Redux. None add value over the recommended stack for v1 scope.

### Expected Features

The feature landscape is well-documented with direct competitive benchmarks against arena.ai and Galaxy.ai. The critical path is: rate limiting -> blind battle -> side-by-side streaming -> voting -> model reveal. Every other feature depends on this loop working correctly.

**Must have (table stakes):**
- **Blind battle core loop** -- prompt input, random 2-of-3 model selection, side-by-side streaming, 4-option vote (A wins / B wins / Tie / Both bad), model reveal
- **Korean language UI and system prompts** -- full Korean localization; system prompts must instruct Korean-language responses with formal polite register
- **IP-based rate limiting** -- without this, API costs are unbounded; must ship with the battle feature, not after
- **Mobile-responsive layout** -- 60-80% of Korean university students are on mobile; stacked layout with thumb-reachable vote buttons
- **Loading and error states** -- streaming indicators, Korean error messages, retry button

**Should have (competitive differentiators):**
- **Preset prompt categories** -- homework, cover letter, counseling; lowers entry barrier for students
- **Season system with countdown** -- unique to K-Index; creates urgency and enables graceful cost-controlled shutdown
- **Dark mode** -- university students use it during peak nighttime study hours
- **Response metadata** -- response time and character count per response
- **Korean-specific voting guidance** -- criteria hints near vote buttons for naturalness, honorific register, cultural relevance

**Defer (v2+):**
- Full ELO/Bradley-Terry ranking -- needs statistical volume and anti-gaming measures
- User authentication -- add via Supabase Auth when persistent profiles are needed
- Shareable battle result cards -- needs OG image generation and design work
- Cumulative vote tally/leaderboard -- meaningful only with sufficient data
- Korean AI model integration (HyperCLOVA X, EXAONE) -- needs vendor partnerships
- Battle history (localStorage-based) -- nice to have, not blocking

### Architecture Approach

The architecture is a clean three-tier system: a Next.js full-stack application (client + API routes), backed by Supabase PostgreSQL for persistence and Upstash Redis for ephemeral rate limit state. The key architectural insight from LMSYS FastChat research is that each battle follows a strict state machine (streaming -> awaiting_vote -> completed) and that all model identity information must live exclusively server-side until after the vote is recorded. Parallel streaming uses two independent SSE connections (one per model) via the Vercel AI SDK useChat hook pattern -- the "wait for both before displaying" constraint means responses stream to the server, then are revealed to the client together after both complete.

**Major components:**
1. **Rate Limiter Middleware** -- proxy.ts checks Upstash Redis per-IP before any battle request reaches the API
2. **Battle Router (API)** -- selects 2 random models with randomized positions, creates battle record in Supabase, returns battle ID
3. **AI Provider Layer** -- Vercel AI SDK abstraction dispatching parallel calls to OpenAI/Anthropic/Google simultaneously
4. **Dual Stream Display (UI)** -- renders anonymous side-by-side responses with loading states; never shows model identity
5. **Vote Handler (API)** -- validates battle state, records vote, returns model identities for reveal
6. **Season Manager** -- reads season status from Supabase; gates battle creation; enables graceful shutdown
7. **Supabase (PostgreSQL)** -- battles, votes, seasons, model_stats tables with comprehensive future-proof metadata
8. **Upstash Redis** -- rate limit counters, session fingerprints, battle state cache

The database schema is designed to support v2 from day one: captures battle metadata at creation time (position assignment, response tokens, latency, time-to-vote) so ELO ranking and position bias analysis are possible without a migration.

### Critical Pitfalls

1. **API cost explosion from uncapped response length** -- set max_tokens (512-1024) on every API call; use budget-tier models; set hard spending caps at provider level; Korean text tokenizes 1.5-2x less efficiently than English, making English-based cost estimates dangerously low
2. **Abuse defeating IP-only rate limiting** -- layer fingerprint (device) + IP + behavioral signals (minimum read time before vote enabled); rate limit in Redis middleware before requests reach Supabase functions; season system as cost circuit breaker
3. **Response fairness destroyed by timing or length asymmetry** -- wait for both streams to complete before displaying either; enforce equal max_tokens and temperature across all models; randomize left/right position every battle
4. **Model identity leaking before vote** -- all model selection and API calls server-side only; client receives only Model A / Model B labels; strip model-identifying metadata from API responses; use identical minimal system prompts across all providers
5. **Schema too thin to support future analytics** -- capture response token counts, latency_ms, time_to_vote_ms, model position, user fingerprint, ip_hash at creation; zero extra cost now, essential for v2 ELO and bias correction

## Implications for Roadmap

Based on combined research, the architecture dependency chain maps directly to a 4-phase build order.

### Phase 1: Foundation + Core Battle Loop
**Rationale:** Every feature depends on the database schema, AI provider layer, and rate limiting. The battle state machine and schema decisions made here are expensive to retrofit. Both ARCHITECTURE.md and PITFALLS.md flag this as the phase where the most critical architectural decisions happen and where the most expensive mistakes occur.
**Delivers:** Working blind battle: Korean prompt input -> rate limit check -> 2 random models selected -> parallel streaming responses displayed anonymously -> 4-option vote -> model identities revealed
**Addresses:** All 5 must-ship features -- blind battle core loop, Korean UI/prompts, streaming, rate limiting, loading/error states
**Avoids:** API cost explosion (max_tokens from day one), abuse (layered rate limiting ships with the feature), fairness asymmetry (wait-for-both pattern, position randomization), identity leakage (server-side only model selection), thin schema (comprehensive metadata captured upfront)

### Phase 2: Season System + UX Polish
**Rationale:** Season system is architecturally simple (a status flag + middleware check) but creates the product unique identity and provides the operational cost circuit-breaker. Dark mode, preset categories, and response metadata are independent features with no blocking dependencies -- high conversion value at low implementation cost.
**Delivers:** Season banner with countdown, graceful season-end state, preset prompt category chips with sample prompts, dark mode toggle, response time/character count metadata, Korean-specific voting guidance hints
**Addresses:** All ship-soon-after features -- season system, preset categories, dark mode, response metadata, Korean evaluation criteria hints
**Avoids:** Season-as-punishment pitfall (pre-announced dates, gradual wind-down messaging, between-season results page rather than blank shutdown)

### Phase 3: Analytics + Stats Foundation
**Rationale:** Only meaningful once there is real vote data. Win-rate display requires sufficient battle volume to be non-misleading. Model stats table is already in the schema and can be populated by database triggers.
**Delivers:** Season standings page with win-rate percentages per model, vote count display, model stats aggregation, between-season archive
**Addresses:** Cumulative vote tally, current standings (FEATURES.md differentiators)
**Avoids:** Meaningless statistics displayed before data volume warrants them; admin dashboard bloat before there is data worth analyzing

### Phase 4: Growth + Retention Features
**Rationale:** Shareable battle cards and local battle history are growth multipliers, not foundation features. They require a solid core loop and polished UX. OG image generation for sharing is a separate technical surface.
**Delivers:** Shareable battle result cards (KakaoTalk/Instagram format), local battle history via localStorage, potential Korean AI model expansion pending vendor research
**Addresses:** Shareable results, battle history, Korean model differentiation (v2 list)
**Avoids:** Premature investment in virality before product-market fit is confirmed

### Phase Ordering Rationale

- Foundation before features: database schema, AI provider abstraction, and rate limiting are the dependency root; building features before these creates costly rewrites
- Fairness architecture is Phase 1, not UX polish: retrofitting the wait-for-both streaming pattern or position randomization after launch means invalidating all previously collected vote data
- Season system early: it is both a product feature and an operational safety mechanism; it must be in place before any marketing push, not added reactively when costs spike
- Analytics after data: building statistics UI before meaningful vote volume produces misleading numbers and wastes development effort

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (parallel streaming):** The wait-for-both display pattern with SSE requires server-side buffering -- validate the exact Next.js 16 Route Handler streaming implementation with Vercel AI SDK before committing
- **Phase 1 (fingerprinting):** Browser fingerprinting libraries have shifted; verify current API and Korean PIPA compliance before integrating device fingerprinting
- **Phase 1 (token calibration):** Korean tokenization ratios vary per BPE vocabulary across providers -- needs a calibration script (50 test prompts, measure median output per model) before setting final max_tokens values
- **Phase 4 (Korean AI models):** HyperCLOVA X and EXAONE API availability and Vercel AI SDK compatibility are unverified; needs vendor research before committing

Phases with standard patterns (skip research-phase):
- **Phase 2 (dark mode, preset categories):** Fully standard Next.js + Tailwind CSS patterns
- **Phase 2 (season system):** Simple database flag + middleware check, well-documented pattern
- **Phase 3 (model stats):** Standard PostgreSQL aggregation with Supabase triggers or cron

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technology choices verified against official sources and release notes. Next.js 16 stable since Oct 2025. AI SDK 6.x current. No speculative picks. |
| Features | HIGH | Direct competitive benchmarking against arena.ai (production system with 6M+ votes). Feature table stakes validated against documented user behavior. |
| Architecture | HIGH | Based on LMSYS FastChat open-source architecture + official Vercel AI SDK parallel streaming documentation + production arena patterns. |
| Pitfalls | HIGH | Critical pitfalls sourced from ICML 2025 research papers on vote rigging and position bias, LLM API pricing data, and documented arena abuse patterns. |

**Overall confidence:** HIGH

### Gaps to Address

- **Korean PIPA compliance for device fingerprinting:** Korean Personal Information Protection Act may have specific requirements for device fingerprinting without explicit consent. Validate before Phase 1 implementation; fallback is hashed IP + UA combination only.
- **Vercel streaming behavior under concurrent load:** Fluid Compute allows 5-minute function duration but behavior under 1,000+ simultaneous battles is untested. Load test in staging before any marketing push.
- **Per-model Korean token calibration:** Exact token-to-character ratios for GPT-4o-mini, Claude Haiku, and Gemini Flash with Korean text are not precisely measured. Build a calibration script before launch.
- **Hangul rendering across model outputs:** AI models may output Hangul in Unicode forms that render inconsistently in certain font configurations. Test all three models Korean output in the target font stack (Pretendard) before launch.

## Sources

### Primary (HIGH confidence)
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) -- version requirements, proxy.ts, Turbopack default
- [Vercel AI SDK 6.x Docs](https://ai-sdk.dev/docs/introduction) -- streamText, provider registry, parallel streaming
- [Vercel AI SDK Multiple Streamables](https://ai-sdk.dev/docs/advanced/multiple-streamables) -- parallel model streaming pattern
- [LMSYS FastChat GitHub](https://github.com/lm-sys/FastChat) -- reference open-source arena architecture
- [Chatbot Arena Paper (arXiv)](https://arxiv.org/html/2403.04132v1) -- battle mechanics, voting system design
- [Improving Model Ranking by Vote Rigging (ICML 2025)](https://arxiv.org/html/2501.17858v1) -- position bias (68% first-position preference), vote manipulation
- [HRET: Korean LLM Evaluation Toolkit](https://arxiv.org/abs/2503.22968) -- Korean evaluation criteria
- [AI Korean Language Benchmark](https://kli.korean.go.kr/benchmark/home.do) -- Korean language quality standards
- [Upstash Ratelimit](https://github.com/upstash/ratelimit-js) -- serverless rate limiting library
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first config
- [LLM API Pricing 2026](https://www.tldl.io/resources/llm-api-pricing-2026) -- cost estimates per model

### Secondary (MEDIUM confidence)
- [arena.ai How It Works](https://arena.ai/how-it-works) -- competitive feature benchmarking
- [arena.ai Blog March 2026](https://arena.ai/blog/march-2026-arena-updates/) -- current arena features
- [Galaxy.ai Arena](https://chat.galaxy.ai/arena) -- alternative comparison product
- [Korean Students AI Usage](https://community.linkareer.com/employment_data/4817562) -- mobile usage patterns for target audience
- [University Students Dark Mode Research](https://arxiv.org/pdf/2409.10895) -- dark mode preference validation
- [Rate Limiting Next.js with Upstash Redis](https://upstash.com/blog/nextjs-ratelimiting) -- implementation guide
- [A Fair Fight: Eliminating Length Bias in LLM Evals](https://www.adaptive-ml.com/post/fair-fight) -- verbosity bias (60-75% preference for longer responses)

### Tertiary (LOW confidence -- needs validation)
- [Fingerprinting in 2025](https://cyberkonekt.com/news/fingerprinting-in-2025-what-is-it-and-how-to-bypass) -- abuse prevention patterns; needs Korean PIPA compliance validation
- [Korean LLM Benchmark (Elice)](https://elice.io/en/newsroom/llm-benchmark-korea-elice) -- Korean model quality rankings; useful for model tier selection in v2

---
*Research completed: 2026-04-07*
*Ready for roadmap: yes*
