# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v0.1 — MVP

**Shipped:** 2026-04-10
**Phases:** 5 | **Plans:** 14 | **Tasks:** 29

### What Was Built
- 3개 AI 모델(GPT-4o-mini, Claude Haiku 4.5, Gemini Flash) 블라인드 배틀 시스템
- 실시간 스트리밍 응답 + 투표 + 모델 공개 전체 플로우
- 5개 한국어 카테고리 (과제, 자소서, 고민상담, 창작, 일반) + 시스템 프롬프트 편집
- 시즌 시스템: 글로벌 카운터, 자동 셔다운, 관리자 API
- arena.ai 스타일 반응형 UI: 모바일 스와이프, 데스크톱 그리드, 격식체 한국어

### What Worked
- Vercel AI SDK 6의 통합 인터페이스로 3개 프로바이더를 단일 streamText()로 처리
- 파이즈별 점진적 구축 (Foundation → Battle → Category → Season → UI Polish)
- shadcn/ui 복사-붙여넣기 모델로 한국어 커스터마이징 자유도 확보
- HMAC 토큰 기반 세션 관리로 인증 없이 배틀 무결성 보장

### What Was Inefficient
- REQUIREMENTS.md 추적 테이블이 실행 중 업데이트되지 않아 마일스톤 완료 시 전부 "Pending"
- 핑거프린팅(SEC-01, SEC-02)을 Phase 1에 매핑했으나 결국 보류 — 초기 요구사항 분류에서 걸러졌어야 함

### Patterns Established
- Sticky header/footer 레이아웃: `sticky top-0 z-10 bg-background/95 backdrop-blur-sm`
- 반응형 카드: `SwipeContainer` (md:hidden) + `hidden md:grid md:grid-cols-2`
- 내부 스크롤: `overflow-y-auto max-h-[50vh] md:max-h-[60vh]`
- Zustand 단일 스토어로 배틀 상태 + UI 상태 통합 관리
- HMAC 토큰으로 클라이언트-서버 세션 검증 (인증 없는 환경)

### Key Lessons
1. UI 카피 톤은 초기에 사용자와 확정해야 함 — Phase 5에서 친근체→격식체 변경으로 재작업 발생
2. 시즌 시스템이 핑거프린팅보다 효과적인 남용 방지 — 복잡한 보안 메커니즘보다 운영적 접근이 MVP에 적합

### Cost Observations
- 인프라: $0/월 (Vercel Free + Supabase Free + Upstash Free)
- AI 비용: 배틀당 ~$0.001~0.006 (버짓 모델 사용)
- 총 코드: 3,620 LOC (TypeScript/TSX/CSS)
- 개발 기간: 3일 (2026-04-08 ~ 2026-04-10)

## Cross-Milestone Trends

| Metric | v0.1 |
|--------|------|
| Phases | 5 |
| Plans | 14 |
| Tasks | 29 |
| LOC | 3,620 |
| Duration | 3 days |
| Tests | 63 |
