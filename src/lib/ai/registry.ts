// Source: https://ai-sdk.dev/docs/reference/ai-sdk-core/provider-registry
import { createProviderRegistry } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";

export const registry = createProviderRegistry({
  openai,
  anthropic,
  google,
  groq,
});

// Re-export from types for convenience in AI modules
export { BUDGET_MODELS, type BudgetModelId } from "@/lib/types";
