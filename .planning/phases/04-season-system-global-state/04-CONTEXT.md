# Phase 4: Season System & Global State - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

글로벌 요청 카운터로 모든 배틀을 추적하고, 임계치 도달 시 자동 종료되며, 관리자가 시즌 라이프사이클을 수동 제어할 수 있는 시즌 시스템 구현. Upstash Redis를 글로벌 카운터 저장소로 도입. 시즌 메타데이터는 Supabase에 저장.

**Phase 1~3에서 가져오는 것:**
- AI provider registry + 배틀 스트리밍 + 투표/공개 플로우 (Phase 1~2)
- HMAC 토큰 기반 세션 관리 (`src/lib/battle/session.ts`)
- Supabase DB 쿼리 (`src/lib/db/queries.ts`) — insertBattleWithVote, getModelWinRates
- 카테고리 시스템 (`src/lib/categories.ts`) — 5개 프리셋 카테고리
- Zustand 배틀 스토어 (`src/lib/store/battle-store.ts`)
- 배틀 API 라우트: start, stream, vote

</domain>

<decisions>
## Implementation Decisions

### Admin 접근 방식
- **D-01:** Secret API key 방식으로 관리자 인증. 환경변수 `ADMIN_API_KEY`로 설정하고, 관리 API 호출 시 `Authorization: Bearer` 헤더로 인증.
- **D-02:** 관리자는 시즌 시작/종료만 가능. POST `/api/admin/season/start`, POST `/api/admin/season/end`.
- **D-03:** 시즌 배틀 임계치는 환경변수 `SEASON_BATTLE_THRESHOLD`로 설정. 변경 시 재배포 필요.

### 카운터 표시 & 실시간성
- **D-04:** 글로벌 배틀 카운터는 UI에 표시하지 않는다. 서버 내부에서만 추적하여 자동 종료 판정용으로 사용.
- **D-05:** 시즌 종료 감지는 배틀 시작 요청(`/api/battle/start`) 시 서버가 거부 응답을 반환하는 방식. 별도 polling/SSE/Realtime 불필요.

### 시즌 종료 사용자 경험
- **D-06:** 시즌 종료 시 간결한 종료 메시지 표시: "시즌 N 배틀이 끝났습니다!" + "다음 시즌을 기다려주세요". 배틀 UI를 완전히 대체.
- **D-07:** 시즌 종료 시점에 이미 스트리밍 중인 배틀은 투표/공개까지 완료 허용. 새 배틀 시작만 차단.

### 시즌 데이터 경계
- **D-08:** battles 테이블에 `season_id` 컬럼을 추가하여 시즌 태그 부여. 시즌별 데이터 분리.
- **D-09:** 시즌이 바뀌면 모델별 승률을 리셋. `getModelWinRates` 쿼리에 season_id 필터 추가하여 현재 시즌 승률만 표시.

### Claude's Discretion
- Upstash Redis 글로벌 카운터 구현 방식: atomic increment, TTL, 캐싱 전략
- seasons 테이블 스키마 설계 (id, number, status, threshold, created_at 등)
- 시즌 상태 체크 로직의 성능 최적화 (매 배틀 시작마다 체크)
- 시즌 종료 화면 상세 디자인 (Phase 5 UI Polish에서 다듬을 수 있음)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — SEASON-01~SEASON-04 (시즌 시스템), DATA-02 (글로벌 카운터) requirements
- `.planning/ROADMAP.md` §Phase 4 — 성공 기준 4개

### Prior Phase Context
- `.planning/phases/01-foundation-ai-integration/01-CONTEXT.md` — D-02 (비용 제어는 Phase 4 시즌 시스템에서 담당), D-03 (Upstash Redis Phase 4에서 도입)
- `.planning/phases/02-core-battle-loop/02-CONTEXT.md` — D-07 (투표 시점 DB 저장), D-08 (HMAC 토큰 블라인드), D-09 (승률 계산)
- `.planning/phases/03-category-system/03-CONTEXT.md` — D-03 (카테고리 static array), D-06 (URL 쿼리 파라미터 카테고리 유지)

### Technology Stack & Existing Code
- `CLAUDE.md` §Technology Stack — Upstash Redis, @upstash/ratelimit 스택 결정 및 설치 가이드
- `src/lib/db/queries.ts` — insertBattleWithVote (season_id 추가 필요), getModelWinRates (season_id 필터 추가 필요)
- `src/lib/types.ts` — Battle 타입 (season_id 필드 추가 필요)
- `src/lib/env.ts` — 환경변수 검증 (ADMIN_API_KEY, SEASON_BATTLE_THRESHOLD, Upstash Redis 변수 추가 필요)
- `src/app/api/battle/start/route.ts` — 시즌 상태 체크 게이트 추가 필요
- `src/lib/store/battle-store.ts` — 시즌 종료 상태 처리 추가 필요
- `src/components/battle/battle-arena.tsx` — 시즌 종료 화면 조건부 렌더링 추가 필요

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `queries.ts`: insertBattleWithVote — season_id 파라미터 추가로 확장
- `queries.ts`: getModelWinRates — season_id 필터 추가로 시즌별 승률 지원
- `types.ts`: Battle 인터페이스 — season_id 필드 추가
- `env.ts`: Zod 환경변수 검증 — ADMIN_API_KEY, SEASON_BATTLE_THRESHOLD, Upstash 변수 추가
- `battle-store.ts`: Zustand 스토어 — 시즌 종료 상태 추가

### Established Patterns
- Zod 스키마 검증: Route Handler에서 요청 검증 패턴 확립
- HMAC 토큰 생성/검증 패턴 (`createBattleToken`/`verifyBattleToken`)
- Supabase `.from().insert().select().single()` 쿼리 패턴
- Zustand `create<State>((set, get) => ...)` 상태 관리 패턴
- 환경변수 lazy validation 패턴 (`env.ts`)

### Integration Points
- `src/app/api/battle/start/route.ts`: 시즌 상태 체크 → 종료 시 거부 응답 반환
- `src/components/battle/battle-arena.tsx`: 시즌 종료 화면 조건부 렌더링
- `src/app/api/admin/`: 새 admin API 라우트 디렉토리
- `supabase/migrations/`: seasons 테이블 + battles.season_id 컬럼 마이그레이션

</code_context>

<specifics>
## Specific Ideas

- 카운터 비표시: 사용자에게 남은 배틀 수를 노출하지 않음. 시즌이 갑자기 끝나는 느낌을 의도적으로 유지.
- 배틀 시작 시점 게이트: `/api/battle/start`에서만 시즌 체크. 이미 토큰을 받은 배틀은 스트리밍/투표/공개까지 정상 진행.
- 승률 시즌별 리셋: getModelWinRates RPC에 season_id 파라미터 추가. 새 시즌 시작 시 자동으로 0%부터 시작.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-season-system-global-state*
*Context gathered: 2026-04-09*
