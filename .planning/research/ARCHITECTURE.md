# Architecture Patterns

**Domain:** AI Model Blind Battle Arena (Korean-focused)
**Researched:** 2026-04-07
**Confidence:** HIGH (based on LMSYS FastChat open-source architecture + Vercel AI SDK documented patterns)

## Recommended Architecture

```
+------------------------------------------------------------------+
|                        CLIENT (Next.js)                          |
|                                                                  |
|  [Prompt Input] --> [Battle Controller] --> [Side-by-Side View]  |
|                                               |         |        |
|                                          [Model A]  [Model B]   |
|                                          (stream)   (stream)    |
|                                               |         |        |
|                                          [Vote Panel]            |
|                                               |                  |
|                                          [Reveal View]           |
+------------------------------------------------------------------+
        |                    |                    |
        | SSE Streams        | REST API           | REST API
        | (AI responses)     | (submit vote)      | (fetch results)
        v                    v                    v
+------------------------------------------------------------------+
|                    NEXT.JS API LAYER                             |
|                                                                  |
|  [Rate Limiter]  -->  [Battle Router]  -->  [Vote Handler]       |
|  (Upstash Redis)      (model selection)     (record + reveal)    |
|                            |                                     |
|                    [AI Provider Layer]                            |
|                    (OpenAI / Anthropic / Google)                  |
+------------------------------------------------------------------+
        |                    |
        | Read/Write         | Rate limit state
        v                    v
+------------------+   +------------------+
|    SUPABASE      |   |   UPSTASH REDIS  |
|   (PostgreSQL)   |   |                  |
|                  |   |  - Rate limits   |
|  - battles       |   |  - Session data  |
|  - votes         |   |  - Battle cache  |
|  - seasons       |   |                  |
|  - model_stats   |   |                  |
+------------------+   +------------------+
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Prompt Input UI** | Capture user question, display character limit, Korean UI | Battle Controller |
| **Battle Controller** | Coordinate battle lifecycle: select models, dispatch prompts, manage state | AI Provider Layer, Vote Handler |
| **Dual Stream Display** | Render two anonymous AI responses side-by-side with streaming tokens | Battle Controller (receives SSE) |
| **Vote Panel** | Capture user preference (A/B/tie/both-bad), submit vote | Vote Handler API |
| **Reveal View** | Show which model was which after vote, display battle result | Vote Handler API (response) |
| **Rate Limiter Middleware** | IP-based rate limiting, abuse prevention | Upstash Redis |
| **Battle Router (API)** | Select 2 random models from pool, create battle record, dispatch parallel API calls | Supabase, AI SDKs |
| **AI Provider Layer** | Unified interface to OpenAI, Anthropic, Google AI APIs via Vercel AI SDK | External AI APIs |
| **Vote Handler (API)** | Record vote, update stats, return model identities | Supabase |
| **Season Manager** | Control active/inactive season state, enable/disable battles | Supabase |
| **Supabase (PostgreSQL)** | Persistent storage for battles, votes, seasons, aggregate stats | N/A (data store) |
| **Upstash Redis** | Ephemeral storage for rate limits, session tracking, battle state cache | N/A (cache/state store) |

### Data Flow

**Complete Battle Lifecycle:**

```
1. USER types Korean question
   |
2. CLIENT submits prompt to /api/battle/create
   |
3. RATE LIMITER checks IP against Upstash Redis
   |-- BLOCKED: Return 429 + "잠시 후 다시 시도해주세요"
   |-- ALLOWED: Continue
   |
4. BATTLE ROUTER:
   a. Select 2 random models from active pool (GPT, Claude, Gemini)
   b. Assign random positions (Model A = left, Model B = right)
   c. Create battle record in Supabase (battle_id, model_a, model_b, prompt, season_id)
   d. Return battle_id + SSE stream endpoints
   |
5. CLIENT opens 2 parallel SSE connections to /api/battle/[id]/stream/a and /api/battle/[id]/stream/b
   |
6. API LAYER dispatches prompt to both AI providers simultaneously via Vercel AI SDK
   |-- Each stream is independent; if one fails, the other continues
   |-- Tokens stream to client as they arrive
   |
7. USER reads both responses, clicks vote (A wins / B wins / Tie / Both bad)
   |
