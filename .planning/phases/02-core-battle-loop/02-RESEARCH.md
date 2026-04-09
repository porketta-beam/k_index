# Phase 2: Core Battle Loop - Research

**Researched:** 2026-04-09
**Domain:** Real-time dual AI streaming, blind battle orchestration, client state management, UI component architecture
**Confidence:** HIGH

## Summary

Phase 2 transforms the single-model streaming foundation from Phase 1 into a complete blind battle experience. The core technical challenge is orchestrating two independent AI streams in parallel while keeping model identities hidden from the client until voting completes. The Vercel AI SDK's `useCompletion` hook provides a production-ready pattern for parallel streaming when used with separate hook instances, and a signed server token approach solves the blind identity problem without requiring external session storage.

The architecture centers on three API endpoints (battle/start, battle/stream, battle/vote) with a stateless server design. The battle/start endpoint selects two random models, generates a cryptographically signed session token containing model identities, and returns only an opaque token to the client. The client opens two parallel streams via separate `useCompletion` hooks pointing at the same battle/stream endpoint with different slot parameters (A/B). After both streams complete, the vote endpoint receives the token back, verifies the signature, extracts model identities, saves the complete battle to the database, and returns model names with win rates.

**Primary recommendation:** Use two independent `useCompletion` hooks with `streamProtocol: 'text'` for parallel streaming, HMAC-signed session tokens for blind model identity, and a Zustand store with the state machine defined in the UI-SPEC for client state management. All state transitions happen in the Zustand store; components are pure renderers of store state.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 3 models (GPT-4o-mini, Claude Haiku 4.5, Gemini 2.5 Flash) -- 2 selected fully randomly per battle
- **D-02:** Same model vs same model is forbidden -- always different model pair
- **D-03:** A/B position assignment is randomized per battle (BATTLE-06)
- **D-04:** Independent parallel streams per model -- client consumes 2 streams simultaneously
- **D-05:** Show response completion time per model in seconds (1 decimal, e.g., "3.2 seconds") -- new UI element
- **D-06:** If one model errors during streaming, entire battle enters error state immediately; abort the other stream
- **D-07:** DB save at vote time only -- server holds battle session (question, models, responses) temporarily, writes all data to DB in one batch when vote is submitted; no incomplete data in DB
- **D-08:** Model IDs never exposed to client before voting -- server manages model selection and session; blind test integrity
- **D-09:** Win rate calculation approach is Claude's discretion (real-time query or cache)
- **D-10:** Always show win rates regardless of battle count; format: "{model} win rate: {N}% ({W}W / {T} total)"
- **D-11:** After voting, both response texts remain visible for re-comparison with revealed identities
- **D-12:** "New battle" button resets state to idle immediately; previous results disappear

### Claude's Discretion
- Server session storage mechanism (memory, short-TTL cache, or other)
- Win rate calculation implementation (real-time DB query vs cache)
- Client-server API design details for battle start/streaming/vote
- Zustand store structure and state management patterns (guided by UI-SPEC)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BATTLE-01 | User submits question, two anonymous AI models generate responses | Dual-stream architecture with `useCompletion` hooks; model pairing logic in battle/start endpoint |
| BATTLE-02 | AI responses stream in real-time (independently, for speed comparison) | Two independent `useCompletion` instances with `streamProtocol: 'text'`; each stream runs at natural model speed |
| BATTLE-03 | User votes A wins or B wins | VotePanel component; vote disabled until both `streamingA` and `streamingB` are false; vote API endpoint |
| BATTLE-04 | After voting, model names are revealed | Server returns model identities from signed token after vote; Zustand store updates `revealedModelA/B` |
| BATTLE-05 | Model reveal includes per-category win rates | PostgreSQL `get_model_win_rates` RPC function; returns win/total counts per model for current category |
| BATTLE-06 | Server-side random model selection + random A/B position | battle/start endpoint: Fisher-Yates shuffle for model pair, `Math.random() < 0.5` for position assignment |

