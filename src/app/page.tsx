import { Suspense } from "react";
import { BattleArena } from "@/components/battle/battle-arena";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const { cat } = await searchParams;

  return (
    <main className="flex-1">
      <Suspense fallback={null}>
        <BattleArena initialCategory={cat} />
      </Suspense>
    </main>
  );
}
