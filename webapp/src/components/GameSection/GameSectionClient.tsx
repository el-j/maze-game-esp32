"use client";
import type { JSX } from "react";
import { useState } from "react";
import DevHud from "@/components/DevHud/DevHud";
import MatrixDisplay from "@/components/MatrixDisplay/MatrixDisplay";
import { DEFAULT_CONFIG, type PhysicsConfig } from "@/lib/config";
import { useAudio } from "@/hooks/useAudio";
import { useGame } from "@/hooks/useGame";
import { useInput } from "@/hooks/useInput";
import type { DpadState } from "@/hooks/useInput";

const DPAD_BUTTONS: Array<{
  dir: keyof DpadState;
  label: string;
  col: string;
}> = [
  { dir: "up", label: "↑", col: "col-start-2" },
  { dir: "left", label: "←", col: "col-start-1" },
  { dir: "right", label: "→", col: "col-start-3" },
  { dir: "down", label: "↓", col: "col-start-2" },
];

export default function GameSectionClient(): JSX.Element {
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_CONFIG);
  const input = useInput();
  const { enabled: audioEnabled, toggle: toggleAudio } = useAudio();
  const {
    loadState,
    displayBuffer,
    gameState,
    lives,
    level,
    noteHz,
    motorDuty,
    setConfig: pushConfig,
    resetGame,
  } = useGame(input, config);

  const handleConfigChange = (cfg: PhysicsConfig) => {
    setConfig(cfg);
    pushConfig(cfg);
  };

  return (
    <div className="container mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold mb-2 text-zinc-100">Play in Browser</h2>
      <p className="text-zinc-400 mb-8 text-lg">
        The exact C++ firmware compiled to WebAssembly — same physics, same
        levels, same sounds.
      </p>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-4">
          <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 p-3 shadow-[0_0_40px_rgba(255,136,0,0.12)]">
            {loadState === "loading" && (
              <div
                data-testid="loading-indicator"
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-950/90 z-10"
              >
                <div className="text-amber-400 font-mono text-sm animate-pulse">
                  Loading WASM…
                </div>
              </div>
            )}
            {loadState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-zinc-950/90 z-10 gap-2">
                <div className="text-red-400 font-mono text-sm">
                  WASM unavailable
                </div>
                <div className="text-zinc-500 text-xs text-center max-w-[240px]">
                  Requires GitHub Pages or a local server.
                </div>
              </div>
            )}
            <MatrixDisplay buffer={displayBuffer} size={320} />
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center text-xs text-zinc-500 font-mono max-w-xs">
            {["↑ W", "↓ S", "← A", "→ D", "SPACE = start"].map((k) => (
              <span
                key={k}
                className="border border-zinc-700 rounded px-1.5 py-0.5"
              >
                {k}
              </span>
            ))}
          </div>

          <button
            onClick={toggleAudio}
            className={`text-xs font-mono border rounded px-3 py-1.5 transition-colors ${
              audioEnabled
                ? "border-amber-500 text-amber-400"
                : "border-zinc-600 text-zinc-500"
            }`}
            aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
          >
            {audioEnabled ? "🔊 Audio ON" : "🔇 Audio OFF"}
          </button>

          <div className="grid grid-cols-3 gap-1 lg:hidden">
            {DPAD_BUTTONS.map(({ dir, label, col }) => (
              <button
                key={dir}
                className={`${col} w-12 h-12 bg-zinc-800 border border-zinc-700 rounded-lg text-lg text-zinc-200 active:bg-zinc-700 select-none`}
                onPointerDown={() => input.setDpad(dir, true)}
                onPointerUp={() => input.setDpad(dir, false)}
                onPointerLeave={() => input.setDpad(dir, false)}
                aria-label={`Tilt ${dir}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <DevHud
          config={config}
          onConfigChange={handleConfigChange}
          gameState={gameState}
          lives={lives}
          level={level}
          noteHz={noteHz}
          motorDuty={motorDuty}
          onReset={resetGame}
        />
      </div>
    </div>
  );
}
