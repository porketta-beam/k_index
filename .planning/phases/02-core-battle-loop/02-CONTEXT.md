# Phase 2: Core Battle Loop - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 한국어 질문을 입력하면 2개의 익명 AI 모델이 실시간 스트리밍으로 응답하고, 사용자가 더 나은 응답을 투표하면 모델 정체와 승률이 공개되는 완전한 블라인드 배틀 플로우 구현.

**Phase 1에서 가져오는 것:**
- AI provider registry (`src/lib/ai/registry.ts`) — 3개 모델 통합 인터페이스
- 단일 모델 스트리밍 Route Handler (`src/app/api/battle/stream/route.ts`)
- DB 쿼리 함수 (`src/lib/db/queries.ts`) — insertBattle, insertVote, updateBattleResponse, updateBattleStatus
- 타입 정의 (`src/lib/types.ts`) — Battle, Vote, BattleStatus, BudgetModelId
- 배틀 설정 (`src/lib/ai/config.ts`) — maxOutputTokens: 2048, temperature: 0.7, Korean system prompt

</domain>

<decisions>
## Implementation Decisions

### 모델 페어링 & 공정성
- **D-01:** 3개 모델(GPT-4o-mini, Claude Haiku 4.5, Gemini 2.5 Flash) 중 2개를 완전 랜덤으로 선택한다.
- **D-02:** 같은 모델끼리 대결은 불가 — 항상 다른 모델 2개가 매칭된다.
- **D-03:** A/B 위치 배치는 매번 랜덤으로 결정한다 (BATTLE-06 충족).

### 배틀 API 오케스트레이션
- **D-04:** 각 모델의 스트림을 독립적으로 가져와서 체감 속도 차이를 느낄 수 있도록 설계한다. 클라이언트가 2개의 독립 스트림을 병렬로 소비한다.
- **D-05:** 각 모델의 응답 완료까지 걸린 시간을 초 단위(소수점 1자리, 예: "3.2초")로 표시한다. 이는 UI-SPEC에 추가되는 새로운 요소.
- **D-06:** 한 모델이 스트리밍 중 에러가 발생하면 즉시 전체 배틀을 에러 상태로 전환한다. 나머지 스트림도 즉시 중단한다.
- **D-07:** DB 저장은 투표 시점에 일괄적으로 수행한다. 서버에서 배틀 세션(질문, 모델 정보, 응답 텍스트)을 임시 보관하고, 투표 API 호출 시 모든 데이터를 DB에 한 번에 기록한다. 불완전한 데이터가 DB에 들어가지 않음.
- **D-08:** 모델 정보(model ID)는 투표 전까지 클라이언트에 노출하지 않는다. 서버에서 모델 선택과 세션 관리를 담당하여 블라인드 테스트 무결성을 보장한다.

### 승률 계산
- **D-09:** 승률 계산 방식은 Claude 재량 — v1 규모에 맞는 최적의 방식을 선택한다 (실시간 쿼리 또는 캐시 등).
- **D-10:** 배틀 수에 관계없이 항상 승률을 표시한다. UI-SPEC의 형식: "{모델명} 승률: {N}% ({W}승 / {T}전)".

### 투표 & 공개 플로우
- **D-11:** 투표 후 결과 화면에서 두 응답 텍스트가 그대로 유지된다. 사용자가 모델 정체를 알고 나서 다시 비교할 수 있음.
- **D-12:** '새 배틀 시작' 버튼 클릭 시 페이지 상태를 즉시 idle로 초기화한다. 이전 배틀 결과는 사라짐.

### Claude's Discretion
- 서버 세션 저장 메커니즘: 메모리, 짧은 TTL 캐시, 또는 다른 적절한 방식을 Claude가 결정
- 승률 계산 구현 방식 (실시간 DB 쿼리 vs 캐시)
- 클라이언트-서버 간 배틀 시작/스트리밍/투표 API 설계 상세
- Zustand 스토어 구조 및 상태 관리 패턴 (UI-SPEC의 가이드를 참고)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — BATTLE-01~BATTLE-06 requirements (이 phase의 핵심)
- `.planning/ROADMAP.md` §Phase 2 — 성공 기준 5개

### Phase 1 Context
- `.planning/phases/01-foundation-ai-integration/01-CONTEXT.md` — Phase 1 결정사항 (D-01~D-07). 특히 D-01~D-04 (rate limiting/fingerprinting 제외), D-06 (전문 저장)

### Technology Stack & Existing Code
- `CLAUDE.md` §Technology Stack — Vercel AI SDK 6.x, Zustand 5.x, shadcn/ui, Tailwind 4 스택 결정
- `src/lib/ai/registry.ts` — AI provider registry (3개 모델 등록됨)
- `src/lib/ai/config.ts` — BATTLE_CONFIG (maxOutputTokens, temperature, systemPrompt)
- `src/lib/types.ts` — Battle, Vote, BattleStatus, BudgetModelId 타입
- `src/lib/db/queries.ts` — insertBattle, insertVote, updateBattleResponse, updateBattleStatus
- `src/app/api/battle/stream/route.ts` — 단일 모델 스트리밍 Route Handler (Phase 2에서 확장 필요)

### UI Design Contract
- `.planning/phases/02-core-battle-loop/02-UI-SPEC.md` — 전체 시각/인터랙션 계약. 상태 머신, 컴포넌트 목록, 색상, 타이포그래피, 애니메이션, 카피라이팅, 접근성. 반드시 읽고 따를 것.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `registry.ts`: AI provider registry — 3개 모델이 이미 등록되어 있어 `registry.languageModel(modelId)` 패턴 재사용
- `config.ts`: BATTLE_CONFIG — maxOutputTokens, temperature, systemPrompt 이미 정의됨
- `queries.ts`: insertBattle, insertVote, updateBattleResponse — DB CRUD 함수 사용 가능
- `types.ts`: Battle, Vote, BattleStatus 타입 — 확장하여 사용

### Established Patterns
- Zod 스키마 검증: `stream/route.ts`에서 requestSchema 패턴 확립
- AI SDK `streamText()` + `toUIMessageStreamResponse()` 패턴 확립
- Supabase 쿼리 패턴: `.from().insert().select().single()` 패턴 확립

### Integration Points
- `src/app/page.tsx`: 현재 placeholder — 배틀 페이지로 교체 필요
- `src/app/api/battle/stream/route.ts`: 단일 모델용 — Phase 2에서 배틀 오케스트레이션 API로 확장
- `src/app/globals.css`: Tailwind 4 설정 — shadcn/ui 초기화 후 커스텀 CSS 변수 추가 필요
- `src/app/layout.tsx`: Geist 폰트 로드 — Pretendard 폰트 추가 필요 (UI-SPEC)

</code_context>

<specifics>
## Specific Ideas

- 응답 완료 시간 표시 (초 단위, 소수점 1자리): UI-SPEC에 없는 새로운 요소. 각 ResponseCard에 "완료" 라벨 옆에 "3.2초" 형식으로 표시.
- 한 모델 실패 시 즉시 전체 에러 전환: 다른 모델이 스트리밍 중이더라도 확인 즉시 중단. UI-SPEC 에러 상태로 전환.
- 블라인드 무결성: 모델 ID를 투표 전까지 클라이언트에 절대 노출하지 않음. 서버 세션에서만 관리.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-core-battle-loop*
*Context gathered: 2026-04-09*
