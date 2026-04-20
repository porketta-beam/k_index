---
phase: 03-category-system
verified: 2026-04-09T16:23:50Z
status: human_needed
score: 11/11 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Select each of the 5 categories and confirm each produces a visually distinct selection state with emoji and Korean label"
    expected: "Toggle button highlights (primary background, bold font) for selected category; unselected buttons have border-only style; emoji renders correctly"
    why_human: "Visual rendering of Radix ToggleGroup with Tailwind data-[pressed] selectors cannot be confirmed programmatically without a browser"
  - test: "Expand the system prompt editor, modify text, then switch category — confirm inline warning appears"
    expected: "Warning 'modifier 프롬프트가 있습니다. 카테고리를 변경하시겠습니까?' with confirm/cancel buttons renders in the selector area"
    why_human: "Conditional UI rendering triggered by pendingCategory store state requires browser-based interaction testing"
  - test: "Select a non-default category (e.g., homework), submit a question, complete a battle, vote, and confirm the reveal header shows the correct category name"
    expected: "Reveal panel shows '과제 도움 카테고리 승률' (or equivalent for selected category) above win rate bars"
    why_human: "End-to-end flow with real AI API calls and DB win rate lookup required to confirm category propagates through the entire battle token chain"
  - test: "Select a non-default category, reload the page, confirm the category is preserved via ?cat URL parameter"
    expected: "After refresh, the same category remains selected (ToggleGroup shows it pressed); URL shows ?cat=homework (or similar)"
    why_human: "URL persistence requires browser session and navigation; window.history.replaceState behavior cannot be verified via code inspection alone"
---

# Phase 3: Category System Verification Report

**Phase Goal:** Users can select a battle category (homework, cover letter, counseling, etc.) that shapes the AI's behavior through system prompts, and can customize those prompts
**Verified:** 2026-04-09T16:23:50Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can choose from preset categories (e.g., homework, cover letter, counseling) before starting a battle | VERIFIED | `CategorySelector` renders all 5 `CATEGORIES` entries via ToggleGroup; disabled only when `!isIdle`; wired in `BattleArena` |
| 2 | Each category applies a distinct default system prompt that produces noticeably different AI behavior | VERIFIED | 5 distinct Korean prompts in `categories.ts`; stream route reads `session.sp` from signed token (not hardcoded); no `BATTLE_CONFIG.systemPrompt` usage in stream route |
| 3 | User can view and edit the system prompt for any category before submitting their question | VERIFIED | `SystemPromptEditor` provides collapsible Textarea with 500-char counter, `수정됨` badge, and reset button; `setSystemPrompt` action tracked via `isPromptModified` |

**Score:** 3/3 roadmap success criteria verified

### Plan 01 Must-Have Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | 5 preset categories exist with distinct Korean default system prompts | VERIFIED | `categories.ts` L8-44: exactly 5 entries (general, homework, cover-letter, counseling, creative), all with Unicode Korean prompts; test suite confirms "has exactly 5 entries" (9 tests pass) |
| 2 | HMAC token includes category ID and system prompt text | VERIFIED | `BattleSession` interface has `cat: string` and `sp: string` fields; `session.test.ts` roundtrip tests pass (9/9) |
| 3 | Stream route reads system prompt from token, not from hardcoded BATTLE_CONFIG | VERIFIED | `stream/route.ts` L31: `system: session.sp` — no reference to `BATTLE_CONFIG.systemPrompt` anywhere in src/ |
| 4 | Vote route reads category from token, not hardcoded 'general' | VERIFIED | `vote/route.ts` L28: `const category = session.cat` — grep confirms no `category = "general"` hardcoding remains |
| 5 | Start route validates category ID against known list and system prompt length 1-500 | VERIFIED | `start/route.ts` L14-22: Zod `.refine((val) => CATEGORIES.some((c) => c.id === val))` + `.max(500)` for systemPrompt |

