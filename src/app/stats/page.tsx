"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/types";

interface ModelStat {
  modelId: string;
  totalBattles: number;
  wins: number;
  winRate: number;
}

const MODEL_LABELS: Record<string, string> = {
  "google:gemini-2.5-flash": "Gemini 2.5 Flash",
  "groq:llama-3.3-70b-versatile": "Llama 3.3 70B",
  "openai:gpt-4o-mini": "GPT-4o mini",
  "anthropic:claude-haiku-4-5-20251001": "Claude Haiku",
  "anthropic:claude-haiku-4-5": "Claude Haiku",
};

const MODEL_PROVIDER: Record<string, string> = {
  "google:gemini-2.5-flash": "Google",
  "groq:llama-3.3-70b-versatile": "Meta / Groq",
  "openai:gpt-4o-mini": "OpenAI",
  "anthropic:claude-haiku-4-5-20251001": "Anthropic",
  "anthropic:claude-haiku-4-5": "Anthropic",
};

const MIN_BATTLES_FOR_TRUST = 10;

type TabId = "all" | string;

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [stats, setStats] = useState<ModelStat[]>([]);
  const [totalBattles, setTotalBattles] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url =
      activeTab === "all"
        ? "/api/stats"
        : `/api/stats?category=${activeTab}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.modelStats ?? []);
        setTotalBattles(data.totalBattles ?? 0);
      })
      .finally(() => setLoading(false));
  }, [activeTab]);

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab);

  return (
    <main className="min-h-screen flex flex-col" style={{ background: "#050505" }}>
      {/* 헤더 */}
      <header className="border-b border-[#00ff4122] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[#00ff41] text-xl font-bold tracking-widest hover:opacity-80">
            K-INDEX
          </Link>
          <span className="text-[#00ff4155] text-xs tracking-widest">
            AI BATTLE ARENA
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="cyber-btn rounded px-4 py-1.5 text-xs">
            ← BATTLE
          </Link>
          <span className="text-[#00ff4144] text-xs">
            <span className="blink">▊</span> ONLINE
          </span>
        </div>
      </header>

      <div className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full flex flex-col gap-6">

        {/* 타이틀 */}
        <div className="flex flex-col gap-1">
          <p className="text-[#00ff4155] text-xs tracking-widest">&gt; LEADERBOARD</p>
          <h1 className="text-[#00ff41] text-2xl font-bold tracking-wider">AI 승률 현황</h1>
          <p className="text-[#00ff4166] text-sm">누적 배틀 기준 모델별 승률</p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex gap-2 flex-wrap">
          <button
            className={`rounded px-4 py-1.5 text-xs font-bold transition-all border ${
              activeTab === "all"
                ? "border-[#00ff41] bg-[#00ff4115] text-[#00ff41]"
                : "border-[#00ff4133] text-[#00ff4166] hover:border-[#00ff4166] hover:text-[#00ff4199]"
            }`}
            onClick={() => setActiveTab("all")}
          >
            🏆 전체
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`rounded px-4 py-1.5 text-xs font-bold transition-all border ${
                activeTab === cat.id
                  ? "border-[#00ff41] bg-[#00ff4115] text-[#00ff41]"
                  : "border-[#00ff4133] text-[#00ff4166] hover:border-[#00ff4166] hover:text-[#00ff4199]"
              }`}
              onClick={() => setActiveTab(cat.id)}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* 총 배틀 수 */}
        <div className="cyber-panel rounded p-4 flex items-center justify-between">
          <span className="text-[#00ff4188] text-xs tracking-widest">
            {activeTab === "all"
              ? "TOTAL BATTLES COMPLETED"
              : `${activeCategory?.emoji} ${activeCategory?.label.toUpperCase()} BATTLES`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[#00ff41] text-2xl font-bold">
              {loading ? "—" : totalBattles.toLocaleString()}
            </span>
            {!loading && totalBattles < MIN_BATTLES_FOR_TRUST && totalBattles > 0 && (
              <span className="text-[#00ff4166] text-xs border border-[#00ff4133] rounded px-2 py-0.5">
                데이터 수집 중
              </span>
            )}
          </div>
        </div>

        {/* 리더보드 */}
        <div className="cyber-panel rounded overflow-hidden">
          <div className="border-b border-[#00ff4122] px-4 py-2 grid grid-cols-12 gap-2 text-[#00ff4155] text-xs tracking-widest">
            <span className="col-span-1">RANK</span>
            <span className="col-span-5">MODEL</span>
            <span className="col-span-2 text-right">BATTLES</span>
            <span className="col-span-2 text-right">WINS</span>
            <span className="col-span-2 text-right">WIN RATE</span>
          </div>

          {loading && (
            <div className="px-4 py-8 text-center text-[#00ff4144] text-sm">
              <span className="blink">▊</span> 데이터 로딩 중...
            </div>
          )}

          {!loading && stats.length === 0 && (
            <div className="px-4 py-8 text-center text-[#00ff4144] text-sm">
              {activeTab === "all"
                ? "아직 완료된 배틀이 없습니다"
                : `${activeCategory?.emoji} ${activeCategory?.label} 카테고리 배틀이 아직 없습니다`}
            </div>
          )}

          {!loading && stats.map((s, i) => (
            <div
              key={s.modelId}
              className="px-4 py-4 grid grid-cols-12 gap-2 items-center border-b border-[#00ff4111] last:border-0 hover:bg-[#00ff4108] transition-colors"
            >
              {/* 순위 */}
              <span className={`col-span-1 font-bold text-lg ${
                i === 0 ? "text-[#00ff41]" : i === 1 ? "text-[#00cc33]" : "text-[#00ff4155]"
              }`}>
                {i === 0 ? "◆" : i === 1 ? "◇" : `#${i + 1}`}
              </span>

              {/* 모델명 */}
              <div className="col-span-5 flex flex-col gap-0.5">
                <span className="text-[#00ff41] text-sm font-bold">
                  {MODEL_LABELS[s.modelId] ?? s.modelId}
                </span>
                <span className="text-[#00ff4155] text-xs">
                  {MODEL_PROVIDER[s.modelId] ?? ""}
                </span>
              </div>

              {/* 배틀 수 */}
              <span className="col-span-2 text-right text-[#00ff4188] text-sm">
                {s.totalBattles}
              </span>

              {/* 승 */}
              <span className="col-span-2 text-right text-[#00ff41cc] text-sm">
                {s.wins}
              </span>

              {/* 승률 바 + 숫자 */}
              <div className="col-span-2 flex flex-col items-end gap-1">
                <span className={`text-sm font-bold ${
                  i === 0 ? "text-[#00ff41]" : "text-[#00ff41aa]"
                }`}>
                  {s.winRate}%
                </span>
                <div className="w-full h-1 bg-[#00ff4115] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00ff41] rounded-full transition-all"
                    style={{ width: `${s.winRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 안내 */}
        <p className="text-[#00ff4133] text-xs text-center">
          데이터는 페이지 진입 시점 기준 · 실시간 업데이트 미지원
        </p>
      </div>
    </main>
  );
}
