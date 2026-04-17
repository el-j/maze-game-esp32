import dynamic from "next/dynamic";
import BuildGuide from "@/components/BuildGuide/BuildGuide";
import Hero from "@/components/Hero/Hero";
import HowItWorks from "@/components/HowItWorks/HowItWorks";
import Nav from "@/components/Nav/Nav";
import WiringReference from "@/components/WiringReference/WiringReference";

const GameSection = dynamic(
  () => import("@/components/GameSection/GameSection"),
  { ssr: false }
);

export default function Home(): JSX.Element {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <GameSection id="play" />
        <HowItWorks id="how-it-works" />
        <BuildGuide id="build" />
        <WiringReference id="wiring" />
      </main>
      <footer className="bg-zinc-950 border-t border-zinc-800 py-8">
        <div className="container mx-auto px-6 text-center text-zinc-500 text-sm font-mono">
          <p>
            maze-game-esp32 — MIT licence —{" "}
            <a
              href="https://github.com/el-j/maze-game-esp32"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              github.com/el-j/maze-game-esp32
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
