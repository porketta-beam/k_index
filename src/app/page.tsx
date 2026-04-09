import { Suspense } from "react";
import { BattleArena } from "@/components/battle/battle-arena";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;

  return (
    <div className="min-h-dvh flex flex-col">
      <Suspense fallback={null}>
        <BattleArena initialCategory={cat} />
      </Suspense>
    </div>
  );
}
