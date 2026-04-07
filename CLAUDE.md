<!-- GSD:project-start source:PROJECT.md -->
## Project

**K-Index: 한국형 AI 배틀 아레나**

한국 대학생을 타겟으로 한 AI 블라인드 배틀 사이트. 사용자가 질문을 입력하면 두 개의 익명 AI 모델이 응답하고, 사용자가 더 나은 응답을 선택하면 어떤 모델이었는지 공개된다. 한국어 응답 품질 평가에 특화되어 있으며, 한국 문화/사회적 맥락에서의 AI 능력을 평가한다.

**Core Value:** 한국어로 질문했을 때 어떤 AI가 더 자연스럽고 유용한 답변을 하는지, 공정한 블라인드 비교를 통해 알 수 있어야 한다.

### Constraints

- **AI 모델**: v1에서는 GPT, Claude, Gemini API만 사용 — 비용 관리 필요
- **인증 없음**: v1에서 로그인 없으므로, API 남용 방지 메커니즘 필수
- **팀 스택**: Next.js + Python 중심 — 팀의 기존 역량 활용
- **비용**: AI API 호출 비용 고려 필요 (매 배틀마다 2개 모델 호출)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Next.js | 16.x (latest stable) | Full-stack framework | Current stable since Oct 2025. Turbopack default (2-5x faster builds), React 19.2, Cache Components, `proxy.ts` replaces middleware. Team already knows Next.js. App Router is the standard for 2026. No reason to stay on 15 for a greenfield project. | HIGH |
| React | 19.2 | UI library | Ships with Next.js 16. View Transitions, `useEffectEvent`, `<Activity/>` component for background rendering. React Compiler stable for auto-memoization. | HIGH |
| TypeScript | 5.x | Type safety | Required by Next.js 16 (minimum 5.1). Non-negotiable for a project calling 3 different AI APIs with different response shapes. | HIGH |
### AI Provider Integration
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel AI SDK (`ai`) | 6.x (~6.0.146) | Unified AI provider interface | **THE** key library for this project. Single `streamText()` interface across OpenAI, Anthropic, Google. Provider registry lets you swap models with one line. Handles SSE streaming, abort, error handling. Eliminates the need to manage 3 separate SDKs with 3 different streaming APIs. Built by Vercel, first-class Next.js integration. | HIGH |
| `@ai-sdk/openai` | latest | OpenAI provider for AI SDK | Official Vercel AI SDK provider for GPT models. Wraps the OpenAI API with the unified AI SDK interface. | HIGH |
| `@ai-sdk/anthropic` | latest | Anthropic provider for AI SDK | Official Vercel AI SDK provider for Claude models. | HIGH |
| `@ai-sdk/google` | latest | Google provider for AI SDK | Official Vercel AI SDK provider for Gemini models. Uses the new `@google/genai` SDK internally (the old `@google-ai/generativelanguage` is deprecated since Nov 2025). | HIGH |
### Database
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Supabase (PostgreSQL) | Latest (supabase-js 2.101.x) | Primary database + API | Team has experience. Free tier generous for MVP. PostgreSQL underneath means proper relational modeling for battles/votes/seasons. Row Level Security for protecting data even without auth. Realtime subscriptions available for future features. PostgREST v14 with 20% throughput improvement. | HIGH |
### Rate Limiting & Caching
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Upstash Redis | latest (@upstash/redis) | Serverless Redis for rate limiting + caching | HTTP-based (no connection pooling needed on Vercel serverless). Pay-per-request pricing ideal for MVP. Works at edge. Global replication available. Team has Redis experience. | HIGH |
| @upstash/ratelimit | ~2.0.x | Rate limiting library | Purpose-built for serverless. Sliding window and token bucket algorithms. Caches rate limit state locally when edge function is "hot". The standard solution for rate limiting on Vercel without auth. | HIGH |
### Styling & UI
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | 4.x | Utility-first CSS | Current stable (released Jan 2025). CSS-first config, no `tailwind.config.js` needed. 5x faster builds. Ships by default with `create-next-app` in Next.js 16. | HIGH |
| shadcn/ui | latest | Component library | Copy-paste model means full ownership. 0KB runtime JS overhead. Built on Radix UI (accessibility). Most popular React UI library in 2025-2026. Perfect for Korean localization since you own all the code. Tailwind v4 compatible. | HIGH |
| Geist Font | latest | Typography | Vercel's font, ships with Next.js. Clean for Korean text rendering when paired with a Korean web font (Pretendard). | MEDIUM |
| Pretendard | latest | Korean typography | The standard Korean web font for modern Korean web projects. Variable font, excellent hangul rendering, pairs well with system fonts. | HIGH |
### Client State Management
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | 5.x (~5.0.12) | Client-side state | 3KB bundle. No boilerplate. Perfect for this project's needs: battle state (which models are fighting, current responses, vote status), UI state (loading, streaming status). The 2025-2026 consensus pick for React state management. Usage grew 150% YoY. | HIGH |
- Redux: Overkill boilerplate for a focused product
- Jotai: Better for complex atomic state, unnecessary here
- React Context: Fine for theme/locale, but re-render issues at scale
- Zustand handles battle state (current question, streaming responses, vote state) cleanly in a single store
### Deployment & Infrastructure
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vercel | N/A | Frontend + API deployment | Team has experience. First-class Next.js 16 support (same company). Edge functions for rate limiting. Streaming support up to 300s (more than enough for AI responses). Fluid Compute gives 5min default function duration. Free tier works for MVP. | HIGH |
| Supabase Cloud | N/A | Managed PostgreSQL | Free tier: 500MB database, 2 projects. More than enough for v1. Managed backups, easy migration path. | HIGH |
| Upstash | N/A | Managed serverless Redis | Free tier: 10K commands/day. Sufficient for MVP rate limiting. Global edge replication. | HIGH |
- Railway: Adds operational complexity for no benefit when Vercel + Supabase covers everything
- AWS: Team has experience but overkill for v1. Save for v2 if you need custom model serving or dedicated GPU inference
- Keep infrastructure simple: 3 managed services (Vercel + Supabase + Upstash) with generous free tiers
### Supporting Libraries
| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| `next-intl` | latest | i18n (future-proofing) | Korean-only in v1, but structure for i18n from day 1. Avoids painful retrofit later when adding English. | MEDIUM |
| `zod` | latest | Schema validation | Validate user input (questions), API responses, environment variables. Type-safe validation that works with TypeScript. | HIGH |
| `nanoid` | latest | ID generation | Generate battle IDs, session fingerprint tokens. Shorter than UUID, URL-safe, fast. | HIGH |
| `sonner` | latest | Toast notifications | "Vote recorded", "Season ended", error messages. Works with shadcn/ui. | MEDIUM |
### Development & Quality
| Library | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| Biome | latest | Linting + formatting | Next.js 16 removed `next lint`. Biome is the recommended replacement: faster than ESLint+Prettier combined, single tool. | HIGH |
| `@types/node` | 20.x | Node.js types | Next.js 16 requires Node 20.9+. | HIGH |
## What NOT to Use
| Technology | Why Not |
|------------|---------|
| **Separate Python backend** | The entire AI integration can be handled by Next.js Route Handlers + Vercel AI SDK. Python backend adds deployment complexity, CORS issues, separate hosting (Railway), and network latency for every battle. The team knows Python, but it's unnecessary here. If you later need Python-specific ML features (ELO computation, analytics), add a Python edge function on Supabase or a microservice then. |
| **Individual AI SDKs (`openai`, `@anthropic-ai/sdk`, `@google/genai`)** | Vercel AI SDK wraps all three with a unified interface. Using individual SDKs means 3 different streaming implementations, 3 error handling patterns, 3 response parsers. |
| **Prisma** | Adds ORM complexity on top of Supabase, which already provides its own client. Supabase's `supabase-js` handles queries. For complex queries, use Supabase's SQL migrations + raw SQL via `rpc()`. Prisma's connection pooling is also problematic on serverless. |
| **NextAuth / Auth.js** | No auth in v1. Don't install it "just in case." When v2 needs auth, Supabase Auth is built-in and requires zero additional dependencies. |
| **Redis (self-hosted)** | Connection pooling nightmare on serverless. Upstash's HTTP-based Redis eliminates this entirely. |
| **tRPC** | Adds type-safe RPC layer, but for 3-4 API routes (start battle, submit vote, get leaderboard, check season), it's unnecessary abstraction. Route Handlers are sufficient. |
| **Socket.io / WebSockets** | SSE (Server-Sent Events) via the AI SDK handles streaming perfectly. WebSockets are harder to deploy on Vercel and unnecessary for one-directional streaming. |
| **Material UI / Ant Design / Chakra UI** | Heavy runtime bundles. shadcn/ui is 0KB runtime with full customization for Korean UI. |
| **Redux Toolkit** | Massive overkill. Zustand does everything this project needs in 3KB. |
| **Next.js 15** | It's the previous version. Next.js 16 is stable since Oct 2025 (6 months ago). Turbopack, Cache Components, and `proxy.ts` are all improvements relevant to this project. No reason to start a new project on 15. |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Next.js 16 | Remix / SvelteKit | Team knows Next.js. AI SDK has first-class Next.js integration. Vercel deployment is seamless. |
| AI Integration | Vercel AI SDK | Individual provider SDKs | 3 SDKs to maintain vs 1 unified interface. Battle arena needs consistent streaming across providers. |
| Database | Supabase | PlanetScale / Neon | Team knows Supabase. Built-in auth for v2. Generous free tier. PostgreSQL > MySQL for this use case. |
| Rate Limiting | Upstash | Vercel KV | Upstash has purpose-built ratelimit library. Vercel KV is also Redis (powered by Upstash) but less flexible. |
| State | Zustand | Jotai / Redux | Zustand is simpler, smaller, team-friendly. Battle state isn't complex enough for Jotai's atomic model. |
| Styling | Tailwind + shadcn/ui | MUI / Chakra | Zero runtime overhead. Full Korean customization. Industry standard in 2026. |
| Deployment | Vercel | Railway / AWS | Team knows Vercel. Best Next.js support. Free tier covers MVP. |
## Architecture Decision: Monolith
- AI SDK handles all provider communication from Next.js Route Handlers
- Supabase handles database with its own client
- Upstash handles rate limiting at the edge
- No Python-specific capability is needed for v1
- Fewer deployment targets = fewer failure points
- Team can move faster with one codebase
- v2+ ELO ranking computation might benefit from a Python service
- If you add Korean AI models (HyperCLOVA X, EXAONE) that don't have JS SDKs
- If battle analytics require heavy data processing
## Installation
# Create project with Next.js 16
# Core AI integration
# Database
# Rate limiting
# State management
# Validation & utilities
# UI components (shadcn/ui - add components as needed)
# Toast notifications
# Dev dependencies
## Environment Variables
# AI Providers
# Supabase
# Upstash Redis
# Season control
## Cost Estimation (v1 MVP)
### Infrastructure: $0/month (free tiers)
- Vercel Hobby: Free (100GB bandwidth, 100 build hours)
- Supabase Free: 500MB database, 2 projects
- Upstash Free: 10K commands/day
### AI API Costs (the real expense)
| Model | Input Cost | Output Cost | Per Battle (2 models) |
|-------|-----------|-------------|----------------------|
| GPT-4o-mini | $0.15/1M | $0.60/1M | ~$0.001 |
| Claude Haiku 4.5 | $1.00/1M | $5.00/1M | ~$0.006 |
| Gemini 2.0 Flash | $0.075/1M | $0.30/1M | ~$0.0005 |
## Sources
- [Next.js 16 Blog Post](https://nextjs.org/blog/next-16) - Released Oct 2025, stable
- [Vercel AI SDK](https://ai-sdk.dev/docs/introduction) - v6, unified TypeScript AI toolkit
- [AI SDK 6 Announcement](https://vercel.com/blog/ai-sdk-6)
- [Supabase Changelog](https://supabase.com/changelog)
- [Upstash Ratelimit](https://github.com/upstash/ratelimit-js) - Serverless rate limiting
- [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4) - Released Jan 2025
- [shadcn/ui](https://ui.shadcn.com/docs/installation/next)
- [Zustand](https://zustand.docs.pmnd.rs/) - v5, 3KB state management
- [Vercel Functions Limits](https://vercel.com/docs/functions/limitations) - 300s streaming, 5min Fluid Compute
- [LMSYS FastChat Arena](https://github.com/lm-sys/FastChat) - Reference architecture
- [LLM API Pricing 2026](https://www.tldl.io/resources/llm-api-pricing-2026)
- [@supabase/supabase-js npm](https://www.npmjs.com/package/@supabase/supabase-js) - v2.101.x
- [@google/genai npm](https://www.npmjs.com/package/@google/genai) - New unified SDK, replaces deprecated library
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
