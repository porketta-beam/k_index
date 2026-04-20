# Phase 3: Category System - Research

**Researched:** 2026-04-09
**Domain:** Category selection UI, system prompt management, HMAC token extension, URL state persistence
**Confidence:** HIGH

## Summary

Phase 3 adds a category selection system to the existing battle flow. Users choose from 5 preset categories (general, homework, cover-letter, counseling, creative) before starting a battle, each applying a distinct Korean system prompt that shapes AI behavior. Users can optionally edit the system prompt (up to 500 characters), and the selected category persists via URL query parameter (`?cat={categoryId}`).

The implementation is well-scoped: the UI-SPEC and CONTEXT.md define every component, state transition, and API contract change in detail. Categories are static code constants (no DB table needed). The main technical work involves: (1) two new UI components (CategorySelector + SystemPromptEditor) using shadcn toggle-group and collapsible, (2) extending the Zustand store with category/prompt state, (3) modifying the HMAC token payload to include category + system prompt, (4) updating three API routes to read from the token instead of hardcoded values, and (5) URL searchParams integration for category persistence.

**Primary recommendation:** Implement in 3-4 plans -- data layer + token changes first, then UI components, then integration/URL persistence. The system prompt is small enough (max ~2.4KB base64url) to embed directly in the HMAC token payload; no server-side cache is needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** 5 preset categories: general, homework, cover-letter, counseling, creative. Coding category from UI-SPEC is REMOVED.
- **D-02:** Default selected category is "general".
- **D-03:** Categories defined as static array in `src/lib/categories.ts`. No DB table.
- **D-04:** Category add/edit requires code change + deploy. No admin UI in v1.
- **D-05:** Custom system prompt resets to default on each new battle.
- **D-06:** URL query parameter `?cat={categoryId}` preserves selected category across refresh/share. Custom prompt NOT in URL.

### Claude's Discretion
- System prompt HMAC token inclusion strategy: embed directly vs. server-side cache
- URL query parameter implementation approach with Next.js 16 searchParams
- Prompt validation beyond 500-char limit (server-side)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAT-01 | Preset category selection (homework, cover-letter, counseling, etc.) | CategorySelector component using shadcn toggle-group with single selection; categories defined in `src/lib/categories.ts` as static array |
| CAT-02 | Each category has a default system prompt | CategoryDef interface with `defaultPrompt` field; system prompt passed through HMAC token to stream route |
| CAT-03 | User can edit the default system prompt | SystemPromptEditor component using shadcn collapsible + textarea; 500-char limit; prompt included in HMAC token |
</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Verified |
|---------|---------|---------|----------|
| Next.js | 16.2.2 | Framework (App Router, useSearchParams) | [VERIFIED: package.json] |
| React | 19.2.4 | UI library | [VERIFIED: package.json] |
| Zustand | 5.0.12 | Client state for category/prompt | [VERIFIED: package.json] |
| Zod | 3.24.x | Schema validation for API requests | [VERIFIED: package.json] |
| shadcn/ui | 4.2.0 (CLI) | Component primitives | [VERIFIED: package.json] |
| sonner | 2.0.7 | Toast notifications | [VERIFIED: package.json] |
| lucide-react | 1.7.x | Icons (ChevronDown for collapsible) | [VERIFIED: package.json] |

### New shadcn Components to Install

| Component | Source | Purpose | Install Command |
|-----------|--------|---------|-----------------|
| toggle-group | shadcn registry (Radix UI) | Single-select category picker | `npx shadcn@latest add toggle-group` |
| collapsible | shadcn registry (Radix UI) | Expandable system prompt editor | `npx shadcn@latest add collapsible` |