### Plan 02 Must-Have Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can select from 5 preset categories before starting a battle | VERIFIED | `CategorySelector` maps `CATEGORIES` array to `ToggleGroupItem` elements; disabled with `!isIdle` in `BattleArena` L207 |
| 2 | Selecting a category updates the system prompt to that category's default | VERIFIED | `setCategory` in store: when `!isPromptModified`, sets `systemPrompt: getDefaultPrompt(categoryId)`; store tests pass (14/14) |
| 3 | User can expand the prompt editor and modify the system prompt (max 500 chars) | VERIFIED | `SystemPromptEditor`: collapsible with `Textarea`, char counter `{systemPrompt.length} / {MAX_PROMPT_CHARS}`, client-side overflow styling |
| 4 | Switching category when prompt is modified shows an inline warning with confirm/cancel | VERIFIED | `CategorySelector` L45-66: `{pendingCategory && (<div role="alert">...변경/취소</div>)}`; store logic sets `pendingCategory` when `isPromptModified` |
| 5 | Selected category persists in URL as ?cat={id} and survives page refresh | VERIFIED | `page.tsx` reads `await searchParams`; `BattleArena` uses `useRouter.replace` with `?cat=` param via `updateCategoryUrl`; default category removes param for clean URL |
| 6 | During streaming/voting/reveal, category selector is disabled and prompt editor is hidden | VERIFIED | `BattleArena` L207-210: `<CategorySelector disabled={!isIdle}/>` and `<SystemPromptEditor disabled={!isIdle}/>` — editor returns null when disabled |
| 7 | After voting, win rates header shows the category name | VERIFIED | `RevealPanel` L16: `getCategoryById(category)?.label ?? "일반"` displayed as `{categoryLabel} 카테고리 승률`; category prop passed from `BattleArena` L279 |
| 8 | New battle preserves category selection but resets prompt to default (D-05) | VERIFIED | Store `reset()` L131-137: reads current `category`, sets `systemPrompt: getDefaultPrompt(category)`, spread `...initialState` resets `isPromptModified` to false; store tests confirm this |

