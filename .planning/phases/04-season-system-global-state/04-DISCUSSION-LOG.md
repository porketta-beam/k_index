# Phase 4: Season System & Global State - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 04-season-system-global-state
**Areas discussed:** Admin 접근 방식, 카운터 표시 & 실시간성, 시즌 종료 사용자 경험, 시즌 데이터 경계

---

## Admin 접근 방식

### 관리자 인증 방법

| Option | Description | Selected |
|--------|-------------|----------|
| Secret API key (추천) | 환경변수로 API key 설정, Authorization 헤더로 인증. curl/Postman으로 제어. | ✓ |
| Secret admin URL | /admin/{secret-token} 경로로 간단한 관리 UI 접근 | |
| Supabase RLS + 서비스 롤 키 | Supabase Dashboard에서 직접 조작 | |

**User's choice:** Secret API key (추천)
**Notes:** 별도 관리 UI 불필요. 환경변수 + curl로 충분.

### 관리자 작업 범위

| Option | Description | Selected |
|--------|-------------|----------|
| 시즌 시작/종료만 (추천) | POST /api/admin/season/start, POST /api/admin/season/end | ✓ |
| 시즌 + 임계치 수정 | 시즌 시작/종료 + 배틀 임계치 수정 가능 | |
| Claude 재량 | v1에 필요한 관리 작업 범위를 Claude가 판단 | |

**User's choice:** 시즌 시작/종료만 (추천)
**Notes:** None

### 시즌 임계치 설정

| Option | Description | Selected |
|--------|-------------|----------|
| 환경변수 (추천) | SEASON_BATTLE_THRESHOLD=1000. 변경 시 재배포 필요. | ✓ |
| DB 저장 | seasons 테이블에 threshold 컬럼. 재배포 없이 변경 가능. | |
| Claude 재량 | 임계치 설정 방식을 Claude가 판단 | |

**User's choice:** 환경변수 (추천)
**Notes:** None

---

## 카운터 표시 & 실시간성

### 글로벌 배틀 카운터 UI 표시

**User's choice:** 배틀 카운터는 표시하지 않음
**Notes:** 사용자가 질문 전에 직접 명시. 서버 내부 추적용으로만 사용.

### 시즌 종료 감지 방법

| Option | Description | Selected |
|--------|-------------|----------|
| 배틀 요청 시 서버 거부 (추천) | /api/battle/start가 시즌 종료 응답 반환. polling/SSE 불필요. | ✓ |
| 페이지 로드 시 상태 확인 | 페이지 접속/새로고침 시 GET /api/season/status 호출 | |
| 둘 다 (추천+) | 이중 보호: 페이지 로드 시 + 배틀 요청 시 | |

**User's choice:** 배틀 요청 시 서버 거부 (추천)
**Notes:** None

---

## 시즌 종료 사용자 경험

### 시즌 종료 화면

| Option | Description | Selected |
|--------|-------------|----------|
| 간결한 종료 메시지 (추천) | "시즌 1 배틀이 끝났습니다!" + "다음 시즌을 기다려주세요". 배틀 UI 완전 대체. | ✓ |
| 종료 + 간단 통계 | 종료 메시지 + 총 배틀 수, 모델별 승률 표시 | |

**User's choice:** 간결한 종료 메시지 (추천)
**Notes:** None

### 진행 중 배틀 처리

| Option | Description | Selected |
|--------|-------------|----------|
| 완료까지 허용 (추천) | 이미 시작된 배틀은 투표/공개까지 완료 가능. 새 배틀만 차단. | ✓ |
| 즉시 중단 | 모든 진행 중 배틀 즉시 종료 | |
| Claude 재량 | 진행 중 배틀 처리 방식을 Claude가 판단 | |

**User's choice:** 완료까지 허용 (추천)
**Notes:** None

---

## 시즌 데이터 경계

### 시즌 태그

| Option | Description | Selected |
|--------|-------------|----------|
| 시즌 태그 부여 (추천) | battles 테이블에 season_id 컬럼 추가. 시즌별 데이터 분리. | ✓ |
| 태그 없이 운영 | 기존 테이블 그대로. 시즌별 분석 불가. | |

**User's choice:** 시즌 태그 부여 (추천)
**Notes:** 사용자가 처음 "태그 없이 운영" 선택 후 "시즌 태그 부여하는 것으로 변경"으로 정정.

### 시즌별 승률 리셋

| Option | Description | Selected |
|--------|-------------|----------|
| 시즌별 리셋 (추천) | 새 시즌 시작 시 승률 0%부터 시작. season_id 필터링. | ✓ |
| 누적 승률 유지 | 시즌에 관계없이 전체 누적 승률 표시 | |
| Claude 재량 | 승률 리셋 여부를 Claude가 판단 | |

**User's choice:** 시즌별 리셋 (추천)
**Notes:** None

---

## Claude's Discretion

- Upstash Redis 글로벌 카운터 구현 방식
- seasons 테이블 스키마 설계
- 시즌 상태 체크 성능 최적화
- 시즌 종료 화면 상세 디자인

## Deferred Ideas

None — discussion stayed within phase scope
