# Phase 3: Category System - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-09
**Phase:** 03-category-system
**Areas discussed:** 커스텀 프롬프트 지속성, 카테고리 데이터 구조

---

## 커스텀 프롬프트 지속성

### Q1: 새 배틀 시작 시 커스텀 시스템 프롬프트 처리

| Option | Description | Selected |
|--------|-------------|----------|
| 매번 초기화 (Recommended) | UI-SPEC 결정대로 새 배틀마다 카테고리 기본 프롬프트로 리셋 | ✓ |
| 세션 동안 유지 | 브라우저 탭을 닫기 전까지 카테고리별 커스텀 프롬프트 유지 | |
| Claude 재량 | Claude가 최적의 방식으로 결정 | |

**User's choice:** 매번 초기화
**Notes:** UI-SPEC 결정 확인.

### Q2: 브라우저 새로고침 시 선택된 카테고리 처리

| Option | Description | Selected |
|--------|-------------|----------|
| 초기화 (일반) (Recommended) | 새로고침 시 카테고리도 '일반'으로 리셋 | |
| URL로 카테고리 유지 | URL 쿼리 파라미터로 카테고리 저장, 새로고침/링크 공유 시 보존 | ✓ |
| Claude 재량 | Claude가 최적의 방식으로 결정 | |

**User's choice:** URL로 카테고리 유지
**Notes:** 링크 공유 시 카테고리 포함 가능.

---

## 카테고리 데이터 구조

### Q1: 카테고리 데이터 정의 위치

| Option | Description | Selected |
|--------|-------------|----------|
| 코드 상수 (Recommended) | src/lib/categories.ts에 static array로 정의 | ✓ |
| Supabase 테이블 | categories DB 테이블에 저장 | |
| 설정 파일 (JSON) | categories.json 파일로 분리 | |

**User's choice:** 코드 상수로 관리하되 코딩 카테고리는 삭제
**Notes:** 6개에서 5개로 축소. 코딩(💻) 카테고리 삭제.

### Q2: 카테고리 목록 확인

| Option | Description | Selected |
|--------|-------------|----------|
| 맞습니다 | 5개 카테고리 확정 (일반, 과제, 자소서, 상담, 창작) | ✓ |
| 수정 필요 | 카테고리 목록을 더 조정하고 싶음 | |

**User's choice:** 맞습니다
**Notes:** 없음.

### Q3: 향후 카테고리 추가 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 코드 수정 + 배포 (Recommended) | categories.ts 배열에 항목 추가 후 재배포 | ✓ |
| v2에서 DB 마이그레이션 | v1은 코드 상수 유지, v2에서 DB로 이전 | |
| Claude 재량 | Claude가 확장성 전략을 결정 | |

**User's choice:** 코드 수정 + 배포
**Notes:** 없음.

---

## Claude's Discretion

- 시스템 프롬프트 HMAC 토큰 포함 방식
- URL 쿼리 파라미터 구현 패턴
- 프롬프트 서버 사이드 유효성 검증

## Deferred Ideas

None — discussion stayed within phase scope
