# Phase 3: Category System - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 프리셋 카테고리(일반, 과제, 자소서, 상담, 창작)를 선택하여 AI 행동을 시스템 프롬프트로 조절하고, 해당 프롬프트를 커스터마이징할 수 있는 시스템. 카테고리 선택은 배틀 전에 이루어지며, 선택된 카테고리와 시스템 프롬프트가 HMAC 토큰에 포함되어 배틀 전체에 적용된다.

**Phase 2에서 가져오는 것:**
- 완전한 배틀 플로우 (질문 → 스트리밍 → 투표 → 공개)
- HMAC 토큰 기반 세션 관리 (`src/lib/battle/session.ts`)
- Zustand 배틀 스토어 (`src/lib/store/battle-store.ts`)
- 7개 배틀 UI 컴포넌트 (`src/components/battle/`)
- shadcn/ui 컴포넌트 (button, card, textarea, badge, separator, skeleton)
- Supabase DB 쿼리 함수 (`src/lib/db/queries.ts`) — category 필드 이미 지원

</domain>

<decisions>
## Implementation Decisions

### 카테고리 목록
- **D-01:** 5개 프리셋 카테고리로 확정: 일반(💬), 과제(📚), 자소서(📝), 상담(🤗), 창작(✨). UI-SPEC의 코딩(💻) 카테고리는 삭제.
- **D-02:** 기본 선택 카테고리는 "일반(general)".

### 카테고리 데이터 구조
- **D-03:** `src/lib/categories.ts`에 static array로 정의. DB 테이블 불필요.
- **D-04:** 향후 카테고리 추가/수정 시 코드 수정 + 배포 방식. v1에서 관리 UI 불필요.

### 커스텀 프롬프트 지속성
- **D-05:** 새 배틀 시작 시 커스텀 시스템 프롬프트를 매번 기본값으로 초기화한다. (UI-SPEC 확인)
- **D-06:** URL 쿼리 파라미터(`?cat={categoryId}`)로 선택된 카테고리를 유지한다. 브라우저 새로고침/링크 공유 시 카테고리가 보존됨. 커스텀 프롬프트는 URL에 포함하지 않음 (초기화됨).

### Claude's Discretion
- 시스템 프롬프트 HMAC 토큰 포함 방식: 긴 프롬프트 텍스트를 토큰에 직접 포함할지, 서버 사이드 캐시를 활용할지 Claude가 결정
- URL 쿼리 파라미터 구현 방식: Next.js 16 searchParams 활용 패턴은 Claude가 결정
- 프롬프트 유효성 검증: 500자 제한 외의 서버 사이드 검증은 Claude가 판단하여 결정

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — CAT-01~CAT-03 requirements (이 phase의 핵심). BATTLE-05 (카테고리별 승률)도 관련.
- `.planning/ROADMAP.md` §Phase 3 — 성공 기준 3개

### Prior Phase Context
- `.planning/phases/01-foundation-ai-integration/01-CONTEXT.md` — Phase 1 결정사항 (D-06: 전문 저장, 카테고리 포함)
- `.planning/phases/02-core-battle-loop/02-CONTEXT.md` — Phase 2 결정사항 (D-07: 투표 시점 DB 저장, D-08: HMAC 토큰 블라인드)

### UI Design Contract
- `.planning/phases/03-category-system/03-UI-SPEC.md` — 전체 시각/인터랙션 계약. CategorySelector, SystemPromptEditor 컴포넌트 설계, 상태 머신, Zustand 스토어 확장, API 계약 변경, 반응형 레이아웃, 접근성. **주의: 코딩(💻) 카테고리는 D-01에 의해 삭제됨 — UI-SPEC의 6개 카테고리 목록에서 코딩을 제외하고 5개로 구현할 것.**

### Technology Stack & Existing Code
- `CLAUDE.md` §Technology Stack — Vercel AI SDK 6.x, Zustand 5.x, shadcn/ui, Tailwind 4 스택 결정
- `src/lib/ai/config.ts` — BATTLE_CONFIG (systemPrompt 하드코딩 → 카테고리별 프롬프트로 교체 필요)
- `src/lib/types.ts` — BattleSession 타입 (cat, sp 필드 추가 필요)
- `src/lib/battle/session.ts` — HMAC 토큰 생성/검증 (카테고리+프롬프트 포함 필요)
- `src/app/api/battle/vote/route.ts` — `category = "general"` 하드코딩 → 토큰에서 읽도록 변경
- `src/app/api/battle/stream/route.ts` — `BATTLE_CONFIG.systemPrompt` → 토큰에서 읽도록 변경
- `src/lib/store/battle-store.ts` — Zustand 스토어 (카테고리 상태 확장 필요, UI-SPEC §Zustand Store Additions 참조)
- `src/components/battle/battle-arena.tsx` — 배틀 오케스트레이터 (CategorySelector, SystemPromptEditor 삽입 지점)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `battle-store.ts`: Zustand 스토어 — UI-SPEC에 정의된 카테고리 상태 필드(category, systemPrompt, isPromptModified, pendingCategory) 추가 필요
- `battle-arena.tsx`: 배틀 오케스트레이터 — CategorySelector + SystemPromptEditor를 header와 BattleInput 사이에 삽입
- `session.ts`: HMAC 토큰 — BattleSession에 `cat`, `sp` 필드 추가하여 카테고리+프롬프트 전달
- `queries.ts`: DB 쿼리 — `insertBattleWithVote`에 이미 category 파라미터 존재, `getModelWinRates(category)`로 카테고리별 승률 지원
- shadcn/ui 기존 컴포넌트: button, card, textarea, badge — Phase 3에서 재사용

### Established Patterns
- Zod 스키마 검증: Route Handler에서 요청 검증 패턴 확립
- AI SDK `streamText()` + `toTextStreamResponse()` 패턴 확립
- Zustand `create<State>((set, get) => ...)` 패턴 확립
- HMAC 토큰 생성/검증 패턴 (`createBattleToken`/`verifyBattleToken`)

### Integration Points
- `src/app/page.tsx`: URL searchParams에서 카테고리 읽어 Zustand 스토어 초기화
- `src/app/api/battle/start/route.ts`: 요청에서 category, systemPrompt 받아 HMAC 토큰에 포함
- `src/app/api/battle/stream/route.ts`: 토큰에서 systemPrompt 읽어 AI 호출
- `src/app/api/battle/vote/route.ts`: 토큰에서 category 읽어 DB 저장 + 승률 조회
- `src/components/battle/reveal-panel.tsx`: 카테고리명을 승률 섹션 헤더에 표시

</code_context>

<specifics>
## Specific Ideas

- 코딩 카테고리 삭제: 사용자 결정으로 UI-SPEC의 6개에서 5개로 축소. 모바일 레이아웃이 2x3 그리드에서 조정 필요할 수 있음 (5개는 2x2 + 1 또는 다른 배치).
- URL 카테고리 유지: `?cat=homework` 형식으로 카테고리 공유 가능. Next.js 16 App Router의 searchParams 활용.
- 커스텀 프롬프트는 URL에 포함하지 않음: 보안 및 URL 길이 문제. 프롬프트는 항상 기본값에서 시작.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-category-system*
*Context gathered: 2026-04-09*