[VERIFIED: UI-SPEC specifies these exact components] [CITED: https://ui.shadcn.com/docs/components/radix/toggle-group, https://ui.shadcn.com/docs/components/radix/collapsible]

**No new npm packages required.** All libraries are already in package.json.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| toggle-group | Custom button group | toggle-group provides Radix accessibility (roving tabindex, keyboard nav) for free |
| collapsible | Accordion or custom div toggle | Collapsible is simpler (no accordion group logic), matches the single-section expand pattern |
| URL searchParams | Zustand persist middleware | searchParams enables link sharing and survives full page reload without localStorage |

## Architecture Patterns

### New Files to Create

```
src/
  lib/
    categories.ts           # Static category definitions (D-03)
  components/
    battle/
      category-selector.tsx  # ToggleGroup wrapper (CAT-01)
      system-prompt-editor.tsx # Collapsible prompt editor (CAT-03)
```

### Files to Modify

```
src/
  lib/
    types.ts                # BattleSession: add cat, sp fields
    store/
      battle-store.ts       # Add category/prompt state + actions
    ai/
      config.ts             # BATTLE_CONFIG.systemPrompt becomes fallback only
  app/
    page.tsx                # Read ?cat from searchParams, pass to BattleArena
    api/
      battle/
        start/route.ts      # Accept category + systemPrompt, include in token
        stream/route.ts      # Read systemPrompt from token instead of BATTLE_CONFIG
        vote/route.ts        # Read category from token instead of hardcoded "general"
  components/
    battle/
      battle-arena.tsx       # Insert CategorySelector + SystemPromptEditor, pass category/prompt to start
      reveal-panel.tsx       # Show category name in win rate section header
```

### Pattern 1: Category Data as Static Constants

**What:** Define categories as a typed array in a single module, not in DB.
**When to use:** v1 with 5 fixed categories, no admin UI.
**Example:**
```typescript
// src/lib/categories.ts
// Source: CONTEXT.md D-03, UI-SPEC

export interface CategoryDef {
  id: string;
  emoji: string;
  label: string;        // Korean display name
  defaultPrompt: string; // Default system prompt
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "general",
    emoji: "\uD83D\uDCAC", // Will render as emoji in actual file
    label: "\uC77C\uBC18",
    defaultPrompt: "...",
  },
  // ... 4 more (homework, cover-letter, counseling, creative)
  // NOTE: coding category REMOVED per D-01
];

export const DEFAULT_CATEGORY_ID = "general"; // D-02

export function getCategoryById(id: string): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getDefaultPrompt(categoryId: string): string {
  return getCategoryById(categoryId)?.defaultPrompt ?? CATEGORIES[0].defaultPrompt;
}
```

### Pattern 2: HMAC Token Extension with System Prompt

**What:** Embed category ID + system prompt text directly in the HMAC token payload.
**When to use:** When the system prompt is bounded (500 chars max) and tokens are transmitted via POST body.
**Why direct embed (Claude's discretion decision):**
- Max token size with 500 Korean chars: ~2.4KB. POST body has no practical size limit. [VERIFIED: computed via Node.js Buffer test]
- Server-side cache adds complexity (cache invalidation, storage, lookup latency) for no benefit at this scale.
- Direct embed keeps the existing stateless HMAC pattern intact -- no new infrastructure.
- The token is already base64url-encoded JSON, so adding two fields is trivial.

**Example:**
```typescript
// Extended BattleSession in src/lib/types.ts
export interface BattleSession {
  sid: string;
  q: string;
  mA: BudgetModelId;
  mB: BudgetModelId;
  pA: "left" | "right";
  cat: string;    // NEW: category ID
  sp: string;     // NEW: system prompt text
  ts: number;
}
```

### Pattern 3: URL Category Persistence with useSearchParams

**What:** Sync selected category to URL `?cat={id}` so it persists on refresh and is shareable.
**When to use:** When category selection should survive page reload and be linkable.
**Implementation approach (Claude's discretion decision):**

The cleanest pattern for Next.js 16 App Router is:
1. In server component `page.tsx`: read `searchParams` prop and pass initial category to `BattleArena`.
2. In client component `BattleArena`: use `useSearchParams` + `useRouter` to update URL on category change.
3. Wrap `BattleArena` in `<Suspense>` boundary per Next.js docs requirement for `useSearchParams`.

**Example:**
```typescript
// src/app/page.tsx (server component)
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;
  return (
    <main className="flex-1">
      <Suspense fallback={null}>
        <BattleArena initialCategory={cat} />
      </Suspense>
    </main>
  );
}
```

```typescript
// Inside BattleArena (client component) - URL sync on category change
import { useRouter, useSearchParams, usePathname } from "next/navigation";

// Update URL when category changes (no page reload)
const updateCategoryUrl = (categoryId: string) => {
  const params = new URLSearchParams(searchParams.toString());
  if (categoryId === DEFAULT_CATEGORY_ID) {
    params.delete("cat"); // Clean URL for default
  } else {
    params.set("cat", categoryId);
  }
  const query = params.toString();
  router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
};
```

[CITED: https://nextjs.org/docs/app/api-reference/functions/use-search-params]

### Pattern 4: Zustand Store Extension

**What:** Add category and system prompt state to the existing battle store.
**Example:**
```typescript
// New state fields added to battle-store.ts
category: string;              // Selected category ID
systemPrompt: string;          // Current system prompt (may be edited)
isPromptModified: boolean;     // Whether user edited the default
pendingCategory: string | null; // Awaiting confirmation when prompt modified

// New actions
setCategory: (categoryId: string) => void;
confirmCategorySwitch: () => void;
cancelCategorySwitch: () => void;
setSystemPrompt: (prompt: string) => void;
resetPrompt: () => void;
```

Key behavior per UI-SPEC:
- `setCategory`: If `isPromptModified`, sets `pendingCategory` instead of switching (triggers warning UI). Otherwise, switches immediately and resets prompt to new category default.
- `reset` (existing): Preserves `category` but resets `systemPrompt` to category default and clears `isPromptModified`. Per D-05: new battle = prompt reset.
- `startBattle` (existing): Must now include `category` and `systemPrompt` in the API call.

### Anti-Patterns to Avoid

- **Storing category in separate Zustand store:** Keep it in the existing battle store. The category is battle-lifecycle state, not independent app state.
- **Using localStorage for category persistence:** D-06 specifies URL query params. localStorage would not support link sharing.
- **Validating system prompt only on client:** Server-side validation in `/api/battle/start` is required. Client validation is UX, server validation is security.
- **Passing system prompt from client to stream route:** The prompt MUST come from the signed HMAC token, never from the client request body to the stream route. This is the existing security pattern (D-08 from Phase 2).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toggle group with keyboard nav | Custom button group with manual focus management | shadcn toggle-group (Radix UI) | Roving tabindex, arrow key navigation, ARIA roles built-in [CITED: Radix ToggleGroup docs] |
| Collapsible section with animation | Custom div with height transition | shadcn collapsible (Radix UI) | Handles height animation, ARIA expanded/controls, keyboard toggle |
| URL search param sync | Custom pushState wrapper | `useSearchParams` + `useRouter` from `next/navigation` | Framework-integrated, works with App Router's partial rendering |

## Common Pitfalls

### Pitfall 1: Forgetting to Remove Coding Category from UI-SPEC

**What goes wrong:** UI-SPEC defines 6 categories including coding. D-01 removes coding, leaving 5.
**Why it happens:** Developer implements from UI-SPEC table without checking CONTEXT.md decisions.
**How to avoid:** Categories array MUST have exactly 5 entries. The UI-SPEC's 2x3 mobile grid becomes 2x2+1 or a different layout for 5 items.
**Warning signs:** Any reference to `coding` category ID or 6 toggle items.

### Pitfall 2: HMAC Token Not Including System Prompt

**What goes wrong:** System prompt is read from `BATTLE_CONFIG` instead of the token, so all categories use the same "general" prompt.
**Why it happens:** Stream route still references `BATTLE_CONFIG.systemPrompt` after partial refactor.
**How to avoid:** Stream route MUST read `session.sp` from the verified token. `BATTLE_CONFIG.systemPrompt` becomes a fallback constant only.
**Warning signs:** All categories producing identical AI responses.

### Pitfall 3: Category Switch Without Prompt Warning

**What goes wrong:** User edits system prompt, switches category, loses edits silently.
**Why it happens:** `setCategory` action doesn't check `isPromptModified` flag.
**How to avoid:** UI-SPEC mandates an inline warning with confirm/cancel when `isPromptModified` is true. The `pendingCategory` state pattern handles this.
**Warning signs:** No warning UI appears when switching categories after editing prompt.

### Pitfall 4: useSearchParams Without Suspense Boundary

**What goes wrong:** Next.js renders the entire page client-side, or throws a build error.
**Why it happens:** `useSearchParams()` in a client component without a Suspense boundary causes the component tree up to the nearest Suspense to be client-rendered.
**How to avoid:** Wrap `BattleArena` (which uses `useSearchParams`) in `<Suspense>` in `page.tsx`.
**Warning signs:** Build warnings about client-side rendering, slow initial page load.
[CITED: https://nextjs.org/docs/app/api-reference/functions/use-search-params]

### Pitfall 5: Vote Route Still Hardcoding "general"

**What goes wrong:** All battles are saved with `category = "general"` regardless of user selection, corrupting win rate data.
**Why it happens:** Vote route has `const category = "general"` comment saying "Phase 3 adds category selection" -- easy to miss.
**How to avoid:** Replace hardcoded string with `session.cat` from verified token. Remove the Phase 3 TODO comment.
**Warning signs:** Win rates don't change when filtering by category.

### Pitfall 6: System Prompt Validation Gap

**What goes wrong:** User submits empty or oversized system prompt, causing AI API errors or cost overruns.
**Why it happens:** Only client-side validation, no server-side check.
**How to avoid:** Add Zod validation in `/api/battle/start` for `systemPrompt`: min 1 char, max 500 chars. Also validate `category` is one of the known IDs.
**Warning signs:** 500 errors from AI providers with empty system prompts.

### Pitfall 7: Mobile Grid Layout for 5 Items (not 6)

**What goes wrong:** UI-SPEC designed a 2x3 grid for 6 categories. With 5, the last row has 1 orphan item.
**Why it happens:** D-01 removed coding category after UI-SPEC was written.
**How to avoid:** Design a clean 5-item mobile layout. Options: 3+2 grid, single scrollable row, or 2+2+1 with the last item full-width. Recommend 3+2 (first row 3 items, second row 2 items centered).
**Warning signs:** Awkward spacing or uneven grid on mobile.

## Code Examples

### Example 1: CategorySelector Component

```typescript
// Source: UI-SPEC + shadcn toggle-group docs
"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CATEGORIES } from "@/lib/categories";
import { useBattleStore } from "@/lib/store/battle-store";

export function CategorySelector({ disabled }: { disabled?: boolean }) {
  const { category, setCategory, pendingCategory } = useBattleStore();

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">category label</p>
      <ToggleGroup
        type="single"
        value={category}
        onValueChange={(value) => {
          if (value) setCategory(value); // Prevent deselect (empty string)
        }}
        disabled={disabled}
        className="flex flex-wrap gap-2"
      >
        {CATEGORIES.map((cat) => (
          <ToggleGroupItem
            key={cat.id}
            value={cat.id}
            className="min-h-[44px] px-4 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:font-bold"
          >
            {cat.emoji} {cat.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {/* Inline warning when pendingCategory is set */}
    </div>
  );
}
```

### Example 2: SystemPromptEditor Component

```typescript
// Source: UI-SPEC + shadcn collapsible docs
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBattleStore } from "@/lib/store/battle-store";

const MAX_PROMPT_CHARS = 500;

export function SystemPromptEditor({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const { systemPrompt, isPromptModified, setSystemPrompt, resetPrompt } =
    useBattleStore();

  if (disabled) return null; // Hidden during streaming/voting/reveal per UI-SPEC

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
          {open ? "system prompt hide label" : "system prompt show label"}
          {isPromptModified && (
            <Badge variant="secondary" className="ml-2 text-xs">modified badge</Badge>
          )}
        </CollapsibleTrigger>
        {open && isPromptModified && (
          <Button variant="ghost" size="sm" onClick={resetPrompt}>
            restore default label
          </Button>
        )}
      </div>
      <CollapsibleContent>
        <div className="mt-2 space-y-1">
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="text-sm min-h-[80px] max-h-[200px] resize-y"
            aria-label="system prompt edit aria label"
            placeholder="placeholder text"
          />
          <p className={`text-xs font-mono text-right ${
            systemPrompt.length > MAX_PROMPT_CHARS ? "text-destructive" : "text-muted-foreground"
          }`}>
            {systemPrompt.length} / {MAX_PROMPT_CHARS}
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

### Example 3: Modified /api/battle/start Route

```typescript
// Source: Existing start/route.ts + CONTEXT.md API contract changes
import { CATEGORIES, getCategoryById } from "@/lib/categories";

const requestSchema = z.object({
  question: z.string().min(1).max(2000),
  category: z.string().refine(
    (val) => CATEGORIES.some((c) => c.id === val),
    "Invalid category"
  ),
  systemPrompt: z.string().min(1, "System prompt required").max(500, "System prompt too long"),
});

// In handler:
const token = createBattleToken({
  sid: nanoid(),
  q: question,
  mA: modelA,
  mB: modelB,
  pA: positionA,
  cat: category,       // NEW
  sp: systemPrompt,    // NEW
  ts: Date.now(),
});
```

### Example 4: Modified /api/battle/stream Route

```typescript
// Source: Existing stream/route.ts -- key change
const result = streamText({
  model: registry.languageModel(modelId),
  system: session.sp,  // CHANGED: was BATTLE_CONFIG.systemPrompt
  prompt,
  maxOutputTokens: BATTLE_CONFIG.maxOutputTokens,
  temperature: BATTLE_CONFIG.temperature,
});
```

### Example 5: Modified /api/battle/vote Route

```typescript
// Source: Existing vote/route.ts -- key change
const category = session.cat;  // CHANGED: was hardcoded "general"
```

## State of the Art

| Old Approach (Phase 2) | New Approach (Phase 3) | Impact |
|------------------------|------------------------|--------|
| Hardcoded `BATTLE_CONFIG.systemPrompt` for all battles | System prompt from HMAC token per battle | Each category produces distinct AI behavior |
| `category = "general"` hardcoded in vote route | Category from HMAC token | Win rates are per-category accurate |
| No category UI | CategorySelector + SystemPromptEditor | Users control AI context |
| No URL state | `?cat={id}` in URL | Category survives refresh, enables sharing |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | shadcn toggle-group `type="single"` prevents deselection (fires empty string, not undefined) | Code Examples | Minor -- add null check in onValueChange handler |
| A2 | Next.js 16 `searchParams` is a Promise in server components (per Next.js 15+ pattern) | Architecture Patterns | Medium -- may need `use()` unwrapping or synchronous access depending on exact version behavior |
| A3 | 5-item mobile grid works best as 3+2 centered layout | Pitfalls | Low -- purely visual preference, easy to adjust |

## Open Questions (RESOLVED)

1. **Mobile Layout for 5 Categories** (RESOLVED)
   - What we know: UI-SPEC designed for 6 (2x3 grid). D-01 removed coding, leaving 5.
   - What's unclear: Best visual layout for 5 items on mobile.
   - RESOLVED: Use `flex flex-wrap gap-2` on the ToggleGroup container. On mobile, 5 items naturally wrap into 3+2 rows. Plan 02 Task 2 implements this with `className="flex flex-wrap gap-2"` on the ToggleGroup.

2. **searchParams as Promise in Next.js 16** (RESOLVED)
   - What we know: Next.js 15 changed `searchParams` to a Promise. Next.js 16 likely continues this pattern.
   - What's unclear: Whether page.tsx needs `await searchParams` or if it's synchronous.
   - RESOLVED: Use `await searchParams` in async server component page.tsx. Plan 02 Task 2 implements `export default async function Home({ searchParams }: { searchParams: Promise<{ cat?: string }> })` with `const { cat } = await searchParams;`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.3 |
| Config file | `vitest.config.ts` (exists, configured with `@` alias) |
| Quick run command | `npm run test` (vitest run) |
| Full suite command | `npm run test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAT-01 | Category selection updates store state | unit | `npx vitest run src/lib/categories.test.ts -t "categories"` | No -- Wave 0 |
| CAT-01 | CategorySelector renders 5 categories, handles selection | unit (jsdom) | `npx vitest run src/components/battle/category-selector.test.tsx` | No -- Wave 0 |
| CAT-02 | Each category has distinct default system prompt | unit | `npx vitest run src/lib/categories.test.ts -t "default prompt"` | No -- Wave 0 |
| CAT-02 | Stream route uses system prompt from token | unit | `npx vitest run src/app/api/battle/stream/route.test.ts` | No -- Wave 0 |
| CAT-03 | System prompt editing updates store, respects 500 char limit | unit | `npx vitest run src/lib/store/battle-store.test.ts` | No -- Wave 0 |
| CAT-03 | Start route validates category + system prompt | unit | `npx vitest run src/app/api/battle/start/route.test.ts` | No -- Wave 0 |
| CAT-01/02 | HMAC token includes cat and sp fields | unit | `npx vitest run src/lib/battle/session.test.ts` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/lib/categories.test.ts` -- covers CAT-01, CAT-02 (category definitions, lookup functions)
- [ ] `src/lib/store/battle-store.test.ts` -- covers CAT-03 (category state, prompt editing, pending switch)
- [ ] `src/lib/battle/session.test.ts` -- covers token extension (create/verify with cat+sp fields)
- [ ] Vitest environment may need `jsdom` for component tests (current config uses `node`)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | N/A (no auth in v1) |
| V3 Session Management | Yes | HMAC token with TTL (existing pattern) |
| V4 Access Control | No | N/A |
| V5 Input Validation | Yes | Zod schema validation on category ID + system prompt (server-side) |
| V6 Cryptography | No | HMAC-SHA256 already implemented (no changes to crypto) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client sends forged category/prompt to stream route | Tampering | HMAC token -- stream/vote routes ONLY read from signed token, never from client request body |
| Prompt injection via custom system prompt | Tampering | 500-char limit reduces attack surface. System prompt is user-facing, so injection risk is accepted (user controls their own AI context). No escalation of privilege since all models are budget-tier. |
| Oversized system prompt causing cost overrun | Denial of Service | Server-side Zod validation enforces max 500 chars before token creation |
| Invalid category ID bypassing validation | Tampering | Zod `.refine()` checks category ID against known CATEGORIES array |

## Sources

### Primary (HIGH confidence)
- Codebase files: `src/lib/types.ts`, `src/lib/battle/session.ts`, `src/lib/store/battle-store.ts`, `src/components/battle/battle-arena.tsx`, `src/app/api/battle/start/route.ts`, `src/app/api/battle/stream/route.ts`, `src/app/api/battle/vote/route.ts`, `src/lib/db/queries.ts`, `src/lib/ai/config.ts` -- all read directly
- `03-CONTEXT.md` -- user decisions D-01 through D-06
- `03-UI-SPEC.md` -- complete component inventory, state machine, API contract, accessibility
- `package.json` -- verified all dependency versions

### Secondary (MEDIUM confidence)
- [shadcn/ui toggle-group docs](https://ui.shadcn.com/docs/components/radix/toggle-group) -- component API and usage
- [shadcn/ui collapsible docs](https://ui.shadcn.com/docs/components/radix/collapsible) -- component API and usage
- [Radix UI ToggleGroup](https://www.radix-ui.com/primitives/docs/components/toggle-group) -- accessibility features, keyboard nav, props
- [Next.js useSearchParams](https://nextjs.org/docs/app/api-reference/functions/use-search-params) -- Suspense requirement, client component usage

### Tertiary (LOW confidence)
- A2 assumption: searchParams as Promise in Next.js 16 -- based on Next.js 15 pattern, not verified for exact 16.2.2 behavior

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and used in Phase 2
- Architecture: HIGH -- extends established patterns (HMAC token, Zustand store, Route Handlers)
- Pitfalls: HIGH -- derived from direct codebase reading (found exact hardcoded values to change)
- UI Components: HIGH -- shadcn toggle-group and collapsible are well-documented Radix primitives

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable stack, no fast-moving dependencies)