**Score:** 11/11 plan must-haves verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/categories.ts` | 5 categories with Korean prompts, exports CATEGORIES, getCategoryById, getDefaultPrompt | VERIFIED | All 5 exports present; 5 entries; no coding category; Unicode escape sequences for Korean |
| `src/lib/types.ts` | BattleSession with cat/sp fields | VERIFIED | L49-50: `cat: string` and `sp: string` present |
| `src/lib/battle/session.ts` | HMAC token unchanged (auto-handles new fields) | VERIFIED | No changes needed; token serializes JSON including new fields |
| `src/app/api/battle/start/route.ts` | Accepts category + systemPrompt, includes in token | VERIFIED | Zod schema validates both; `cat: category, sp: systemPrompt` in `createBattleToken` call |
| `src/app/api/battle/stream/route.ts` | Reads system prompt from session.sp | VERIFIED | L31: `system: session.sp` |
| `src/app/api/battle/vote/route.ts` | Reads category from session.cat | VERIFIED | L28: `const category = session.cat` |
| `src/lib/categories.test.ts` | Unit tests for category definitions | VERIFIED | 9 tests, all passing |
| `src/lib/battle/session.test.ts` | HMAC token roundtrip with cat/sp | VERIFIED | 9 tests, all passing |
| `src/lib/store/battle-store.ts` | Extended store with category state + actions | VERIFIED | All 4 state fields + 5 actions present; imports from @/lib/categories |
| `src/lib/store/battle-store.test.ts` | Unit tests for store category logic | VERIFIED | 14 tests, all passing |
| `src/components/battle/category-selector.tsx` | ToggleGroup-based category picker | VERIFIED | Exports `CategorySelector`; uses `useBattleStore`; renders 5 items; warning UI present |
| `src/components/battle/system-prompt-editor.tsx` | Collapsible prompt editor | VERIFIED | Exports `SystemPromptEditor`; collapsible with Textarea, char counter, reset button |
| `src/components/battle/battle-arena.tsx` | Wires CategorySelector + SystemPromptEditor + URL sync | VERIFIED | Both components imported and rendered; `category + systemPrompt` sent to `/api/battle/start` |
| `src/components/battle/reveal-panel.tsx` | Win rate header with category name | VERIFIED | `{categoryLabel} 카테고리 승률` at L24 |
| `src/app/page.tsx` | Server component reading ?cat searchParam | VERIFIED | Async, awaits `searchParams`, passes `initialCategory={cat}` to BattleArena inside Suspense |
| `src/components/ui/toggle-group.tsx` | shadcn ToggleGroup installed | VERIFIED | File exists |
| `src/components/ui/collapsible.tsx` | shadcn Collapsible installed | VERIFIED | File exists |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `src/app/api/battle/start/route.ts` | `src/lib/categories.ts` | `CATEGORIES.some()` | WIRED | L5 import; L16 `.refine((val) => CATEGORIES.some(...))` |
| `src/app/api/battle/stream/route.ts` | `session.sp` | token payload | WIRED | L31: `system: session.sp` |
| `src/app/api/battle/vote/route.ts` | `session.cat` | token payload | WIRED | L28: `const category = session.cat` |
| `src/components/battle/category-selector.tsx` | `src/lib/store/battle-store.ts` | `useBattleStore().setCategory` | WIRED | L5 import; L12: destructures `setCategory` from store; calls `setCategory(newValue)` on change |
| `src/components/battle/battle-arena.tsx` | `/api/battle/start` | fetch with category + systemPrompt | WIRED | L97-105: `JSON.stringify({ question, category: store.category, systemPrompt: store.systemPrompt })` |
| `src/app/page.tsx` | `src/components/battle/battle-arena.tsx` | `initialCategory` prop from searchParams | WIRED | L14: `<BattleArena initialCategory={cat}/>` inside Suspense |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `CategorySelector` | `category` (store) | `useBattleStore` initial state + `setCategory` action | Yes — `DEFAULT_CATEGORY_ID` → `getDefaultPrompt()` from static array | FLOWING |
| `SystemPromptEditor` | `systemPrompt` (store) | `useBattleStore` + `getDefaultPrompt(category)` | Yes — Korean text from `categories.ts`; updated by user edits via `setSystemPrompt` | FLOWING |
| `RevealPanel` | `category` (prop) | `store.category` passed by `BattleArena` L279 | Yes — real category ID from store, resolved to label via `getCategoryById` | FLOWING |
| `stream/route.ts` | `session.sp` | HMAC token from `/api/battle/start` | Yes — user-selected/edited systemPrompt embedded in signed token | FLOWING |
| `vote/route.ts` | `session.cat` | HMAC token from `/api/battle/start` | Yes — validated category ID embedded in signed token | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| categories.ts exports exactly 5 entries | `npx vitest run src/lib/categories.test.ts` | 9 tests passed | PASS |
| HMAC token roundtrips cat/sp fields | `npx vitest run src/lib/battle/session.test.ts` | 9 tests passed | PASS |
| Zustand store category logic correct | `npx vitest run src/lib/store/battle-store.test.ts` | 14 tests passed | PASS |
| TypeScript compiles without errors | `npx tsc --noEmit` | Exit 0, no errors | PASS |
| Coding category absent | `grep "coding" src/lib/categories.ts` | No matches | PASS |
| BATTLE_CONFIG.systemPrompt not used in stream route | `grep "BATTLE_CONFIG.systemPrompt" src/` | No matches | PASS |
| Hardcoded "general" removed from vote route | `grep 'category = "general"' src/` | No matches | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-----------|-------------|--------|----------|
| CAT-01 | 03-01, 03-02 | 프리셋 카테고리를 선택할 수 있다 (과제, 자기소개서, 고민상담 등) | SATISFIED | `CategorySelector` with 5 presets; validates category in start route |
| CAT-02 | 03-01, 03-02 | 각 카테고리에 기본 시스템 프롬프트가 제공된다 | SATISFIED | `categories.ts` `defaultPrompt` field per category; stream route reads `session.sp` from token |
| CAT-03 | 03-01, 03-02 | 사용자가 기본 시스템 프롬프트를 수정할 수 있다 | SATISFIED | `SystemPromptEditor` with Textarea + 500-char limit; `setSystemPrompt` action tracks modifications |

All 3 phase requirements satisfied. No orphaned requirements (REQUIREMENTS.md maps CAT-01, CAT-02, CAT-03 exclusively to Phase 3).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `system-prompt-editor.tsx` | 61 | `placeholder=` attribute | Info | HTML textarea placeholder text — not a stub, genuine UX copy |
| `battle-input.tsx` | 40 | `placeholder=` attribute | Info | HTML textarea placeholder text — not a stub, genuine UX copy |

No blockers or warnings found. The `placeholder` attributes are HTML form attributes providing UX hints, not stub implementations. No `return null` stubs, no empty data returns, no hardcoded category values, no TODO/FIXME comments in modified files.

### Human Verification Required

#### 1. Category Toggle Visual Selection State

**Test:** Visit the battle page. Click through each of the 5 category buttons (💬 일반, 📚 과제 도움, 📝 자기소개서, 🤗 고민 상담, ✨ 창작).
**Expected:** The selected button shows primary background color with bold text. Unselected buttons show only border styling. Emoji renders as emoji (not as Unicode escape sequences). Buttons wrap naturally to 3+2 rows on mobile.
**Why human:** Radix ToggleGroup uses `data-[pressed]` CSS selector for selected state. Visual rendering of Tailwind utility classes applied to Radix data attributes cannot be verified without a browser rendering engine.

#### 2. Category Switch Warning with Modified Prompt

**Test:** Select a category, expand the system prompt editor, modify the prompt text, then click a different category.
**Expected:** An inline warning appears below the category toggle group: "수정한 프롬프트가 있습니다. 카테고리를 변경하시겠습니까?" with "변경" and "취소" buttons. Clicking "변경" switches category and resets the prompt; clicking "취소" keeps the current category and modified prompt.
**Why human:** Conditional rendering from `pendingCategory` store state requires user interaction to trigger; automated tests verify the store logic but not the rendered warning UI.

#### 3. End-to-End Category Flow with Real AI Call

**Test:** Select "과제 도움" category, submit a question, wait for both AI responses to stream, vote for one, and observe the reveal panel.
**Expected:** The reveal panel header shows "과제 도움 카테고리 승률" above the win rate bars. The AI responses should reflect homework-tutoring style (step-by-step explanations, no direct answers) consistent with the system prompt for that category.
**Why human:** Full end-to-end verification requires live AI API keys, a running Supabase instance, and subjective assessment of whether the system prompt produced noticeably different AI behavior (Roadmap SC #2).

#### 4. URL Category Persistence Across Page Refresh

**Test:** Select "자기소개서" category. Observe URL changes to `?cat=cover-letter`. Reload the page.
**Expected:** After reload, the cover-letter category is still selected (ToggleGroup shows it as pressed). Selecting the default "일반" category cleans the URL (no ?cat= parameter).
**Why human:** URL persistence via `window.history.replaceState` and Next.js `useRouter.replace` requires a browser environment. The server-side `searchParams` → `initialCategory` → `store.setCategory` chain needs a real navigation test.

### Gaps Summary

No gaps found. All 11 must-have truths are verified, all 17 artifacts exist and are substantive and wired, all 6 key links are confirmed, all 3 requirements are satisfied, and all behavioral spot-checks pass. The 4 human verification items are standard UAT items for UI interaction and AI behavior quality — they cannot be resolved programmatically and require a running application.

---

_Verified: 2026-04-09T16:23:50Z_
_Verifier: Claude (gsd-verifier)_
