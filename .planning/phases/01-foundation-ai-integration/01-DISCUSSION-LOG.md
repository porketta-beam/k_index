# Phase 1: Foundation & AI Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-08
**Phase:** 01-foundation-ai-integration
**Areas discussed:** 요율 제한 정책, 핑거프린팅 전략, 데이터 저장 범위

---

## 요율 제한 정책

| Option | Description | Selected |
|--------|-------------|----------|
| 시간당 5회 | 대학생 일반 사용 패턴에 충분. API 비용 절감과 남용 방지 균형. | |
| 일당 30회 | 시간당 제한 없이 하루 총량만 제한. 단기간 대량 사용 가능. | |
| 시간+일 복합 제한 | 시간당 5회 AND 일당 20회. 더 엄격하지만 비용 예측 정확. | |
| 느슨하게 (일당 50회+) | 초기 MVP에서 사용성 우선. 비용 리스크 있음. | |

**User's choice:** 초기 버전에서는 핑거프린트로 배틀횟수제한하지 않음. 개별 유저의 요율 제한은 현재 버전에서는 구현하지 않음. 글로벌 사용제한을 통한 시즌 종료만 구현.

| Option | Description | Selected |
|--------|-------------|----------|
| 남은 횟수 + 리셋 시간 | 투명하고 사용자 친화적 | |
| 차단 메시지만 | 간결하지만 정보 부족 | |
| Claude 재량 | UX 디자인은 Claude가 판단 | |

**User's choice:** 개별 유저의 요율 제한은 현재 버전에서는 구현하지 않음. 글로벌 사용제한을 통한 시즌 종료만 구현.
**Notes:** 개별 요율 제한 전체를 v1에서 제외하는 결정. 비용 제어는 Phase 4 시즌 시스템에 의존.

---

## 핑거프린팅 전략

| Option | Description | Selected |
|--------|-------------|----------|
| 데이터 추적용 | 배틀 결과를 "이 사용자"에게 연결하는 용도. v2 인증 마이그레이션 시 데이터 연결 가능. | |
| 식별 + 남용 감지 | 사용자 식별 + 비정상 패턴 감지(SEC-02)를 Phase 1에서 모두 구현. | |
| 최소한만 | 세션/쿠키 기반 간단 식별만. 본격 핑거프린팅은 v2로. | |
| 핑거프린팅 제외 | v1에서 핑거프린팅 자체를 구현하지 않음. 익명 데이터만 저장. | ✓ |

**User's choice:** 핑거프린팅 완전히 제외
**Notes:** SEC-01, SEC-02를 v2로 이동. PIPA 컴플라이언스 이슈도 함께 제거됨.

---

## 데이터 저장 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 전문 저장 | 질문 + 응답 전문 + 투표 결과 + 모델명 + 카테고리 + 타임스탬프 | ✓ |
| 메타데이터만 | 모델명 + 투표 결과 + 타임스탬프만. 응답 텍스트 미저장. | |
| 단계적 확장 | 초기엔 메타데이터만, 나중에 전문 저장 추가. 마이그레이션 필요. | |

**User's choice:** 전문 저장

| Option | Description | Selected |
|--------|-------------|----------|
| 그냥 저장 | 500MB면 충분. ~100K 배틀 저장 가능. 시즌제로 요청 제한. | ✓ |
| max_tokens 제한으로 간접 제어 | AI 응답 길이를 짧게 제한하면 DB 용량도 절약. | |
| Claude 재량 | DB 용량 전략은 Claude가 판단 | |

**User's choice:** 그냥 저장 (Supabase Free Tier 500MB 충분)
**Notes:** 시즌제로 자연스럽게 용량 제어됨. 별도 용량 전략 불필요.

---

## Claude's Discretion

- AI 응답 설정 (max_tokens, 한국어 시스템 프롬프트, 모델 폴백) — 사용자가 논의 대상에서 제외

## Deferred Ideas

없음 — 논의가 Phase 범위 내에서 유지됨
