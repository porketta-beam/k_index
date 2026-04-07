# Requirements: K-Index

**Defined:** 2026-04-08
**Core Value:** 한국어로 질문했을 때 어떤 AI가 더 자연스럽고 유용한 답변을 하는지, 공정한 블라인드 비교를 통해 알 수 있어야 한다.

## v1 Requirements

### Battle Core

- [ ] **BATTLE-01**: 사용자가 질문을 입력하면 두 개의 익명 AI 모델이 응답을 생성한다
- [ ] **BATTLE-02**: AI 응답은 실시간 스트리밍으로 표시된다 (속도 비교 가능하도록 동시 표시 아님)
- [ ] **BATTLE-03**: 사용자가 A승/B승 중 하나를 선택하여 투표할 수 있다
- [ ] **BATTLE-04**: 투표 후 각 응답의 AI 모델 이름이 공개된다
- [ ] **BATTLE-05**: 모델 공개 시 해당 카테고리의 모델별 승률이 함께 표시된다
- [ ] **BATTLE-06**: 서버 사이드에서 모델을 랜덤 선택하고, 응답 위치(A/B)도 랜덤 배치한다

### Category System

- [ ] **CAT-01**: 프리셋 카테고리를 선택할 수 있다 (과제, 자기소개서, 고민상담 등)
- [ ] **CAT-02**: 각 카테고리에 기본 시스템 프롬프트가 제공된다
- [ ] **CAT-03**: 사용자가 기본 시스템 프롬프트를 수정할 수 있다

### Season System

- [ ] **SEASON-01**: 서버 전체 요청 수를 추적하는 글로벌 카운터가 존재한다
- [ ] **SEASON-02**: 글로벌 요청이 임계치에 도달하면 시즌이 자동 종료된다
- [ ] **SEASON-03**: 시즌 종료 시 "시즌 N 배틀이 끝났습니다" 메시지가 표시된다
- [ ] **SEASON-04**: 관리자가 시즌 시작/종료를 수동으로 제어할 수 있다

### AI Integration

- [ ] **AI-01**: GPT (OpenAI API)를 통한 응답 생성을 지원한다
- [ ] **AI-02**: Claude (Anthropic API)를 통한 응답 생성을 지원한다
- [ ] **AI-03**: Gemini (Google API)를 통한 응답 생성을 지원한다
- [ ] **AI-04**: 버짓 모델을 사용하고 max_tokens 제한을 적용한다 (비용 제어)

### Security

- [ ] **SEC-01**: 브라우저 핑거프린팅으로 사용자를 식별한다 (인증 없이)
- [ ] **SEC-02**: 핑거프린트 기반으로 비정상 사용 패턴을 감지한다

### UI/UX

- [ ] **UI-01**: 인터페이스는 한국어 중심이되, 자연스러운 흐름이라면 영어 혼용 가능하다
- [ ] **UI-02**: 반응형 디자인으로 모바일/태블릿/데스크톱을 지원한다
- [ ] **UI-03**: 배틀 페이지에서 질문 입력 → 응답 스트리밍 → 투표 → 결과 확인의 흐름이 자연스럽다

### Data

- [ ] **DATA-01**: 모든 배틀 결과(질문, 응답, 투표, 모델, 카테고리)가 데이터베이스에 저장된다
- [ ] **DATA-02**: 글로벌 요청 카운터가 실시간으로 업데이트되고 조회 가능하다

## v2 Requirements

### Authentication

- **AUTH-01**: 사용자가 회원가입/로그인할 수 있다
- **AUTH-02**: 로그인 시 배틀 이력이 저장된다

### Ranking

- **RANK-01**: ELO 기반 모델 랭킹 리더보드
- **RANK-02**: 카테고리별 세분화 랭킹

### Statistics

- **STAT-01**: 상세 투표 결과 통계 페이지
- **STAT-02**: 모델별/카테고리별 상세 분석 대시보드

### Korean Models

- **KMODEL-01**: HyperCLOVA X 지원
- **KMODEL-02**: EXAONE 지원

### Advanced Features

- **ADV-01**: 다크 모드
- **ADV-02**: 배틀 결과 공유 카드
- **ADV-03**: 한국어 평가 가이드 (존댓말/자연스러움 기준 안내)
- **ADV-04**: 멀티턴 대화 배틀

## Out of Scope

| Feature | Reason |
|---------|--------|
| 모바일 앱 | 웹 우선, 반응형으로 충분 |
| OAuth/소셜 로그인 | v1에서 인증 자체가 제외 |
| 자체 호스팅 모델 | API 전용, 인프라 복잡도 최소화 |
| 실시간 채팅 | 핵심 가치와 무관 |
| 영어 전용 UI | 한국어 중심 프로젝트, 단 자연스러운 영어 혼용은 허용 |
| 멀티턴 대화 | v1은 싱글턴 비교에 집중 |
| Per-IP rate limiting | 글로벌 요청 임계치 + 시즌 시스템으로 대체 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AI-01 | Phase 1 | Pending |
| AI-02 | Phase 1 | Pending |
| AI-03 | Phase 1 | Pending |
| AI-04 | Phase 1 | Pending |
| SEC-01 | Phase 1 | Pending |
| SEC-02 | Phase 1 | Pending |
| DATA-01 | Phase 1 | Pending |
| BATTLE-01 | Phase 2 | Pending |
| BATTLE-02 | Phase 2 | Pending |
| BATTLE-03 | Phase 2 | Pending |
| BATTLE-04 | Phase 2 | Pending |
| BATTLE-05 | Phase 2 | Pending |
| BATTLE-06 | Phase 2 | Pending |
| CAT-01 | Phase 3 | Pending |
| CAT-02 | Phase 3 | Pending |
| CAT-03 | Phase 3 | Pending |
| SEASON-01 | Phase 4 | Pending |
| SEASON-02 | Phase 4 | Pending |
| SEASON-03 | Phase 4 | Pending |
| SEASON-04 | Phase 4 | Pending |
| DATA-02 | Phase 4 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-02 | Phase 5 | Pending |
| UI-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 24
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after roadmap creation*
