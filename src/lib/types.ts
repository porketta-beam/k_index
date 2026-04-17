export interface Category {
  id: string;
  label: string;
  emoji: string;
  description: string;
  examples: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "cover_letter",
    label: "자소서",
    emoji: "📝",
    description: "자기소개서 작성·첨삭",
    examples: [
      "삼성전자 마케팅 직무 자소서 써줘",
      "지원 동기를 자연스럽게 작성해줘",
      "이 자소서 문장 자연스럽게 고쳐줘: [내용 붙여넣기]",
    ],
  },
  {
    id: "report",
    label: "레포트",
    emoji: "📚",
    description: "과제·보고서 작성",
    examples: [
      "기후변화가 한국 농업에 미치는 영향 레포트 개요 잡아줘",
      "MZ세대 소비 트렌드 분석 레포트 써줘",
      "A+ 받을 수 있는 서론 작성법 알려줘",
    ],
  },
  {
    id: "translation",
    label: "번역",
    emoji: "🌏",
    description: "영한/한영 번역·교정",
    examples: [
      "이 논문 초록을 자연스러운 한국어로 번역해줘",
      "이 한국어 문장을 영어 이메일로 써줘",
      "이 영문 문장 문법 교정해줘: [문장 붙여넣기]",
    ],
  },
  {
    id: "coding",
    label: "코딩",
    emoji: "💻",
    description: "프로그래밍 과제·디버깅",
    examples: [
      "Python으로 학점 계산기 만들어줘",
      "이 코드 버그 찾아줘: [코드 붙여넣기]",
      "JavaScript로 할 일 목록 앱 만들어줘",
    ],
  },
  {
    id: "summary",
    label: "요약",
    emoji: "📋",
    description: "논문·자료·뉴스 요약",
    examples: [
      "이 논문 핵심 3줄로 요약해줘: [내용 붙여넣기]",
      "이 뉴스 기사 요약해줘: [기사 붙여넣기]",
      "회의록을 액션 아이템 중심으로 정리해줘",
    ],
  },
  {
    id: "saju",
    label: "사주팔자",
    emoji: "🔮",
    description: "사주·운세·궁합 분석",
    examples: [
      "1999년 3월 15일 오전 10시생 사주 봐줘",
      "올해 내 운세 어때? 1998년생 여자야",
      "남자 2000년생, 여자 1999년생 궁합 어때?",
    ],
  },
];

export const BUDGET_MODELS = [
  "google:gemini-2.5-flash",
  "openai:gpt-4o-mini",
  "anthropic:claude-haiku-4-5-20251001",
  "groq:llama-3.3-70b-versatile",
] as const;

export type BudgetModelId = (typeof BUDGET_MODELS)[number];

export type BattleStatus =
  | "pending"
  | "streaming"
  | "voting"
  | "completed"
  | "error";

export interface Battle {
  id: string;
  question: string;
  model_a: BudgetModelId;
  model_b: BudgetModelId;
  response_a: string | null;
  response_b: string | null;
  position_a: "left" | "right";
  category: string;
  status: BattleStatus;
  created_at: string;
  completed_at: string | null;
}

export type VoteResult = "a" | "b" | "tie" | "both_bad";

export interface Vote {
  id: string;
  battle_id: string;
  winner: VoteResult;
  created_at: string;
}

export interface StreamRequest {
  prompt: string;
  modelId: BudgetModelId;
}