8. CLIENT sends POST /api/battle/[id]/vote with { choice: "a" | "b" | "tie" | "both_bad" }
   |
9. VOTE HANDLER:
   a. Validate battle exists and hasn't been voted on
   b. Record vote in Supabase (battle_id, choice, voted_at, session_fingerprint)
   c. Return model identities: { model_a: "GPT-4o", model_b: "Claude Sonnet" }
   |
10. CLIENT displays reveal animation showing model names
```

**Season Lifecycle:**

```
ADMIN sets season status via Supabase dashboard or admin API
  |
  |-- season.status = "active"  --> Battles enabled
  |-- season.status = "ended"   --> "시즌1 배틀이 끝났습니다" message
  |-- season.status = "paused"  --> Temporary maintenance message
```

## Core Architecture Decisions

### Decision 1: Next.js Full-Stack (No Separate Python Backend for v1)

**Why:** The team knows Next.js. Vercel AI SDK provides first-class streaming support for all three target AI providers. Adding a separate Python backend introduces deployment complexity, CORS handling, and infrastructure cost with no clear v1 benefit.

**When to add Python:** v2+ when you need ELO computation, statistical analysis (Bradley-Terry model), or heavy data processing. Python excels at these. Keep it as a separate analytics service, not the main API.

**Trade-off:** Less flexibility for compute-heavy tasks in v1, but dramatically simpler deployment (single Vercel project).

### Decision 2: Vercel AI SDK for Parallel Streaming

**Why:** The Vercel AI SDK has a proven pattern for running multiple `useChat` instances on the same page, each streaming from a different model provider. Each `ChatPerModel` component manages its own independent stream via `useChat` hook with model-specific `body` parameters.

**Pattern:**
```typescript
// Parent component distributes prompt to N child components
models.map(model => (
  <ChatPerModel
    key={model.id}
    model={model.id}
    prompt={currentPrompt}
    onSubmit={handleSubmit}
  />
))

// Each child has independent useChat instance
const { messages, handleSubmit } = useChat({
  api: '/api/battle/stream',
  body: { model: model.id, battleId }
})
```

**Alternative considered:** Custom SSE implementation. Rejected because Vercel AI SDK handles connection management, error recovery, and provider abstraction out of the box.

### Decision 3: SSE over WebSocket for Streaming

**Why:** LLM token streaming is unidirectional (server to client). SSE is the industry standard used by OpenAI, Anthropic, and Google APIs natively. SSE is simpler to implement, works over standard HTTP, and is well-supported by Next.js and Vercel's edge infrastructure. WebSocket adds bidirectional complexity unnecessary for v1.

**When to upgrade to WebSocket:** If v2+ adds interactive features like mid-generation cancellation, real-time collaborative viewing, or agent tool approval flows.

### Decision 4: Upstash Redis for Rate Limiting + Session State

**Why:** Upstash Redis is serverless, works natively with Vercel edge functions, and provides `@upstash/ratelimit` with token bucket, sliding window, and fixed window algorithms out of the box. IP-based identification works without authentication.

**Rate limit strategy for v1:**
- Per-IP sliding window: 10 battles per hour
- Per-IP token bucket: 3 battles per minute (burst protection)
- Global: Season-level on/off switch

### Decision 5: Supabase PostgreSQL for Persistent Data

**Why:** Team has Supabase experience. PostgreSQL handles relational data (battles, votes, seasons) well. RLS policies can protect data even without user auth. Anonymous access via Supabase's `anon` key with strict RLS is sufficient for v1.

## Database Schema (Supabase PostgreSQL)

```sql
-- Seasons table
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- e.g. "시즌 1"
  status TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'ended' | 'paused'
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Battles table
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id),
  prompt TEXT NOT NULL,
  model_a TEXT NOT NULL,            -- e.g. 'gpt-4o'
  model_b TEXT NOT NULL,            -- e.g. 'claude-sonnet-4-20250514'
  response_a TEXT,                  -- stored after streaming completes
  response_b TEXT,
  position_a TEXT NOT NULL,         -- 'left' | 'right' (randomized)
  session_fingerprint TEXT,         -- IP hash or browser fingerprint
  status TEXT NOT NULL DEFAULT 'streaming',  -- 'streaming' | 'awaiting_vote' | 'completed'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) UNIQUE,  -- one vote per battle
  choice TEXT NOT NULL,             -- 'model_a' | 'model_b' | 'tie' | 'both_bad'
  winner_model TEXT,                -- resolved model name (null for tie/both_bad)
  loser_model TEXT,
  session_fingerprint TEXT,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Model stats (materialized/cached, updated via trigger or cron)
