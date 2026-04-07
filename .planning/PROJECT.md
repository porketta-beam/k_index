# K-Index: 한국형 AI 배틀 아레나

## What This Is

한국 대학생을 타겟으로 한 AI 블라인드 배틀 사이트. 사용자가 질문을 입력하면 두 개의 익명 AI 모델이 응답하고, 사용자가 더 나은 응답을 선택하면 어떤 모델이었는지 공개된다. 한국어 응답 품질 평가에 특화되어 있으며, 한국 문화/사회적 맥락에서의 AI 능력을 평가한다.

## Core Value

한국어로 질문했을 때 어떤 AI가 더 자연스럽고 유용한 답변을 하는지, 공정한 블라인드 비교를 통해 알 수 있어야 한다.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 블라인드 배틀: 질문 입력 → 두 AI 익명 응답 → 투표 → 모델 공개
- [ ] 시즌 시스템: 시즌 종료/셔다운 기능 (남용 시 "시즌1 배틀이 끝났습니다" 메시지)
- [ ] GPT, Claude, Gemini 3개 모델 지원
- [ ] 로그인 없이 바로 배틀 가능
- [ ] 한국어 UI 전체 제공
- [ ] API 기반 AI 모델 호출

### Out of Scope

- 회원가입/로그인 — v1에서는 불필요, 추후 추가 예정
- ELO 리더보드/랭킹 — v1은 비교 기능에 집중, 데이터 축적 후 추가
- 카테고리별 평가 (과제/자소서/고민상담) — v2에서 카테고리 분리 예정
- 투표 결과 통계 페이지 — v2에서 추가
- 한국산 AI 모델 (HyperCLOVA X, EXAONE 등) — 업체 협의 후 추가
- OAuth/소셜 로그인 — v2 로그인 기능 추가 시 검토
- 모바일 앱 — 웹 우선

## Context

- **타겟 사용자**: 한국 대학생 (과제, 자기소개서, 고민상담 등 일상적 질문)
- **벤치마크**: arena.ai (LMSYS Chatbot Arena) — 블라인드 배틀 + ELO 랭킹
- **한국 특화 포인트**: 한국어 응답 품질(존댓말/반말, 자연스러움, 문법), 한국 문화 컨텍스트 이해도
- **남용 방지 전략**: API 요율 제한 + 시즌제 셔다운으로 자연스럽게 서비스 중단 가능
- **팀 기술 역량**: Next.js, Python에 익숙. Vercel, Railway, AWS, Redis, Supabase 경험 있음

## Constraints

- **AI 모델**: v1에서는 GPT, Claude, Gemini API만 사용 — 비용 관리 필요
- **인증 없음**: v1에서 로그인 없으므로, API 남용 방지 메커니즘 필수
- **팀 스택**: Next.js + Python 중심 — 팀의 기존 역량 활용
- **비용**: AI API 호출 비용 고려 필요 (매 배틀마다 2개 모델 호출)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 블라인드 배틀 방식 채택 | arena.ai 검증된 모델, 공정한 비교 보장 | — Pending |
| v1 로그인 제외 | 진입 장벽 최소화, 빠른 체험 우선 | — Pending |
| 시즌제 셔다운 전략 | 남용 시 자연스러운 서비스 중단, 마케팅 효과 겸비 | — Pending |
| GPT/Claude/Gemini 3개 모델로 시작 | 주요 글로벌 모델 우선, 한국 모델은 협의 후 추가 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-07 after initialization*
