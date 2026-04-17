import type { JSX } from "react";
import dynamic from "next/dynamic";

const GameSectionClient = dynamic(() => import("./GameSectionClient"), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-6 py-16">
      <div className="text-amber-400 font-mono animate-pulse">Loading…</div>
    </div>
  ),
});

export default function GameSection({ id }: { id?: string }): JSX.Element {
  return (
    <section id={id} className="bg-zinc-950">
      <GameSectionClient />
    </section>
  );
}