CREATE TABLE model_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id),
  model_name TEXT NOT NULL,
  total_battles INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  ties INT NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,4),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(season_id, model_name)
);

-- Indexes
CREATE INDEX idx_battles_season ON battles(season_id);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_fingerprint ON battles(session_fingerprint);
CREATE INDEX idx_votes_battle ON votes(battle_id);
CREATE INDEX idx_model_stats_season ON model_stats(season_id);
```

## Patterns to Follow

### Pattern 1: Battle State Machine

**What:** Each battle follows a strict state machine: `created -> streaming -> awaiting_vote -> completed`

**When:** Every battle interaction

**Why:** Prevents double-voting, ensures responses are fully streamed before vote is enabled, provides clear lifecycle for cleanup.

```typescript
type BattleStatus = 'streaming' | 'awaiting_vote' | 'completed';

// State transitions
// streaming -> awaiting_vote: both streams finish
// awaiting_vote -> completed: user submits vote
// No backward transitions allowed
```

### Pattern 2: Random Model Assignment with Position Randomization

**What:** Select 2 models randomly from pool, then randomize which appears on left vs right.

**When:** Battle creation

**Why:** Eliminates position bias (users may favor left/right). LMSYS research shows position bias is real in pairwise comparisons.

```typescript
function createBattle(models: string[]): Battle {
  // Pick 2 distinct random models
  const shuffled = [...models].sort(() => Math.random() - 0.5);
  const [modelA, modelB] = shuffled.slice(0, 2);
  
  // Randomize display position
  const swapPositions = Math.random() > 0.5;
  return {
    model_a: swapPositions ? modelB : modelA,
    model_b: swapPositions ? modelA : modelB,
    position_a: swapPositions ? 'right' : 'left',
  };
}
```

### Pattern 3: Provider Abstraction via AI SDK

**What:** Use Vercel AI SDK's provider system to abstract away API differences between OpenAI, Anthropic, and Google.

**When:** All AI API interactions

**Why:** Each provider has different auth, streaming format, and error handling. The AI SDK normalizes this.

```typescript
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';

const providers = {
  'gpt-4o': openai('gpt-4o'),
  'claude-sonnet': anthropic('claude-sonnet-4-20250514'),
  'gemini-pro': google('gemini-2.0-flash'),
};

// Uniform interface regardless of provider
const result = streamText({
  model: providers[modelName],
  prompt: userPrompt,
  system: "You are a helpful AI assistant. Respond in Korean when the user writes in Korean.",
});
```

### Pattern 4: Session Fingerprinting Without Auth

**What:** Combine IP address hash + user agent hash to create a pseudo-session identifier.

**When:** Rate limiting and vote deduplication

**Why:** No auth in v1, but need to identify repeat users for rate limiting and basic abuse prevention.

```typescript
function getSessionFingerprint(req: Request): string {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const ua = req.headers.get('user-agent') || 'unknown';
  return hash(`${ip}:${ua}`);  // SHA-256 hash
}
```

**Limitation:** This is not robust against determined attackers (VPN, UA spoofing). Acceptable for v1; add Cloudflare Turnstile in v2.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Waiting for Both Streams Before Displaying

**What:** Buffering both model responses and showing them simultaneously after both complete.

**Why bad:** Destroys the streaming experience. Users stare at a blank screen for 5-15 seconds. The slower model bottlenecks the entire experience.

**Instead:** Stream tokens independently as they arrive. One model finishing before the other is expected and natural.

### Anti-Pattern 2: Revealing Model Names Before Vote

**What:** Any UI element, API response, or network request that leaks model identity before voting.

**Why bad:** Defeats the purpose of blind comparison. Users have strong model brand biases.

**Instead:** Use opaque labels ("Model A" / "Model B"). Model names exist only in the database row and are returned only in the vote response. Ensure no model-specific styling, timing information, or response formatting leaks identity.

### Anti-Pattern 3: Storing Battles in Redis Only

**What:** Using Redis as the sole data store for battle records.

**Why bad:** Redis is ephemeral. Data loss on restart/eviction destroys vote history needed for future rankings.

**Instead:** Redis for transient state (rate limits, active battle cache). PostgreSQL for all persistent data (battles, votes, stats).

### Anti-Pattern 4: Synchronous API Calls to AI Providers

**What:** Calling Model A, waiting for complete response, then calling Model B.

**Why bad:** Doubles latency. If GPT takes 8s and Claude takes 6s, total is 14s instead of 8s.

**Instead:** Always dispatch both API calls simultaneously. Use `Promise.all` or parallel streams.

### Anti-Pattern 5: Client-Side Model Selection

**What:** Having the client decide which models to compare.

**Why bad:** Users could game the system by always picking specific matchups. Also leaks available model pool.

**Instead:** Server randomly selects models. Client only knows "Model A" and "Model B".

## Suggested Build Order (Dependencies)

The architecture has clear dependency chains that dictate build order:

```
Phase 1: Foundation (nothing depends on anything else)
  ├── Database schema (seasons, battles, votes tables)
  ├── AI Provider layer (SDK setup, provider config)
  └── Rate limiting middleware (Upstash Redis setup)

