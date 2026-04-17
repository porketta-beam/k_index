# K-Index 개발 일지

---

## 2026-04-16 (2일차)

### 작업 내용

#### 1. 4개 AI 모델 활성화
- **배경**: 기존에는 Gemini + Llama(Groq) 2개만 배틀에 사용됨
- **변경**: OpenAI(`gpt-4o-mini`), Anthropic(`claude-haiku-4-5-20251001`) API 키를 `.env.local`에 추가하고 `BUDGET_MODELS`에 포함
- **파일**: `src/lib/types.ts`, `src/lib/env.ts`
- **주의**: `env.ts`에서 OPENAI/ANTHROPIC 키가 이제 required — 없으면 서버 시작 시 에러남

#### 2. 카테고리 시스템 추가
- **배경**: 기획안 핵심 — 입력 포맷 기반이 아닌 사용자 목적 기반 분류
- **카테고리 6개**: 자소서(`cover_letter`), 레포트(`report`), 번역(`translation`), 코딩(`coding`), 요약(`summary`), 사주팔자(`saju`)
- **구현**:
  - `CATEGORIES` 상수를 `src/lib/types.ts`에서 관리 → 여기만 수정하면 홈·리더보드 모두 자동 반영
  - 홈 화면에 카테고리 선택 버튼 추가 (선택하면 예시 프롬프트 표시)
  - 카테고리 미선택 시 `"general"`로 저장
  - `api/battle/start`에서 category 받아서 DB에 저장
- **파일**: `src/lib/types.ts`, `src/app/page.tsx`, `src/app/api/battle/start/route.ts`
- **DB**: `battles.category` 컬럼 기존부터 있었음 — 스키마 변경 불필요

#### 3. 4지선다 투표 구현
- **배경**: 기획안 차별점 — A승 / B승 / 비김 / 둘다별로
- **DB 변경**: Supabase에서 `votes_winner_check` 제약 조건 직접 수정 필요했음
  ```sql
  ALTER TABLE public.votes DROP CONSTRAINT votes_winner_check;
  ALTER TABLE public.votes ADD CONSTRAINT votes_winner_check
    CHECK (winner = ANY (ARRAY['a','b','tie','both_bad']));
  ```
- **로직**: `left`/`right`는 `battles.position_a` 기준으로 `a`/`b`로 변환, `tie`/`both_bad`는 그대로 저장
- **리더보드 반영**: `tie`/`both_bad`는 배틀 수에 포함, 승리에는 미포함 (의도된 동작) — 추후 팀 논의 필요
- **파일**: `src/lib/types.ts`, `src/lib/db/queries.ts`, `src/app/api/battle/vote/route.ts`, `src/app/page.tsx`

#### 4. 카테고리별 리더보드
- **구현**: 리더보드 상단에 탭 추가 (전체 + 6개 카테고리)
- **API**: `/api/stats?category=cover_letter` 형태로 필터링 지원
- **신뢰도 표시**: 배틀 수 10개 미만인 카테고리는 "데이터 수집 중" 뱃지 표시
- **파일**: `src/app/stats/page.tsx`, `src/app/api/stats/route.ts`, `src/lib/db/queries.ts`

#### 5. 버그 수정
- Claude Haiku가 리더보드에 2개로 뜨는 문제: DB에 `anthropic:claude-haiku-4-5` (구버전 ID)와 `anthropic:claude-haiku-4-5-20251001`이 혼재 → `normalizeModelId()` 함수로 집계 시 통합
- **파일**: `src/lib/db/queries.ts`

---

## 2026-04-15 (1일차)

### 작업 내용

- Supabase DB 스키마 생성 (`battles`, `votes` 테이블)
- Supabase 클라이언트 및 쿼리 레이어 작성 (`src/lib/db/`)
- AI 프로바이더 레지스트리 구성 (`src/lib/ai/registry.ts`) — Vercel AI SDK 기반, openai/anthropic/google/groq 4개 프로바이더
- 스트리밍 Route Handler 구현 (`src/app/api/battle/stream/route.ts`)
- 기본 배틀 UI 구현 (`src/app/page.tsx`) — 좌우 패널 동시 스트리밍
- 리더보드 기본 페이지 구현 (`src/app/stats/page.tsx`)

---

## 현재 상태 (2026-04-16 기준)

### 완성된 기능
- [x] 4개 모델 블라인드 배틀 (Gemini, GPT-4o mini, Claude Haiku, Llama 3.3)
- [x] 6개 카테고리 선택 + 예시 프롬프트
- [x] 4지선다 투표 (A승 / B승 / 비김 / 둘다별로)
- [x] 카테고리별 리더보드

### 미완성 (MVP 잔여)
- [ ] Rate limiting (Upstash) — 공개 배포 전 필수
- [ ] 결과 화면 개선 — 카테고리 Top 5 + 액션 버튼 3개
- [ ] 홈화면 개선 — 오늘의 투표 현황, 카테고리 카드
- [ ] 모바일 반응형 검증
- [ ] 비김/둘다별로 승률 반영 방식 팀 결정 필요

### 미결 결정 사항
- `tie` / `both_bad` 투표를 승률 계산에 어떻게 반영할지 (현재: 배틀 수만 +1, 승리 미반영)
- Vercel 배포 시점 — rate limiting 붙인 후 진행 권장

---

## 아키텍처 요약

```
src/
├── app/
│   ├── page.tsx              # 메인 배틀 UI (홈)
│   ├── stats/page.tsx        # 리더보드
│   └── api/
│       ├── battle/
│       │   ├── start/        # 배틀 생성 (모델 랜덤 배정)
│       │   ├── stream/       # AI 스트리밍 (Vercel AI SDK)
│       │   └── vote/         # 투표 처리
│       └── stats/            # 승률 통계 (카테고리 필터 지원)
└── lib/
    ├── types.ts              # 공통 타입 + CATEGORIES + BUDGET_MODELS
    ├── env.ts                # 환경변수 검증 (zod)
    ├── ai/
    │   ├── registry.ts       # AI 프로바이더 레지스트리
    │   └── config.ts         # 배틀 설정 (system prompt, max tokens)
    └── db/
        ├── client.ts         # Supabase 클라이언트
        └── queries.ts        # DB 쿼리 함수
```

## 환경변수 (.env.local)

```
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 로컬 실행

```bash
npm run dev
# → http://localhost:3000
```
