# Roadmap: K-Index

## Overview

K-Index delivers a Korean AI blind battle arena in five phases. We start by laying the infrastructure foundation -- database, AI provider abstraction, fingerprinting, and rate limiting -- so that cost control and abuse prevention are baked in from day one. Next, we build the core battle loop (the entire product value proposition). Then we layer on preset categories with editable system prompts, followed by the season system that acts as both a product differentiator and an operational cost circuit breaker. Finally, we polish the Korean UI, responsive layout, and end-to-end user flow.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & AI Integration** - Database schema, AI provider layer, fingerprinting, and rate limiting infrastructure
- [ ] **Phase 2: Core Battle Loop** - Complete blind battle flow from prompt input to model reveal with win rates
- [ ] **Phase 3: Category System** - Preset categories with default and editable system prompts
- [ ] **Phase 4: Season System & Global State** - Global request counter, auto-shutdown, season lifecycle, admin controls
- [ ] **Phase 5: Korean UI & Responsive Polish** - Korean localization, responsive design, and end-to-end UX flow refinement

## Phase Details

### Phase 1: Foundation & AI Integration
**Goal**: A working backend where any of the 3 AI models can receive a prompt and return a streaming response, with Supabase database schema for battle data storage. Fingerprinting and rate limiting deferred per user decisions (D-01 through D-04).
**Depends on**: Nothing (first phase)
**Requirements**: AI-01, AI-02, AI-03, AI-04, SEC-01, SEC-02, DATA-01
**Success Criteria** (what must be TRUE):
  1. A test prompt sent to GPT-4o-mini returns a streaming Korean response via the unified provider layer
  2. A test prompt sent to Claude Haiku returns a streaming Korean response via the same provider interface
  3. A test prompt sent to Gemini Flash returns a streaming Korean response via the same provider interface
  4. All AI responses are capped at the configured max_tokens limit (budget control enforced)
  5. Battle data (question, responses, vote, model, category, timestamps) can be stored in and retrieved from Supabase
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Project scaffold, dependencies, env validation, shared types, Supabase schema & query layer
- [x] 01-02-PLAN.md — AI provider registry, battle config, streaming Route Handler, smoke test
- [x] 01-03-PLAN.md — Database schema push, end-to-end integration verification

### Phase 2: Core Battle Loop
**Goal**: Users can experience a complete blind battle -- type a question, see two anonymous AI responses stream in, vote for the better one, and discover which models they were
**Depends on**: Phase 1
**Requirements**: BATTLE-01, BATTLE-02, BATTLE-03, BATTLE-04, BATTLE-05, BATTLE-06
**Success Criteria** (what must be TRUE):
  1. User types a Korean question and two anonymous AI responses appear (labeled Model A / Model B with no identity hints)
  2. Responses stream in real-time; both complete before either is revealed to the user (fairness preserved)
  3. User can vote A wins or B wins, and voting is disabled until both responses finish streaming
  4. After voting, the actual model names (GPT / Claude / Gemini) are revealed for each response
  5. After voting, per-category win rates for each revealed model are displayed alongside the result
**Plans:** 4 plans
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Server battle infrastructure: types, HMAC session tokens, model pairing, 3 API routes, win rate SQL
- [x] 02-02-PLAN.md — Client foundation: shadcn/ui init, Zustand + sonner install, Pretendard font, CSS design system
- [x] 02-03-PLAN.md — Zustand battle store + 6 battle UI components (input, response card, vote panel, reveal panel, etc.)
- [x] 02-04-PLAN.md — Battle arena orchestrator wiring dual streams + page.tsx + end-to-end verification checkpoint

### Phase 3: Category System
**Goal**: Users can select a battle category (homework, cover letter, counseling, etc.) that shapes the AI's behavior through system prompts, and can customize those prompts
**Depends on**: Phase 2
**Requirements**: CAT-01, CAT-02, CAT-03
**Success Criteria** (what must be TRUE):
  1. User can choose from preset categories (e.g., homework, cover letter, counseling) before starting a battle
  2. Each category applies a distinct default system prompt that produces noticeably different AI behavior
  3. User can view and edit the system prompt for any category before submitting their question
**Plans:** 2 plans
**UI hint**: yes

Plans:
- [x] 03-01-PLAN.md — Category data layer, BattleSession type extension, HMAC token with cat/sp, API route updates, unit tests
- [x] 03-02-PLAN.md — Zustand store extension, CategorySelector + SystemPromptEditor UI, BattleArena wiring, URL persistence, visual checkpoint

### Phase 4: Season System & Global State
**Goal**: The platform operates on a season model where a global request counter tracks all battles, automatically shuts down when the threshold is reached, and admins can manually control season lifecycle
**Depends on**: Phase 2
**Requirements**: SEASON-01, SEASON-02, SEASON-03, SEASON-04, DATA-02
**Success Criteria** (what must be TRUE):
  1. A visible global battle counter increments with each completed battle and can be viewed in real-time
  2. When the global counter reaches the configured threshold, new battles are blocked and a "Season N battle is over" message appears
  3. An admin can manually start a new season or end the current season early
  4. During an ended season, users see the season-end message instead of the battle interface
**Plans:** 3 plans
**UI hint**: yes

Plans:
- [ ] 04-01-PLAN.md — Season data foundation: types, env, Redis client, SQL migrations
- [ ] 04-02-PLAN.md — Season logic modules + admin auth + unit tests
- [ ] 04-03-PLAN.md — API route integration, client UI, DB push, end-to-end verification

### Phase 5: Korean UI & Responsive Polish
**Goal**: The entire interface is naturally Korean-first, works flawlessly on mobile/tablet/desktop, and the end-to-end battle flow feels smooth and intuitive
**Depends on**: Phase 2, Phase 3, Phase 4
**Requirements**: UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. All interface text is Korean-first, with English mixed in only where natural (e.g., model names, technical terms)
  2. The battle page renders correctly and is fully usable on mobile (375px), tablet (768px), and desktop (1280px+)
  3. The complete flow -- category selection, prompt input, streaming responses, voting, result reveal -- feels like one continuous experience with no jarring transitions
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & AI Integration | 0/3 | Planning complete | - |
| 2. Core Battle Loop | 0/4 | Planning complete | - |
| 3. Category System | 0/2 | Planning complete | - |
| 4. Season System & Global State | 0/3 | Planning complete | - |
| 5. Korean UI & Responsive Polish | 0/2 | Not started | - |
