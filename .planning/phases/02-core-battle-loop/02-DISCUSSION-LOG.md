# Phase 2: Core Battle Loop - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 02-core-battle-loop
**Areas discussed:** Model pairing & fairness, Battle API orchestration, Win rate calculation, Vote & reveal flow

---

## Model Pairing & Fairness

| Option | Description | Selected |
|--------|-------------|----------|
| 완전 랜덤 | 매 배틀마다 3개 중 2개를 무작위 선택. 같은 모델이 연속으로 나올 수 있음. | ✓ |
| 라운드 로빈 | 3가지 조합을 순서대로 돌림. 모든 모델이 균등하게 비교됨. | |
| Claude 결정 | Claude가 통계적으로 적절한 방식을 결정. | |

**User's choice:** 완전 랜덤
**Notes:** 구현이 가장 단순하고 자연스러움.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 항상 다른 모델 | 2개는 반드시 다른 모델이어야 함. | ✓ |
| 중복 허용 | 같은 모델끼리도 대결 가능. | |

**User's choice:** 항상 다른 모델
**Notes:** 비교의 의미가 더 명확함.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 매번 랜덤 | 매 배틀마다 어떤 모델이 A/B에 오는지 랜덤 배치. | ✓ |
| Claude 결정 | Claude가 공정성을 보장하는 방식으로 결정. | |

**User's choice:** 매번 랜덤
**Notes:** BATTLE-06 요구사항 충족.

---

## Battle API Orchestration

| Option | Description | Selected |
|--------|-------------|----------|
| 단일 엔드포인트 | 하나의 API가 서버에서 2개 모델을 동시 호출, 하나의 SSE로 병합 전송. | |
| 병렬 API 호출 | 클라이언트가 기존 stream route를 2번 병렬 호출. | |
| Claude 결정 | Claude가 기술적으로 최적의 방식을 결정. | |

**User's choice:** 독립 스트리밍 (custom response)
**Notes:** 각 모델의 스트림을 독립적으로 가져와서 체감 속도를 느낄 수 있도록 설계. 마지막에 최종 응답까지 걸린 시간도 표시.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 배틀 전체 실패 | 한 모델이라도 실패하면 전체 배틀을 에러 상태로 전환. | ✓ |
| 부분 성공 허용 | 성공한 모델의 응답은 보여주고, 실패한 쪽만 에러 표시. | |
| Claude 결정 | Claude가 적절한 에러 처리 전략을 결정. | |

**User's choice:** 즉시 전체 배틀 에러 전환
**Notes:** 한쪽이 중간에 호출 실패했다는 것을 확인하는 즉시 다른 한 쪽이 스트리밍 중이더라도 에러 상태로 전환.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 배틀 시작 시 생성 | 사용자가 질문을 제출하면 즉시 battle 레코드를 생성하고, 스트리밍 완료 후 응답을 업데이트. | |
| 투표 시 일괄 저장 | 투표 시점에 질문, 응답, 모델, 투표 결과를 한 번에 저장. | ✓ |
| Claude 결정 | Claude가 기술적으로 최적의 타이밍을 결정. | |

**User's choice:** 투표 시 일괄 저장
**Notes:** DB에 불완전한 데이터를 넣지 않기 위함. 서버에서 배틀 세션을 임시 보관하고 투표 시 일괄 기록.

---

## Win Rate Calculation

| Option | Description | Selected |
|--------|-------------|----------|
| 실시간 쿼리 | 투표 후 DB에서 해당 모델의 승/총 배틀 수를 바로 조회해서 계산. | |
| 캐시 기반 | Upstash Redis에 모델별 승률을 캐시. 투표마다 카운터 업데이트. | |
| Claude 결정 | Claude가 v1 규모에 맞는 최적의 방식을 결정. | ✓ |

**User's choice:** Claude 결정
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| 항상 표시 | 배틀 수에 관계없이 항상 승률을 표시. '1승 / 1전' 형식으로 맥락 제공. | ✓ |
| 최소 배틀 수 제한 | 예: 최소 5배틀 이상이어야 승률 표시. 그 전에는 '데이터 부족' 등의 메시지. | |
| Claude 결정 | Claude가 적절한 임계값을 결정. | |

**User's choice:** 항상 표시
**Notes:** None

---

## Vote & Reveal Flow

| Option | Description | Selected |
|--------|-------------|----------|
| 응답 유지 | 투표 + 모델 공개 후에도 두 응답 텍스트가 그대로 보임. | ✓ |
| 응답 접기 | 결과 화면은 모델명과 승률만 표시. 응답은 클릭하면 펼쳐지는 아코디언. | |

**User's choice:** 응답 유지
**Notes:** 사용자가 모델 정체를 알고 나서 다시 비교할 수 있음.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 즉시 초기화 | 페이지 상태가 즉시 idle로 돌아가고 입력창이 포커스됨. 이전 배틀 결과는 사라짐. | ✓ |
| 페이드 전환 | 이전 결과가 페이드 아웃되면서 새 입력창이 페이드 인됨. | |
| Claude 결정 | Claude가 UX적으로 최적의 전환 방식을 결정. | |

**User's choice:** 즉시 초기화
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| 초 단위 | 예: '3.2초' — 스트리밍 시작부터 완료까지 걸린 시간을 소수점 1자리까지 표시. | ✓ |
| 상대적 표현 | 예: '빠름' / '보통' / '느림' — 구체적 수치 대신 직관적인 표현. | |
| Claude 결정 | Claude가 적절한 표시 형식을 결정. | |

**User's choice:** 초 단위
**Notes:** 체감 속도 비교를 위한 새로운 UI 요소.

---

## Claude's Discretion

- 서버 세션 저장 메커니즘 (메모리, TTL 캐시 등)
- 승률 계산 구현 방식 (실시간 DB 쿼리 vs 캐시)
- 클라이언트-서버 간 API 설계 상세
- Zustand 스토어 구조 및 상태 관리 패턴

## Deferred Ideas

None — discussion stayed within phase scope
