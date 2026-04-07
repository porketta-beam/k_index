#!/bin/bash
# Smoke test: verify all 3 AI providers stream Korean responses
# Requires: npm run dev running on localhost:3000, valid API keys in .env.local

BASE_URL="http://localhost:3000/api/battle/stream"
PROMPT="한국의 수도는 어디인가요? 간단히 답변해주세요."

echo "=== Testing OpenAI GPT-4o-mini ==="
curl -s -N -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$PROMPT\", \"modelId\": \"openai:gpt-4o-mini\"}" \
  --max-time 30
echo -e "\n"

echo "=== Testing Anthropic Claude Haiku 4.5 ==="
curl -s -N -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$PROMPT\", \"modelId\": \"anthropic:claude-haiku-4-5\"}" \
  --max-time 30
echo -e "\n"

echo "=== Testing Google Gemini 2.0 Flash ==="
curl -s -N -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"$PROMPT\", \"modelId\": \"google:gemini-2.0-flash\"}" \
  --max-time 30
echo -e "\n"

echo "=== Testing Invalid Model ID (should return 400) ==="
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"test\", \"modelId\": \"invalid:model\"}" \
  --max-time 10
echo -e "\n"

echo "=== Testing Empty Prompt (should return 400) ==="
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\": \"\", \"modelId\": \"openai:gpt-4o-mini\"}" \
  --max-time 10
echo -e "\n"

echo "=== All tests complete ==="
