---
phase: 05-korean-ui-responsive-polish
created: 2026-04-10
status: locked
---

<decisions>
## Implementation Decisions

### 모바일 레이아웃 전략
- **D-01:** 모바일(<768px)에서 응답 카드 2개는 **좌우 스와이프** 방식으로 전환한다 (arena.ai 방식). 점 인디케이터(●○)로 현재 위치 표시.
- **D-02:** 스트리밍 중에도 스와이프 전환이 가능하다. 두 응답이 모두 완료될 때까지 기다리지 않는다.
- **D-03:** 반응형 브레이크포인트는 **md (768px)** 기준이다. 768px 미만 = 모바일(스와이프), 768px 이상 = 데스크톱(가로 나란히). 태블릿 세로모드는 모바일로 취급한다.

### 전체 플로우 전환 & 애니메이션
- **D-04:** 단계 전환(입력→스트리밍→투표→결과)은 **애니메이션 없이 즉각 교체**한다. 부드러운 전환보다 빠른 반응을 우선시한다.
- **D-05:** 스트리밍 대기 상태는 **빈 카드 + 점진적 텍스트** 방식이다. 현재 구현된 스트리밍 텍스트 패턴을 그대로 유지한다. 별도의 스켈레톤/스피너 없음.

### 한국어 텍스트 & 톤
- **D-06:** UI 텍스트의 말투는 **혼합(상황별)**이다. 인터랙션 안내/버튼/레이블은 친근한 반말 톤("배틀 시작!", "투표 완료!"), 에러/시스템 메시지는 정중한 존댓말("오류가 발생했습니다", "잠시 후 다시 시도해주세요").
- **D-07:** i18n 구조는 v1에서 도입하지 않는다. **한국어 전용 유지**, 인라인 문자열 그대로 둔다. v2에서 다국어가 필요해지면 그때 추가.

### arena.ai 차용 요소 (직접 확인 후 결정)
- **D-08:** 시각적 레퍼런스는 **arena.ai** (https://arena.ai/). 배틀 흐름과 전체 분위기를 차용한다. 모던 AI 도구 느낌.
- **D-09:** **라이트모드 전용**. 다크모드는 v1에서 지원하지 않는다. 하나의 테마만 관리한다.
- **D-10:** 응답 카드 레이아웃은 arena.ai 스타일 — 데스크톱에서 **좌우 50:50 병렬 배치**, 카드 상단에 모델명(익명 "모델 A/B" → 투표 후 실제 모델명 공개). 응답이 카드 높이를 초과하면 **카드 내부에서 스크롤** 가능하도록 한다.
- **D-11:** 투표 버튼은 arena.ai 스타일 중앙 배치 버튼이되, 선택지는 **"A가 더 좋아" / "B가 더 좋아" 2개만**. "둘 다 좋습니다" / "둘 다 별로" 선택지는 없다. (K-Index는 명확한 승패 판정에 집중)
- **D-12:** 입력창은 **하단 고정** (arena.ai 방식). 현재 상단 배치에서 하단으로 이동한다.
- **D-13:** 사이드바 네비게이션은 v1에서 도입하지 않는다. 단일 배틀 페이지 유지.

### Claude's Discretion
- arena.ai 레퍼런스를 기반으로 한 구체적인 색상/타이포그래피 조정
- 모바일 스와이프 구현 방식 (CSS scroll snap vs 라이브러리)
- 기존 OKLCH 색상 시스템의 라이트모드 최적화 방식
- 접근성(a11y) 구현 범위 및 방식
- 응답 카드 내부 스크롤의 max-height 기준

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — UI-01, UI-02, UI-03 requirements
- `.planning/ROADMAP.md` §Phase 5 — 성공 기준 3개

### Prior Phase Context
- `.planning/phases/02-core-battle-loop/02-CONTEXT.md` — 배틀 플로우 결정사항 (D-04~D-12). 특히 D-05 (응답 시간 표시), D-11 (투표 후 텍스트 유지), D-12 (새 배틀 시 초기화)
- `.planning/phases/02-core-battle-loop/02-UI-SPEC.md` — 현재 UI 계약. 상태 머신, 컴포넌트, 색상, 타이포그래피, 애니메이션

### External Reference
- `https://arena.ai/` — 시각적 레퍼런스. 배틀 흐름, 분위기, 레이아웃 참조

### Existing Code (Key Files)
- `src/components/battle/battle-arena.tsx` — 배틀 오케스트레이터 (Phase 5에서 반응형 수정)
- `src/components/battle/response-card.tsx` — 응답 카드 (모바일 탭 전환 대상)
- `src/components/battle/season-ended.tsx` — 시즌 종료 화면 (접근성 패턴 참조)
- `src/lib/store/battle-store.ts` — Zustand 스토어 (탭 상태 추가 가능)
- `src/app/globals.css` — OKLCH 색상 시스템, Pretendard 폰트, word-break 설정

</canonical_refs>

<code_context>
## Existing Code Insights

### 재사용 가능한 자산
- **10개 배틀 컴포넌트**: battle-arena, battle-input, response-card, vote-panel, reveal-panel, win-rate-bar, streaming-indicator, category-selector, system-prompt-editor, season-ended
- **9개 UI primitive**: badge, button, card, separator, skeleton, textarea, collapsible, toggle, toggle-group
- **Zustand 스토어**: 배틀 상태 머신 (idle→streaming→voting→reveal), 카테고리, 시즌 상태 관리

### 확립된 패턴
- OKLCH 색상 시스템 (primary purple, reveal-a violet, reveal-b cyan)
- Pretendard Variable 폰트 (CDN, font-weight variable)
- `word-break: keep-all` 한국어 줄바꿈
- shadcn/ui 컴포넌트 시스템 (Tailwind v4 호환)
- `aria-label`, `aria-live="polite"` 부분 적용

### 현재 접근성 상태
- BattleInput: `aria-label="배틀 질문 입력"`, Ctrl/Cmd+Enter 키보드 지원
- ResponseCard: `aria-live="polite"` 스트리밍 텍스트
- SeasonEnded: `role="status"`, `aria-label`, `motion-reduce:animate-none`
- 미흡: 랜드마크 구조, 폼 레이블, 네비게이션 없음

### 반응형 현황
- `sm:w-auto` 일부 사용
- 명시적 모바일 레이아웃 없음
- max-w-[1120px] 데스크톱 컨테이너
</code_context>

<deferred>
## Deferred Ideas

- 다크모드 토글 (v2 고려)
- next-intl 기반 i18n 구조화 (영어 지원 필요 시)
- 접근성 전면 감사 (WCAG AA 준수)
- 사이드바 네비게이션 + 리더보드/검색 페이지 (v2 고려)
</deferred>
