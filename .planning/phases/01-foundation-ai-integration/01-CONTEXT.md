# Phase 1: Foundation & AI Integration - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

3개 AI 모델(GPT-4o-mini, Claude Haiku 4.5, Gemini 2.0 Flash)이 프롬프트를 받아 스트리밍 응답을 반환하는 백엔드 인프라 구축. Supabase에 배틀 데이터를 저장하는 DB 스키마 포함.

**원래 Phase 1 범위에서 제외된 항목:**
- 브라우저 핑거프린팅 (SEC-01, SEC-02) → v2로 이동
- 개별 사용자 요율 제한 → 제외 (글로벌 시즌 종료만, Phase 4에서 구현)
- Upstash Redis → Phase 1에서 불필요 (Phase 4에서 글로벌 카운터용으로 도입)

</domain>

<decisions>
## Implementation Decisions

### 요율 제한 정책
- **D-01:** v1에서 개별 사용자 요율 제한을 구현하지 않는다. 핑거프린트 기반 배틀 횟수 제한 없음.
- **D-02:** 비용 제어는 전적으로 Phase 4의 시즌 시스템(글로벌 요청 카운터 임계치)에서 담당한다.
- **D-03:** Upstash Redis는 Phase 1에서 도입하지 않는다. Phase 4에서 글로벌 카운터용으로 도입.

### 핑거프린팅 전략
- **D-04:** v1에서 브라우저 핑거프린팅을 완전히 제외한다. SEC-01(사용자 식별), SEC-02(비정상 패턴 감지)는 v2로 이동.
- **D-05:** 배틀 데이터는 익명으로 저장한다 (사용자 식별 없이).

### 데이터 저장 범위
- **D-06:** 배틀 전문 저장: 질문 텍스트 + AI 응답 전문 + 투표 결과 + 모델명 + 카테고리 + 타임스탬프를 모두 저장한다.
- **D-07:** Supabase Free Tier (500MB)로 충분. 시즌제로 자연스럽게 용량이 제어되므로 별도 용량 전략 불필요.

### Claude's Discretion
- AI 응답 설정: max_tokens 값, 한국어 기본 시스템 프롬프트, 모델 장애 시 폴백 전략은 Claude가 최적의 방식으로 결정
- DB 스키마 설계: 테이블 구조, 인덱스, 관계 설정은 Claude가 결정 (전문 저장 결정 기준 내에서)
- Vercel AI SDK 활용 패턴: Provider registry 구성, 스트리밍 구현 방식은 Claude가 결정

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — AI-01~AI-04 (AI 통합), DATA-01 (데이터 저장) requirements. SEC-01, SEC-02는 v2로 이동됨에 주의.
- `.planning/ROADMAP.md` §Phase 1 — 성공 기준 (단, 성공 기준 #5 "rate-limited"는 D-01~D-03에 의해 제외됨)

### Technology Stack
- `CLAUDE.md` §Technology Stack — Vercel AI SDK 6.x, Supabase, Next.js 16 스택 결정 및 설치 가이드

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 없음 (그린필드 프로젝트 — 코드베이스가 비어있음)

### Established Patterns
- 없음 (첫 번째 Phase — 모든 패턴을 이 Phase에서 수립)

### Integration Points
- Next.js 16 App Router: Route Handlers에서 AI SDK 스트리밍 구현
- Supabase Client: Server-side에서 supabase-js로 배틀 데이터 CRUD
- Vercel AI SDK: `streamText()` 통합 인터페이스로 3개 AI 프로바이더 호출

</code_context>

<specifics>
## Specific Ideas

- 시즌제가 핵심 비용 제어 메커니즘 — Phase 1은 AI 호출과 데이터 저장에만 집중하고, 비용 제어는 Phase 4로 완전 분리
- 핑거프린팅 없이 익명 데이터만 저장하므로, PIPA(개인정보보호법) 컴플라이언스 이슈가 Phase 1에서 제거됨

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-ai-integration*
*Context gathered: 2026-04-08*
