# K-Index: 한국형 AI 배틀 아레나

## What This Is

한국 대학생을 타겟으로 한 AI 블라인드 배틀 사이트. 사용자가 질문을 입력하면 두 개의 익명 AI 모델(GPT-4o-mini, Claude Haiku 4.5, Gemini 2.0 Flash)이 응답하고, 사용자가 더 나은 응답을 선택하면 어떤 모델이었는지 공개된다. 한국어 응답 품질 평가에 특화되어 있으며, 5개 카테고리(일반, 과제, 자기소개서, 고민상담, 창작)별 시스템 프롬프트와 시즌 기반 운영을 지원한다.

## Core Value

한국어로 질문했을 때 어떤 AI가 더 자연스럽고 유용한 답변을 하는지, 공정한 블라인드 비교를 통해 알 수 있어야 한다.

## Current State

**v0.1 MVP 출시 (2026-04-10)**

3,620 LOC TypeScript/TSX/CSS. Next.js 16 + Vercel AI SDK 6 + Supabase + Upstash Redis.
5개 페이즈, 14개 플랜, 63개 테스트 통과. arena.ai 스타일 반응형 UI 완성.

## Requirements

### Validated

- ✓ GPT, Claude, Gemini 3개 모델 지원 — v0.1
- ✓ API 기반 AI 모델 호출 (버짓 모델 + max_tokens 제한) — v0.1
- ✓ 블라인드 배틀: 질문 입력 → 두 AI 익명 응답 → 투표 → 모델 공개 — v0.1
- ✓ 로그인 없이 바로 배틀 가능 — v0.1
- ✓ 카테고리별 평가 (5 프리셋 + 시스템 프롬프트 편집) — v0.1
- ✓ 시즌 시스템: 글로벌 카운터, 자동 셔다운, 관리자 제어 — v0.1
- ✓ 한국어 UI 전체 제공 (격식체) — v0.1
- ✓ 반응형 디자인: 모바일 스와이프, 데스크톱 50:50 그리드 — v0.1
- ✓ 배틀 데이터(질문, 응답, 투표, 모델, 카테고리) DB 저장 — v0.1

### Active

(다음 마일스톤에서 정의)

### Out of Scope

- 회원가입/로그인 — v1에서는 불필요, 추후 추가 예정
- ELO 리더보드/랭킹 — 데이터 축적 후 추가
- 투표 결과 통계 페이지 — v2에서 추가
- 한국산 AI 모델 (HyperCLOVA X, EXAONE 등) — 업체 협의 후 추가
- OAuth/소셜 로그인 — v2 로그인 기능 추가 시 검토
- 모바일 앱 — 웹 우선, 반응형으로 충분
- 브라우저 핑거프린팅 (SEC-01, SEC-02) — v0.1에서 시즌 시스템으로 대체, 필요 시 재검토

## Context

- **타겟 사용자**: 한국 대학생 (과제, 자기소개서, 고민상담 등 일상적 질문)
- **벤치마크**: arena.ai (LMSYS Chatbot Arena) — 블라인드 배틀 + ELO 랭킹
- **한국 특화 포인트**: 한국어 응답 품질(존댓말/반말, 자연스러움, 문법), 한국 문화 컨텍스트 이해도
- **남용 방지 전략**: 시즌제 셔다운으로 자연스럽게 서비스 중단 (핑거프린팅 보류)
- **팀 기술 역량**: Next.js, Python에 익숙. Vercel, Railway, AWS, Redis, Supabase 경험 있음
- **기술 스택**: Next.js 16, React 19.2, Vercel AI SDK 6, Supabase (PostgreSQL), Upstash Redis, Tailwind 4, shadcn/ui, Zustand 5

## Constraints

- **AI 모델**: GPT, Claude, Gemini API만 사용 — 비용 관리 필요
- **인증 없음**: 로그인 없으므로, 시즌 시스템으로 남용 방지
- **팀 스택**: Next.js 모놀리스 — Python 백엔드 불필요
- **비용**: AI API 호출 비용 고려 필요 (매 배틀마다 2개 모델 호출)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 블라인드 배틀 방식 채택 | arena.ai 검증된 모델, 공정한 비교 보장 | ✓ Good |
| v1 로그인 제외 | 진입 장벽 최소화, 빠른 체험 우선 | ✓ Good |
| 시즌제 셔다운 전략 | 남용 시 자연스러운 서비스 중단, 마케팅 효과 겸비 | ✓ Good |
| GPT/Claude/Gemini 3개 모델로 시작 | 주요 글로벌 모델 우선, 한국 모델은 협의 후 추가 | ✓ Good |
| 핑거프린팅/rate limiting 보류 (D-01~D-04) | 시즌 시스템이 충분한 남용 방지, 복잡도 감소 | ✓ Good |
| Next.js 모놀리스 (Python 백엔드 제외) | AI SDK가 모든 프로바이더 통합, 배포 단순화 | ✓ Good |
| 격식체 UI 카피 | 사용자 요청으로 친근체에서 변경 | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-10 after v0.1 milestone*