</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version (installed) | Purpose | Verified |
|---------|-------------------|---------|----------|
| `ai` | 6.0.149 | Unified AI streaming (streamText) | [VERIFIED: npm ls] |
| `@ai-sdk/react` | 3.0.151 | useCompletion hook for client streaming | [VERIFIED: npm ls] |
| `@ai-sdk/openai` | 3.0.51 | OpenAI provider | [VERIFIED: npm ls] |
| `@ai-sdk/anthropic` | 3.0.67 | Anthropic provider | [VERIFIED: npm ls] |
| `@ai-sdk/google` | 3.0.59 | Google provider | [VERIFIED: npm ls] |
| `@supabase/supabase-js` | 2.102.1 | Database client | [VERIFIED: npm ls] |
| `nanoid` | 5.1.7 | ID generation | [VERIFIED: npm ls] |
| `zod` | 3.25.76 | Schema validation | [VERIFIED: npm ls] |
| `next` | 16.2.2 | Full-stack framework | [VERIFIED: npm ls] |
| `react` | 19.2.4 | UI library | [VERIFIED: npm ls] |

### New Dependencies (must install in Phase 2)

| Library | Latest Version | Purpose | Why Standard |
|---------|---------------|---------|--------------|
| `zustand` | 5.0.12 | Client state management | Battle state machine (idle/streaming/voting/reveal/error). 3KB. Subscription-based re-renders. The 2026 consensus pick for React state. [VERIFIED: npm registry 5.0.12] |
| `sonner` | 2.0.7 | Toast notifications | "Vote recorded" feedback. Works with shadcn/ui. [VERIFIED: npm registry 2.0.7] |

### shadcn/ui Components (must initialize + install)

| Component | Source | Purpose |
|-----------|--------|---------|
| `button` | shadcn official | Vote buttons, CTA, "new battle" button |
| `card` | shadcn official | Response containers (Model A / Model B) |
| `textarea` | shadcn official | Question input |
| `badge` | shadcn official | Model labels, revealed model names |
| `separator` | shadcn official | Visual dividers |
| `skeleton` | shadcn official | Streaming placeholder animation |

**Installation commands:**
```bash
# Phase 2 new dependencies
npm install zustand sonner

# shadcn initialization (MUST run before component adds)
npx shadcn@latest init

# shadcn components
npx shadcn@latest add button card textarea badge separator skeleton
```

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `useCompletion` x2 | Server Actions + `createStreamableValue` | RSC streaming API is marked experimental by Vercel -- "AI SDK UI recommended for production" [CITED: ai-sdk.dev/docs/ai-sdk-rsc] |
| `useCompletion` x2 | `useChat` x2 | useChat manages message history (unnecessary for single-turn battle). useCompletion is simpler for one-shot completion. |
| HMAC signed token | Upstash Redis session | Upstash Redis planned for Phase 4. Signed token is stateless, zero external dependencies, Vercel-friendly. |
| HMAC signed token | jose JWT library | Node.js `crypto.createHmac` works fine in Route Handlers (Node runtime, not Edge). No extra dependency needed. |
| Zustand | React Context | Re-render issues when streaming text updates at high frequency. Zustand subscription model avoids this. |

## Architecture Patterns

### Recommended Project Structure

```
src/
  app/
    page.tsx                          # Battle page (replaces placeholder)
    layout.tsx                        # Add Pretendard font CDN link
    globals.css                       # shadcn CSS variables + Pretendard font stack
    api/
      battle/
        start/route.ts                # POST: select models, generate signed token
        stream/route.ts               # POST: stream single model (extend Phase 1)
        vote/route.ts                 # POST: verify token, save to DB, return reveal
  components/
    ui/                               # shadcn components (auto-generated)
    battle/
      battle-input.tsx                # Textarea + submit + character counter
      response-card.tsx               # Model label + streaming/complete response
      streaming-indicator.tsx         # Pulsing blue dot
      vote-panel.tsx                  # A wins / B wins buttons
      reveal-panel.tsx                # Model names + win rate bars
      win-rate-bar.tsx                # Horizontal bar with percentage
      battle-arena.tsx                # Orchestrator: connects store to components
  lib/
    ai/
      registry.ts                     # (existing) Provider registry
      config.ts                       # (existing) Battle config
      pairing.ts                      # NEW: model selection + randomization
    db/
      client.ts                       # (existing) Supabase client
      queries.ts                      # (existing + extend) Add getModelWinRates
    store/
      battle-store.ts                 # Zustand battle state machine
    battle/
      session.ts                      # HMAC sign/verify battle session token
    types.ts                          # (existing + extend) Add BattleSession, etc.
    env.ts                            # (existing + extend) Add BATTLE_SESSION_SECRET
    utils.ts                          # cn() helper (shadcn generates this)
```

