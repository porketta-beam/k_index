"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

type Phase = "input" | "streaming" | "voting" | "reveal";

type VoteResult = "left" | "right" | "tie" | "both_bad";

interface RevealData {
  winner: "a" | "b" | "tie" | "both_bad";
  leftModelId: string;
  rightModelId: string;
  votedResult: VoteResult;
}

const MODEL_LABELS: Record<string, string> = {
  "google:gemini-2.5-flash": "Gemini 2.5 Flash",
  "groq:llama-3.3-70b-versatile": "Llama 3.3 70B",
  "openai:gpt-4o-mini": "GPT-4o mini",
  "anthropic:claude-haiku-4-5-20251001": "Claude Haiku",
  "anthropic:claude-haiku-4-5": "Claude Haiku",
};

function modelLabel(id: string) {
  return MODEL_LABELS[id] ?? id;
}

async function streamPanel(
  modelId: string,
  question: string,
  onDelta: (text: string) => void,
  onDone: () => void,
) {
  const res = await fetch("/api/battle/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: question, modelId }),
  });

  if (!res.body) {
    onDone();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

    for (const line of lines) {
      try {
        const data = JSON.parse(line.slice(6));
        if (data.type === "text-delta" && data.delta) {
          onDelta(data.delta);
        }
      } catch {
        // 파싱 실패 무시
      }
    }
  }

  onDone();
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("input");
  const [question, setQuestion] = useState("");
  const [battleId, setBattleId] = useState("");
  const [leftModelId, setLeftModelId] = useState("");
  const [rightModelId, setRightModelId] = useState("");
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [leftDone, setLeftDone] = useState(false);
  const [rightDone, setRightDone] = useState(false);
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [voting, setVoting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // 둘 다 완료되면 투표 단계로
  useEffect(() => {
    if (leftDone && rightDone && phase === "streaming") {
      setPhase("voting");
    }
  }, [leftDone, rightDone, phase]);

  // 스크롤 자동 내리기
  useEffect(() => {
    if (leftRef.current) {
      leftRef.current.scrollTop = leftRef.current.scrollHeight;
    }
  }, [leftText]);

  useEffect(() => {
    if (rightRef.current) {
      rightRef.current.scrollTop = rightRef.current.scrollHeight;
    }
  }, [rightText]);

  async function startBattle() {
    if (!question.trim()) return;

    // 배틀 시작
    const res = await fetch("/api/battle/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, category: selectedCategory ?? "general" }),
    });

    if (!res.ok) return;

    const { battleId, leftModelId, rightModelId } = await res.json();
    setBattleId(battleId);
    setLeftModelId(leftModelId);
    setRightModelId(rightModelId);
    setLeftText("");
    setRightText("");
    setLeftDone(false);
    setRightDone(false);
    setReveal(null);
    setPhase("streaming");

    // 두 모델 동시 스트리밍
    streamPanel(
      leftModelId,
      question,
      (delta) => setLeftText((prev) => prev + delta),
      () => setLeftDone(true),
    );
    streamPanel(
      rightModelId,
      question,
      (delta) => setRightText((prev) => prev + delta),
      () => setRightDone(true),
    );
  }

  async function vote(voteResult: VoteResult) {
    setVoting(true);
    const res = await fetch("/api/battle/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ battleId, voteResult }),
    });

    if (!res.ok) {
      setVoting(false);
      return;
    }

    const data = await res.json();
    setReveal({ ...data, votedResult: voteResult });
    setPhase("reveal");
    setVoting(false);
  }

  function reset() {
    setPhase("input");
    setQuestion("");
    setBattleId("");
    setLeftText("");
    setRightText("");
    setLeftDone(false);
    setRightDone(false);
    setReveal(null);
    setSelectedCategory(null);
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#050505" }}>
      {/* 헤더 */}
      <header className="border-b border-[#00ff4122] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#00ff41] text-xl font-bold tracking-widest glitch">
            K-INDEX
          </span>
          <span className="text-[#00ff4155] text-xs tracking-widest">
            AI BATTLE ARENA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/stats" className="cyber-btn rounded px-4 py-1.5 text-xs">
            LEADERBOARD
          </Link>
          <span className="text-[#00ff4144] text-xs">
            <span className="blink">▊</span> ONLINE
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col px-4 py-6 max-w-7xl mx-auto w-full gap-6">

        {/* 질문 입력 */}
        <div className="cyber-panel rounded p-4 flex flex-col gap-3">
          {/* 카테고리 선택 */}
          <label className="text-[#00ff4188] text-xs tracking-widest">
            &gt; CATEGORY
          </label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`rounded px-3 py-1.5 text-xs font-bold transition-all border ${
                  selectedCategory === cat.id
                    ? "border-[#00ff41] bg-[#00ff4115] text-[#00ff41]"
                    : "border-[#00ff4133] text-[#00ff4166] hover:border-[#00ff4166] hover:text-[#00ff4199]"
                }`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                }
                disabled={phase !== "input"}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* 예시 프롬프트 */}
          {selectedCategory && phase === "input" && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[#00ff4155] text-xs tracking-widest">
                &gt; EXAMPLES
              </span>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.examples.map(
                  (ex) => (
                    <button
                      key={ex}
                      className="text-xs text-[#00ff4166] border border-[#00ff4122] rounded px-2 py-1 hover:text-[#00ff41aa] hover:border-[#00ff4144] transition-all text-left"
                      onClick={() => setQuestion(ex)}
                    >
                      {ex}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* 질문 입력 */}
          <label className="text-[#00ff4188] text-xs tracking-widest mt-1">
            &gt; QUESTION INPUT
          </label>
          <div className="flex gap-3">
            <textarea
              className="cyber-input flex-1 rounded p-3 text-sm resize-none min-h-[80px]"
              placeholder="AI에게 질문을 입력하세요..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={phase !== "input"}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.ctrlKey) startBattle();
              }}
            />
            <button
              className="cyber-btn-primary rounded px-6 py-3 text-sm font-bold self-end whitespace-nowrap"
              onClick={startBattle}
              disabled={phase !== "input" || !question.trim()}
            >
              BATTLE
              <br />
              START
            </button>
          </div>
          <p className="text-[#00ff4133] text-xs">Ctrl+Enter로 시작</p>
        </div>

        {/* 카테고리 배지 (배틀 중) */}
        {phase !== "input" && selectedCategory && (
          <div className="flex items-center gap-2">
            <span className="text-[#00ff4155] text-xs tracking-widest">&gt; CATEGORY:</span>
            <span className="text-[#00ff41] text-xs font-bold border border-[#00ff4133] rounded px-2 py-0.5">
              {CATEGORIES.find((c) => c.id === selectedCategory)?.emoji}{" "}
              {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
            </span>
          </div>
        )}

        {/* 배틀 패널 */}
        {phase !== "input" && (
          <div className="flex gap-4 flex-1">
            {/* 왼쪽 */}
            <div className="flex-1 flex flex-col cyber-panel rounded overflow-hidden">
              <div className="border-b border-[#00ff4122] px-4 py-2 flex items-center justify-between">
                <span className="text-[#00ff41] text-xs tracking-widest font-bold">
                  MODEL_A
                </span>
                {!leftDone && (
                  <span className="text-[#00ff4188] text-xs">
                    <span className="blink">▊</span> STREAMING
                  </span>
                )}
                {leftDone && phase !== "reveal" && (
                  <span className="text-[#00ff4166] text-xs">✓ DONE</span>
                )}
                {phase === "reveal" && reveal && (
                  <span className="text-xs font-bold reveal-flash text-[#00ff4188]">
                    {reveal.votedResult === "tie" && "≈ TIE"}
                    {reveal.votedResult === "both_bad" && "✕ —"}
                    {reveal.votedResult === "left" && "◆ WINNER"}
                    {reveal.votedResult === "right" && "◇ LOSER"}
                  </span>
                )}
              </div>
              <div
                ref={leftRef}
                className="flex-1 p-4 text-sm leading-relaxed overflow-y-auto text-[#00ff41cc]"
                style={{ minHeight: "300px", maxHeight: "500px", whiteSpace: "pre-wrap" }}
              >
                {leftText || (
                  <span className="text-[#00ff4133]">응답 생성 중...</span>
                )}
                {!leftDone && leftText && (
                  <span className="blink text-[#00ff41]">▊</span>
                )}
              </div>
              {phase === "reveal" && reveal && (
                <div className="border-t border-[#00ff4122] px-4 py-2 text-xs text-[#00ff4188] reveal-flash">
                  {modelLabel(reveal.leftModelId)}
                </div>
              )}
            </div>

            {/* 가운데 VS */}
            <div className="flex flex-col items-center justify-center gap-2 min-w-[48px]">
              <span className="text-[#00ff41] text-lg font-bold tracking-widest">
                VS
              </span>
              {phase === "voting" && (
                <span className="text-[#00ff4155] text-xs writing-vertical" style={{ writingMode: "vertical-rl" }}>
                  CHOOSE
                </span>
              )}
            </div>

            {/* 오른쪽 */}
            <div className="flex-1 flex flex-col cyber-panel rounded overflow-hidden">
              <div className="border-b border-[#00ff4122] px-4 py-2 flex items-center justify-between">
                <span className="text-[#00ff41] text-xs tracking-widest font-bold">
                  MODEL_B
                </span>
                {!rightDone && (
                  <span className="text-[#00ff4188] text-xs">
                    <span className="blink">▊</span> STREAMING
                  </span>
                )}
                {rightDone && phase !== "reveal" && (
                  <span className="text-[#00ff4166] text-xs">✓ DONE</span>
                )}
                {phase === "reveal" && reveal && (
                  <span className="text-xs font-bold reveal-flash text-[#00ff4188]">
                    {reveal.votedResult === "tie" && "≈ TIE"}
                    {reveal.votedResult === "both_bad" && "✕ —"}
                    {reveal.votedResult === "left" && "◇ LOSER"}
                    {reveal.votedResult === "right" && "◆ WINNER"}
                  </span>
                )}
              </div>
              <div
                ref={rightRef}
                className="flex-1 p-4 text-sm leading-relaxed overflow-y-auto text-[#00ff41cc]"
                style={{ minHeight: "300px", maxHeight: "500px", whiteSpace: "pre-wrap" }}
              >
                {rightText || (
                  <span className="text-[#00ff4133]">응답 생성 중...</span>
                )}
                {!rightDone && rightText && (
                  <span className="blink text-[#00ff41]">▊</span>
                )}
              </div>
              {phase === "reveal" && reveal && (
                <div className="border-t border-[#00ff4122] px-4 py-2 text-xs text-[#00ff4188] reveal-flash">
                  {modelLabel(reveal.rightModelId)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 투표 버튼 */}
        {phase === "voting" && (
          <div className="cyber-panel rounded p-6 flex flex-col items-center gap-4">
            <p className="text-[#00ff41] text-sm tracking-widest">
              &gt; 더 나은 답변을 선택하세요
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button
                className="cyber-vote-btn rounded px-8 py-4 text-sm font-bold"
                onClick={() => vote("left")}
                disabled={voting}
              >
                ◀ MODEL_A 선택
              </button>
              <button
                className="cyber-vote-btn rounded px-8 py-4 text-sm font-bold"
                onClick={() => vote("right")}
                disabled={voting}
              >
                MODEL_B 선택 ▶
              </button>
              <button
                className="cyber-btn rounded px-8 py-4 text-sm font-bold"
                onClick={() => vote("tie")}
                disabled={voting}
              >
                ≈ 비김
              </button>
              <button
                className="cyber-btn rounded px-8 py-4 text-sm font-bold"
                onClick={() => vote("both_bad")}
                disabled={voting}
              >
                ✕ 둘 다 별로
              </button>
            </div>
          </div>
        )}

        {/* 결과 공개 */}
        {phase === "reveal" && reveal && (
          <div className="cyber-panel rounded p-6 flex flex-col items-center gap-4 reveal-flash">
            <p className="text-[#00ff41] text-xs tracking-widest">
              &gt; BATTLE RESULT
            </p>
            <div className="text-center">
              {reveal.votedResult === "tie" && (
                <p className="text-[#00ff41] text-lg font-bold mb-1">≈ 비김</p>
              )}
              {reveal.votedResult === "both_bad" && (
                <p className="text-[#00ff4188] text-lg font-bold mb-1">✕ 둘 다 별로</p>
              )}
              {(reveal.votedResult === "left" || reveal.votedResult === "right") && (
                <>
                  <p className="text-[#00ff41] text-lg font-bold mb-1">
                    {reveal.votedResult === "left" ? "◀ MODEL_A" : "MODEL_B ▶"} 선택
                  </p>
                  <p className="text-[#00ff4188] text-sm">
                    선택한 모델:{" "}
                    <span className="text-[#00ff41] font-bold">
                      {reveal.votedResult === "left"
                        ? modelLabel(reveal.leftModelId)
                        : modelLabel(reveal.rightModelId)}
                    </span>
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-8 text-xs text-[#00ff4166]">
              <span>MODEL_A = {modelLabel(reveal.leftModelId)}</span>
              <span>MODEL_B = {modelLabel(reveal.rightModelId)}</span>
            </div>
            <button
              className="cyber-btn rounded px-8 py-3 text-sm mt-2"
              onClick={reset}
            >
              ↺ 새 배틀 시작
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