Phase 2: Core Battle Flow (depends on Phase 1)
  ├── Battle creation API (model selection, battle record)
  ├── Dual streaming API (parallel AI calls, SSE endpoints)
  └── Basic prompt input UI

Phase 3: Vote + Reveal (depends on Phase 2)
  ├── Vote submission API (record choice, return model names)
  ├── Side-by-side response display UI
  ├── Vote panel UI
  └── Reveal animation UI

Phase 4: Season System + Polish (depends on Phase 3)
  ├── Season status checks (active/ended/paused)
  ├── Season shutdown UI ("시즌이 끝났습니다")
  ├── Model stats aggregation
  └── Korean UI polish, error states, loading states
```

**Why this order:**
1. **Database + AI + Rate Limit first:** Everything else reads/writes to these. Cannot build any feature without them.
2. **Battle creation before display:** Need to create battles and get streaming responses before building UI to show them.
3. **Vote after display:** Users must see responses before voting. Vote API depends on battle records existing.
4. **Season system last:** It's a control layer on top of working battles. Polish comes after core flow works.

## Scalability Considerations

| Concern | At 100 users/day | At 10K users/day | At 100K users/day |
|---------|-------------------|-------------------|---------------------|
| AI API costs | ~$5-15/day (200 API calls) | ~$500-1500/day (20K calls) | Season system + auth required |
| Database load | Supabase free tier sufficient | Supabase Pro, connection pooling | Supabase Pro + read replicas |
| Rate limiting | IP-based sufficient | IP + fingerprint + Turnstile | Full auth + Cloudflare WAF |
| Streaming connections | No concern | Monitor Vercel concurrent function limits | Edge functions + regional deployment |
| Vote integrity | Basic fingerprint OK | Anomaly detection needed | Full auth + ML-based detection |

## Sources

- [LMSYS FastChat Architecture](https://github.com/lm-sys/FastChat) - Open source arena system (controller/worker/web pattern)
- [Vercel AI SDK - Multiple Streamables](https://ai-sdk.dev/docs/advanced/multiple-streamables) - Official parallel streaming docs
- [Streaming Multiple AI Models in Parallel](https://www.robinwieruch.de/react-ai-sdk-multiple-streams/) - Practical implementation guide
- [Multiple Parallel AI Streams with Vercel AI SDK](https://mikecavaliere.com/posts/multiple-parallel-streams-vercel-ai-sdk) - Server-side stream creation pattern
- [Rate Limiting Next.js with Upstash Redis](https://upstash.com/blog/nextjs-ratelimiting) - IP-based rate limiting implementation
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous) - Session management without auth
- [Vote Manipulation in Chatbot Arena](https://arxiv.org/html/2501.07493v1) - Security research on arena vote rigging
- [SSE vs WebSocket for LLM Streaming](https://procedure.tech/blogs/the-streaming-backbone-of-llms-why-server-sent-events-(sse)-still-wins-in-2025) - Protocol comparison
- [Arena.ai How It Works](https://arena.ai/how-it-works) - Commercial arena system reference
- [Arena Rate Limiting](https://help.arena.ai/articles/8931786544-arena-how-to-rate-limit) - Production rate limiting patterns