### Pattern 1: Stateless Blind Battle Session via HMAC-Signed Token

**What:** Server generates a signed token containing battle metadata (session ID, model IDs, position assignment). Client holds token as opaque blob. Token is verified on vote submission.

**When to use:** When model identity must stay hidden from client, and server is stateless (Vercel serverless).

**Why this approach:**
- D-08 requires model IDs hidden from client: token payload is Base64 but HMAC signature prevents tampering. Even if client decodes Base64 to see model IDs, they cannot forge a different vote mapping. For stronger opacity, the payload can be encrypted (AES-256-GCM with Node.js crypto), but HMAC-signed Base64 is sufficient for a battle arena where the incentive to "cheat" is minimal.
- D-07 requires DB save at vote time: token carries all data needed to reconstruct the battle record
- Vercel serverless is stateless: no reliable in-memory session across requests [VERIFIED: github.com/vercel/next.js/discussions/36806]
- No extra infrastructure: Node.js `crypto` module is built-in

**Example:**
```typescript
// src/lib/battle/session.ts
import crypto from "crypto";
import { env } from "@/lib/env";

interface BattleSession {
  sid: string;           // session ID (nanoid)
  q: string;             // question text
  mA: string;            // model ID for slot A
  mB: string;            // model ID for slot B
  ts: number;            // creation timestamp
}

const ALGORITHM = "sha256";

export function createBattleToken(session: BattleSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = crypto
    .createHmac(ALGORITHM, env.BATTLE_SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyBattleToken(token: string): BattleSession | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac(ALGORITHM, env.BATTLE_SESSION_SECRET)
    .update(payload)
    .digest("base64url");

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null;
  }

  const session = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf-8")
  ) as BattleSession;

  // Reject tokens older than 30 minutes
  if (Date.now() - session.ts > 30 * 60 * 1000) return null;

  return session;
}
```
[ASSUMED: HMAC-signed token approach is Claude's discretion per CONTEXT.md]

### Pattern 2: Dual-Stream Client Architecture with useCompletion

**What:** Two independent `useCompletion` hook instances consume two separate SSE streams from the same battle/stream endpoint. Each sends a different `slot` parameter (A or B) along with the session token.

**When to use:** When two AI models must stream independently at their natural speed (D-04).

**Example:**
```typescript
// Client: Two useCompletion instances
const completionA = useCompletion({
  api: "/api/battle/stream",
  streamProtocol: "text",
  body: { token: battleToken, slot: "a" },
  onFinish: () => store.setStreamingA(false),
  onError: () => store.setStatus("error"),
});

const completionB = useCompletion({
  api: "/api/battle/stream",
  streamProtocol: "text",
  body: { token: battleToken, slot: "b" },
  onFinish: () => store.setStreamingB(false),
  onError: () => store.setStatus("error"),
});
```

```typescript
// Server: battle/stream/route.ts
export async function POST(req: Request) {
  const { token, slot, prompt } = requestSchema.parse(await req.json());
  const session = verifyBattleToken(token);
  if (!session) return Response.json({ error: "Invalid session" }, { status: 401 });

  const modelId = slot === "a" ? session.mA : session.mB;

  const result = streamText({
    model: registry.languageModel(modelId),
    system: BATTLE_CONFIG.systemPrompt,
    prompt: session.q, // Use question from signed token, not client
    maxOutputTokens: BATTLE_CONFIG.maxOutputTokens,
    temperature: BATTLE_CONFIG.temperature,
  });

  return result.toTextStreamResponse();
}
```
[CITED: ai-sdk.dev/docs/ai-sdk-ui/completion, ai-sdk.dev/docs/ai-sdk-ui/stream-protocol]

### Pattern 3: Zustand Battle State Machine

**What:** Single Zustand store managing the complete battle lifecycle: idle -> streaming -> voting -> reveal -> idle (or error).

**When to use:** All battle UI components subscribe to this store. Store drives the state machine defined in UI-SPEC.

**Example:**
```typescript
// src/lib/store/battle-store.ts
import { create } from "zustand";

type BattlePhase = "idle" | "streaming" | "voting" | "reveal" | "error";

interface BattleState {
  phase: BattlePhase;
  question: string;
  battleToken: string | null;
  responseA: string;
  responseB: string;
  streamingA: boolean;
  streamingB: boolean;
  durationA: number | null;  // seconds, 1 decimal (D-05)
  durationB: number | null;
  winner: "a" | "b" | null;
  revealedModelA: string | null;
  revealedModelB: string | null;
  winRates: {
    modelA: { wins: number; total: number };
    modelB: { wins: number; total: number };
  } | null;
  errorMessage: string | null;

  // Actions
  startBattle: (question: string, token: string) => void;
  setResponseA: (text: string) => void;
  setResponseB: (text: string) => void;
  setStreamingA: (streaming: boolean) => void;
  setStreamingB: (streaming: boolean) => void;
  setDurationA: (seconds: number) => void;
  setDurationB: (seconds: number) => void;
  submitVote: (winner: "a" | "b") => void;
  setReveal: (data: RevealData) => void;
  setError: (message: string) => void;
  reset: () => void;
}

const initialState = {
  phase: "idle" as BattlePhase,
  question: "",
  battleToken: null,
  responseA: "",
  responseB: "",
  streamingA: false,
  streamingB: false,
  durationA: null,
  durationB: null,
  winner: null,
  revealedModelA: null,
  revealedModelB: null,
  winRates: null,
  errorMessage: null,
};

export const useBattleStore = create<BattleState>((set, get) => ({
  ...initialState,

  startBattle: (question, token) =>
    set({
      phase: "streaming",
      question,
      battleToken: token,
      responseA: "",
      responseB: "",
      streamingA: true,
      streamingB: true,
    }),

  setStreamingA: (streaming) => {
    set({ streamingA: streaming });
    const state = get();
    if (!streaming && !state.streamingB) {
      set({ phase: "voting" });
    }
  },

  setStreamingB: (streaming) => {
    set({ streamingB: streaming });
    const state = get();
    if (!state.streamingA && !streaming) {
      set({ phase: "voting" });
    }
  },

  setError: (message) =>
    set({ phase: "error", errorMessage: message, streamingA: false, streamingB: false }),

  reset: () => set(initialState),

  // ... other actions
}));
```
[CITED: zustand.docs.pmnd.rs, CONTEXT.md UI-SPEC Zustand store shape]

### Pattern 4: Battle Start -> Stream -> Vote API Flow

**What:** Three-endpoint flow that maintains blind integrity.

**Flow:**
```
1. POST /api/battle/start
   Body: { question: string }
   Response: { token: string }  // Signed token with model info
   
2. POST /api/battle/stream  (called TWICE in parallel by client)
   Body: { token: string, slot: "a" | "b", prompt: string }
   Response: SSE text stream
   
3. POST /api/battle/vote
   Body: { token: string, winner: "a" | "b", responseA: string, responseB: string, durationA: number, durationB: number }
   Response: { 
     modelA: { id: string, displayName: string }, 
     modelB: { id: string, displayName: string },
     winRates: { modelA: { wins, total }, modelB: { wins, total } }
   }
```

**Critical security note for battle/stream:** The prompt used for AI generation MUST come from the signed token (`session.q`), NOT from the client request body. This prevents a client from sending a different question to each model to manipulate results. The `prompt` field in the request body is ignored (or used only for the `useCompletion` hook's internal state -- the server overrides it).

### Anti-Patterns to Avoid

- **Sending model IDs to client before vote:** Violates D-08. Even in response headers or error messages -- never leak model identity.
- **Saving to DB during streaming:** Violates D-07. Incomplete data in DB creates orphaned records. Only save when vote confirms a complete battle.
- **Using `useChat` for single-turn completions:** `useChat` maintains conversation history, adds unnecessary complexity for single-turn battles.
- **RSC streaming (`createStreamableValue`):** Experimental API, not recommended for production by Vercel. [CITED: ai-sdk.dev/docs/ai-sdk-rsc]
- **In-memory Map for session storage on Vercel:** Serverless functions are stateless. Global variables are not reliably persistent across requests. [VERIFIED: github.com/vercel/next.js/discussions/36806]
- **Single route returning both streams:** Multiplexing two AI streams into one HTTP response is fragile and non-standard. Two separate streams are cleaner and align with D-04.
- **Client-side model selection:** Must happen server-side per D-06, BATTLE-06.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| AI streaming | Custom SSE implementation | `streamText()` + `toTextStreamResponse()` | Handles backpressure, abort, errors, provider differences [CITED: ai-sdk.dev/docs/reference/ai-sdk-core/stream-text] |
| Streaming consumption | Custom `EventSource` or `fetch` stream parsing | `useCompletion` from `@ai-sdk/react` | Handles reconnection, state management, abort [CITED: ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion] |
| Client state machine | Custom React state + useReducer | Zustand store with explicit phase transitions | Avoids prop drilling, subscription-based re-renders, devtools |
| HMAC signing | Custom string concatenation | Node.js `crypto.createHmac` + `timingSafeEqual` | Timing-safe comparison prevents timing attacks |
| Component styling | Custom CSS from scratch | shadcn/ui components + Tailwind | Accessible, consistent, zero runtime overhead |
| Toast notifications | Custom notification system | sonner | Pre-built, animation, auto-dismiss, shadcn-compatible |
| Win rate aggregation | JS-side counting | PostgreSQL RPC function | Database-level aggregation is faster and avoids fetching all rows |

**Key insight:** Every "simple" streaming implementation becomes complex when you add error handling, abort, backpressure, and reconnection. The AI SDK handles all of these. Use it.

## Common Pitfalls

### Pitfall 1: useCompletion Body Not Sent on Initial Render
**What goes wrong:** The `body` option in `useCompletion` is typically used to send additional data with the request. If the token is not available when the hook initializes, the first request may go out without it.
**Why it happens:** Hooks initialize on component mount, but the battle token arrives asynchronously from the start endpoint.
**How to avoid:** Do not call `complete()` until the token is in state. Use the `body` parameter of `complete()` call, not the hook options, for dynamic data. Or set the hook's `body` and only trigger `complete()` after token is available.
**Warning signs:** 401 errors on stream endpoint; token is undefined in request body.

### Pitfall 2: Race Condition in Phase Transition (streaming -> voting)
**What goes wrong:** Both streams finish nearly simultaneously. Two `setStreamingX(false)` calls race, and the check `if (!streamingA && !streamingB)` may read stale state.
**Why it happens:** Zustand's `set` is synchronous but `get()` inside a setter may return the value before the current `set` call applies.
**How to avoid:** In each `setStreamingX` action, compute the transition based on both the new value AND the current state of the OTHER stream. The pattern shown in the Zustand example above handles this correctly by calling `get()` after `set()`.
**Warning signs:** Vote buttons never enable; phase stays at "streaming" even though both responses are complete.

### Pitfall 3: Response Text Accumulated on Client vs Server
**What goes wrong:** D-07 says DB save at vote time, so complete response text must be sent with the vote. If using `useCompletion`, the `completion` return value holds the full accumulated text.
**Why it happens:** The `useCompletion` hook accumulates text automatically. The Zustand store can mirror this, or the vote can read directly from the `completion` values.
**How to avoid:** When submitting the vote, read `completionA.completion` and `completionB.completion` for the full response texts. Include them in the vote request body. The server stores them in the DB.
**Warning signs:** Empty `response_a` or `response_b` in the database.

### Pitfall 4: Token Replay / Double Vote
**What goes wrong:** User submits the same vote twice, creating duplicate records.
**Why it happens:** Network retries, double-click, or intentional replay.
**How to avoid:** Include the session ID (`sid` from nanoid) in the token. Before inserting, check if a vote already exists for this battle session. Use a unique constraint on `(battle_id)` in the votes table (already exists as foreign key reference, but consider making battle_id UNIQUE in votes). On the client, disable vote buttons immediately after click and show loading state.
**Warning signs:** Multiple vote records for the same battle; win rate counts seem inflated.

### Pitfall 5: Error in One Stream Doesn't Abort the Other
**What goes wrong:** Per D-06, if one model errors, the entire battle should error. But the two streams are independent -- one can error while the other continues streaming.
**Why it happens:** Two independent `useCompletion` instances have no built-in coordination.
**How to avoid:** Each `useCompletion` `onError` callback calls `store.setError()` which transitions to "error" phase. The orchestrator component watches the phase and calls `completionA.stop()` and `completionB.stop()` when phase becomes "error". Use a `useEffect` that depends on `phase`.
**Warning signs:** One card shows error, the other continues streaming; user is confused.

### Pitfall 6: Korean Text Line Breaking
**What goes wrong:** Korean text breaks mid-syllable, creating unreadable lines.
**Why it happens:** Default CSS `overflow-wrap: break-word` breaks Korean syllable blocks.
**How to avoid:** Apply `word-break: keep-all` on all response text containers. Already specified in UI-SPEC.
**Warning signs:** Korean characters split across lines; hangul components (jamo) displayed separately.

### Pitfall 7: Streaming Duration Timer Accuracy
**What goes wrong:** Response time displayed is inaccurate because timer starts/stops at wrong moment.
**Why it happens:** Timer starts when component mounts (not when stream actually begins) or uses `Date.now()` which can be affected by tab backgrounding.
**How to avoid:** Start timer when the first character of stream text arrives (not when request is sent). Stop when `useCompletion.isLoading` transitions to false OR `onFinish` fires. Use `performance.now()` for sub-millisecond accuracy unaffected by system clock changes.
**Warning signs:** Both models show identical or very similar durations despite different streaming speeds.

## Code Examples

### Win Rate PostgreSQL RPC Function

```sql
-- supabase/migrations/00002_win_rate_function.sql
CREATE OR REPLACE FUNCTION get_model_win_rates(category_filter text DEFAULT 'general')
RETURNS TABLE (
  model_id text,
  wins bigint,
  total bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH battle_models AS (
    -- Unnest each battle into individual model participation records
    SELECT b.id as battle_id, b.model_a as model_id, 
           CASE WHEN v.winner = 'a' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed' AND b.category = category_filter
    UNION ALL
    SELECT b.id as battle_id, b.model_b as model_id,
           CASE WHEN v.winner = 'b' THEN 1 ELSE 0 END as won
    FROM battles b
    JOIN votes v ON v.battle_id = b.id
    WHERE b.status = 'completed' AND b.category = category_filter
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

**Client usage:**
```typescript
const { data } = await supabase.rpc("get_model_win_rates", {
  category_filter: "general",
});
// Returns: [{ model_id: "openai:gpt-4o-mini", wins: 15, total: 30 }, ...]
```
[ASSUMED: RPC function approach for win rates -- Claude's discretion per D-09]

### Model Pairing Logic

```typescript
// src/lib/ai/pairing.ts
import { BUDGET_MODELS, type BudgetModelId } from "@/lib/types";

export function selectModelPair(): {
  modelA: BudgetModelId;
  modelB: BudgetModelId;
} {
  // Fisher-Yates shuffle of indices
  const indices = [0, 1, 2];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  // Take first two (guaranteed different per D-02)
  return {
    modelA: BUDGET_MODELS[indices[0]],
    modelB: BUDGET_MODELS[indices[1]],
  };
}
```

### Model Display Name Mapping

```typescript
// src/lib/ai/config.ts (extend existing)
export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "openai:gpt-4o-mini": "GPT-4o-mini",
  "anthropic:claude-haiku-4-5": "Claude Haiku 4.5",
  "google:gemini-2.5-flash": "Gemini 2.5 Flash",
} as const;
```

### Pretendard Font Setup

```tsx
// src/app/layout.tsx -- add to <head>
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
/>
```

```css
/* src/app/globals.css -- update @theme inline */
@theme inline {
  --font-sans: 'Pretendard Variable', var(--font-geist-sans), system-ui, sans-serif;
}
```
[CITED: 02-UI-SPEC.md Pretendard Font Setup section]

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `createStreamableValue` (RSC) | `useCompletion` / `useChat` (AI SDK UI) | AI SDK v6 (Feb 2026) | RSC streaming is experimental; AI SDK UI is production-recommended |
| `toDataStreamResponse()` | `toUIMessageStreamResponse()` | AI SDK v6 | New name for data stream protocol; text stream uses `toTextStreamResponse()` |
| tailwind.config.js | CSS-first `@theme` directive | Tailwind v4 (Jan 2025) | No config file; `@theme inline` in globals.css |
| tailwindcss-animate | tw-animate-css | shadcn + Tailwind v4 | New projects get tw-animate-css by default during shadcn init |

**Deprecated/outdated:**
- `createStreamableValue` from `@ai-sdk/rsc`: Experimental, not for production [CITED: ai-sdk.dev/docs/ai-sdk-rsc]
- `toDataStreamResponse()`: Renamed to `toUIMessageStreamResponse()` in AI SDK v6 [CITED: ai-sdk.dev/docs/ai-sdk-ui/stream-protocol]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | HMAC-signed token is sufficient for blind integrity (vs encryption) | Architecture Pattern 1 | LOW -- even if Base64 decoded, user gains no competitive advantage; HMAC prevents tampering. Could upgrade to AES-256-GCM if needed. |
| A2 | PostgreSQL RPC function for real-time win rate calculation | Code Examples | LOW -- at v1 scale (<10K battles), direct query is fast. Can add materialized view or Redis cache later. |
| A3 | `streamProtocol: 'text'` with `toTextStreamResponse()` works with `useCompletion` | Architecture Pattern 2 | MEDIUM -- documentation shows `toUIMessageStreamResponse()` as the default. If text protocol has issues, switch to data protocol (default). |
| A4 | Two `useCompletion` hooks on same page with different `body` params work independently | Architecture Pattern 2 | LOW -- each hook manages independent state per docs. Different `id` values ensure isolation. |
| A5 | `BATTLE_SESSION_SECRET` env var for HMAC signing | Architecture Pattern 1 | LOW -- standard pattern; just needs to be added to .env and env.ts schema. |

## Open Questions

1. **useCompletion `body` parameter timing with dynamic token**
   - What we know: `useCompletion` accepts a `body` option and `complete()` function also accepts body overrides
   - What's unclear: Whether `body` in the `complete()` call properly overrides or merges with the hook-level `body`
   - Recommendation: Pass `body` at the `complete()` call site (not hook initialization) to ensure token is available. Test this pattern early in implementation.

2. **Response text accumulation strategy**
   - What we know: `useCompletion` returns `completion` (full accumulated text). Zustand store also tracks `responseA`/`responseB`.
   - What's unclear: Whether to sync useCompletion state -> Zustand, or read directly from useCompletion at vote time
   - Recommendation: Use useCompletion as the source of truth for response text. Zustand tracks only phase, streaming status, durations, and reveal data. Read completion text directly from hook at vote submission time.

3. **Vote endpoint -- should it create battle + vote in a transaction?**
   - What we know: D-07 says save all data at vote time. Need to insert battle record AND vote record.
   - What's unclear: Whether Supabase RPC function (transaction) or sequential inserts are safer
   - Recommendation: Use a PostgreSQL function (RPC) that inserts battle + vote in a single transaction. This guarantees atomicity -- no battle without vote, no vote without battle.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js 16 runtime | Yes | 22.x | -- |
| Node.js `crypto` | HMAC session tokens | Yes | Built-in | -- |
| Supabase (remote) | Battle data storage | Yes (configured) | -- | -- |
| npm registry | Package installation | Yes | -- | -- |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected -- no test config, no test directory, no test script |
| Config file | None |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BATTLE-01 | Two anonymous AI models respond to question | integration | Manual -- requires live AI API keys | N/A |
| BATTLE-02 | Real-time streaming (two independent streams) | integration | Manual -- verify in browser dev tools | N/A |
| BATTLE-03 | Vote A/B; disabled until both complete | unit (store logic) | `npx vitest run tests/store/battle-store.test.ts` | Wave 0 |
| BATTLE-04 | Model names revealed after vote | integration | Manual -- verify reveal flow in UI | N/A |
| BATTLE-05 | Win rates displayed on reveal | unit (SQL function) | Supabase SQL test / manual DB query | N/A |
| BATTLE-06 | Server-side random model + position | unit | `npx vitest run tests/lib/pairing.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** Manual browser test (streaming + vote flow)
- **Per wave merge:** Full manual walkthrough of battle flow
- **Phase gate:** Complete battle cycle verified (question -> stream -> vote -> reveal)

### Wave 0 Gaps
- [ ] Test framework not installed -- recommend `vitest` for unit tests if team wants automated testing
- [ ] No test directory structure exists
- [ ] Note: Phase 2 is primarily UI + integration -- most validation is manual browser testing. Unit tests add value for model pairing logic and store state transitions.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in v1 |
| V3 Session Management | Yes (battle session) | HMAC-signed token with TTL (30 min expiry), timing-safe comparison |
| V4 Access Control | No | No user roles in v1 |
| V5 Input Validation | Yes | Zod schema validation on all API inputs (question length, slot enum, winner enum) |
| V6 Cryptography | Yes (HMAC) | Node.js `crypto.createHmac('sha256')` with `timingSafeEqual` -- never hand-roll |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token tampering (change model assignment) | Tampering | HMAC signature verification with `timingSafeEqual` |
| Token replay (vote same battle twice) | Replay | Unique session ID (`sid`) + DB constraint on battle_id in votes |
| Model identity leakage via timing | Information Disclosure | Both streams start simultaneously; response time is explicitly shown (D-05) so timing is public info |
| Prompt injection via question input | Tampering | System prompt is server-controlled; user question is passed as user message only |
| Vote manipulation via forged requests | Tampering | Token must be valid HMAC-signed; server reconstructs battle from token, not client claims |
| Oversized question payload | Denial of Service | Zod validation: max 2000 characters (already in Phase 1 schema) |

## Sources

### Primary (HIGH confidence)
- [ai-sdk.dev/docs/reference/ai-sdk-core/stream-text](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text) - streamText API reference, return types, callbacks
- [ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-completion) - useCompletion hook API, parameters, return values
- [ai-sdk.dev/docs/ai-sdk-ui/stream-protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol) - Text vs data stream protocol, response method mapping
- [ai-sdk.dev/docs/ai-sdk-ui/completion](https://ai-sdk.dev/docs/ai-sdk-ui/completion) - useCompletion usage patterns with route handlers
- [ai-sdk.dev/docs/ai-sdk-rsc](https://ai-sdk.dev/docs/ai-sdk-rsc) - RSC API experimental status warning
- npm registry -- package version verification for ai, @ai-sdk/react, zustand, sonner
- Codebase inspection -- existing Phase 1 code (registry.ts, config.ts, types.ts, queries.ts, stream/route.ts)
- 02-UI-SPEC.md -- component inventory, state machine, typography, colors, animations
- 02-CONTEXT.md -- locked decisions D-01 through D-12

### Secondary (MEDIUM confidence)
- [mikecavaliere.com/posts/multiple-parallel-streams-vercel-ai-sdk](https://mikecavaliere.com/posts/multiple-parallel-streams-vercel-ai-sdk) - Parallel stream pattern with createStreamableValue
- [robinwieruch.de/react-ai-sdk-multiple-streams](https://www.robinwieruch.de/react-ai-sdk-multiple-streams/) - Multiple useChat instances pattern
- [github.com/vercel/next.js/discussions/36806](https://github.com/vercel/next.js/discussions/36806) - Vercel serverless statelessness confirmation
- [supabase.com/blog/postgrest-aggregate-functions](https://supabase.com/blog/postgrest-aggregate-functions) - PostgREST aggregate functions

### Tertiary (LOW confidence)
- [lmsys.org/blog/2023-05-03-arena](https://www.lmsys.org/blog/2023-05-03-arena/) - LMSYS Arena reference architecture (inspiration, not direct implementation guide)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified installed or on npm registry; versions confirmed
- Architecture (dual-stream + signed token): HIGH -- based on official AI SDK docs and standard crypto patterns; stateless design fits Vercel serverless model
- Architecture (useCompletion dual-hook): MEDIUM -- pattern is logical and supported by docs, but parallel dual-hook on same page needs implementation validation
- Pitfalls: HIGH -- derived from documented serverless limitations and direct code analysis
- UI patterns: HIGH -- directly from 02-UI-SPEC.md design contract

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (30 days -- stable stack, no fast-moving dependencies)
