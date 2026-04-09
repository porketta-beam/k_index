export const BATTLE_CONFIG = {
  /** Korean responses need 2048 tokens (2-4x more than English due to BPE tokenizer).
   *  1024 tokens = ~200-400 Korean characters (insufficient).
   *  2048 tokens = ~400-800 Korean characters (substantive answer).
   *  Per RESEARCH.md Pitfall 1: Korean Token Limit Miscalibration. */
  maxOutputTokens: 2048,

  /** Balanced creativity vs consistency for battle comparisons */
  temperature: 0.7,

  /** Korean system prompt -- instructs all models to respond in natural Korean */
  systemPrompt:
    "당신은 한국어 AI 어시스턴트입니다. 사용자의 질문에 자연스러운 한국어로 답변하세요. 존댓말을 사용하고, 명확하고 유용한 답변을 제공하세요.",
} as const;

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  "openai:gpt-4o-mini": "GPT-4o-mini",
  "anthropic:claude-haiku-4-5": "Claude Haiku 4.5",
  "google:gemini-2.5-flash": "Gemini 2.5 Flash",
};
