"use client";
import type { JSX } from "react";
import { useState, useEffect, useCallback } from "react";
import DevHud from "@/components/DevHud/DevHud";
import MatrixDisplay from "@/components/MatrixDisplay/MatrixDisplay";
import { DEFAULT_CONFIG, type PhysicsConfig } from "@/lib/config";
import { useAudio } from "@/hooks/useAudio";
import { useGame } from "@/hooks/useGame";
import { useInput } from "@/hooks/useInput";
import type { DpadState } from "@/hooks/useInput";
import { GameState } from "@/lib/wasm";

const STATE_LABELS: Record<number, string> = {
  [GameState.TITLE]: "TITLE",
  [GameState.PLAYING]: "PLAYING",
  [GameState.CRASHED]: "CRASHED",
  [GameState.GAMEOVER]: "GAME OVER",
  [GameState.VICTORY]: "VICTORY",
};

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

function DpadGrid({
  onDpad,
  btnSize = "w-16 h-16",
}: {
  onDpad: (dir: keyof DpadState, pressed: boolean) => void;
  btnSize?: string;
}): JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      {DPAD_BUTTONS.map(({ dir, label, col }) => (
        <button
          key={dir}
          className={`${col} ${btnSize} bg-zinc-800 border border-zinc-700 rounded-xl text-xl text-zinc-200 active:bg-zinc-600 select-none touch-none`}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            onDpad(dir, true);
          }}
          onPointerUp={() => onDpad(dir, false)}
          onPointerLeave={() => onDpad(dir, false)}
          onPointerCancel={() => onDpad(dir, false)}
          aria-label={`Tilt ${dir}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function StartButton({
  onBtn,
  className = "",
}: {
  onBtn: (pressed: boolean) => void;
  className?: string;
}): JSX.Element {
  return (
    <button
      className={`border border-amber-500 text-amber-400 rounded-xl text-sm font-mono font-bold active:bg-amber-900/40 select-none touch-none bg-amber-900/20 ${className}`}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onBtn(true);
      }}
      onPointerUp={() => onBtn(false)}
      onPointerLeave={() => onBtn(false)}
      onPointerCancel={() => onBtn(false)}
      aria-label="Press start"
    >
      ▶ START / SPACE
    </button>
  );
}

function PlayPrompt({
  gameState,
  loadState,
  onStart,
}: {
  gameState: GameState;
  loadState: "loading" | "ready" | "error";
  onStart: () => void;
}): JSX.Element | null {
  if (loadState !== "ready") return null;
  if (gameState === GameState.PLAYING || gameState === GameState.CRASHED)
    return null;

  if (gameState === GameState.GAMEOVER || gameState === GameState.VICTORY) {
    return (
      <button
        onClick={onStart}
        aria-label="Play Again"
        className="w-full max-w-[344px] py-2.5 border border-amber-500 text-amber-400 rounded-xl text-sm font-mono font-bold bg-amber-900/20 active:bg-amber-900/40 transition-colors hover:border-amber-400"
      >
        {gameState === GameState.VICTORY ? "🏆 Play Again" : "▶ Play Again"}
      </button>
    );
  }

  // TITLE state – hint so users know how to start
  return (
    <p className="text-zinc-400 text-xs font-mono text-center">
      ▶ Press <span className="border border-zinc-600 rounded px-1">SPACE</span>{" "}
      or{" "}
      <span className="border border-zinc-600 rounded px-1">START</span> to play
    </p>
  );
}

export default function GameSectionClient(): JSX.Element {
  const [config, setConfig] = useState<PhysicsConfig>(DEFAULT_CONFIG);
  const [fullscreen, setFullscreen] = useState(false);
  const [devHudOpen, setDevHudOpen] = useState(false);
  const [motionPermission, setMotionPermission] = useState<
    "unknown" | "granted" | "denied" | "not-required"
  >("unknown");

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
    startGame,
  } = useGame(input, config);

  const handleConfigChange = (cfg: PhysicsConfig) => {
    setConfig(cfg);
    pushConfig(cfg);
  };

  // Detect whether iOS motion permission is needed
  useEffect(() => {
    const DevOrient = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DevOrient.requestPermission === "function") {
      setMotionPermission("unknown");
    } else {
      setMotionPermission("not-required");
    }
  }, []);

  const requestMotionPermission = useCallback(async () => {
    try {
      const DevOrient = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>;
      };
      if (typeof DevOrient.requestPermission === "function") {
        const res = await DevOrient.requestPermission();
        setMotionPermission(res === "granted" ? "granted" : "denied");
      }
    } catch {
      setMotionPermission("denied");
    }
  }, []);

  // Lock orientation when entering fullscreen; unlock on exit
  useEffect(() => {
    if (fullscreen) {
      (
        screen.orientation as ScreenOrientation & {
          lock?: (
            o: "landscape" | "landscape-primary" | "landscape-secondary"
          ) => Promise<void>;
        }
      )
        .lock?.("landscape")
        .catch(() => {});
    } else {
      (screen.orientation as ScreenOrientation & { unlock?: () => void }).unlock?.();
    }
  }, [fullscreen]);

  // Escape key exits fullscreen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Fullscreen overlay ──────────────────────────────────────────────────────
  if (fullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 bg-zinc-950 flex flex-col"
        style={{ touchAction: "none" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 shrink-0">
          <button
            onClick={toggleAudio}
            className={`text-xs font-mono border rounded px-3 py-1.5 transition-colors ${
              audioEnabled
                ? "border-amber-500 text-amber-400"
                : "border-zinc-600 text-zinc-500"
            }`}
            aria-label={audioEnabled ? "Mute audio" : "Unmute audio"}
          >
            {audioEnabled ? "🔊" : "🔇"}
          </button>
          <span className="text-xs text-zinc-400 font-mono">
            {STATE_LABELS[gameState] ?? "?"} · ❤ {lives} · Lvl {level + 1}
          </span>
          <button
            onClick={() => setFullscreen(false)}
            className="text-zinc-400 border border-zinc-700 rounded px-3 py-1.5 text-xs font-mono transition-colors hover:border-zinc-500"
            aria-label="Exit full screen"
          >
            ✕ Exit
          </button>
        </div>

        {/* Canvas area – fills remaining space, keeps square */}
        <div className="flex-1 flex items-center justify-center p-2 min-h-0">
          <div
            className="relative"
            style={{
              width: "min(80vmin, 100%)",
              aspectRatio: "1",
            }}
          >
            {loadState === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 z-10 rounded-xl">
                <div className="text-amber-400 font-mono text-sm animate-pulse">
                  Loading WASM…
                </div>
              </div>
            )}
            {loadState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-10 rounded-xl gap-2">
                <div className="text-red-400 font-mono text-sm">
                  WASM unavailable
                </div>
                <div className="text-zinc-500 text-xs text-center max-w-[200px]">
                  Requires GitHub Pages or a local server.
                </div>
              </div>
            )}
            <MatrixDisplay
              buffer={displayBuffer}
              size={320}
              className="w-full h-full rounded-xl"
            />
          </div>
        </div>

        {/* Controls at bottom */}
        <div className="shrink-0 flex flex-col items-center gap-3 px-4 pb-4 pt-2">
          {motionPermission === "unknown" && (
            <button
              onClick={requestMotionPermission}
              className="text-xs border border-cyan-600 text-cyan-400 rounded-lg px-4 py-2 font-mono"
            >
              🎮 Enable Tilt Control
            </button>
          )}
          <PlayPrompt
            gameState={gameState}
            loadState={loadState}
            onStart={startGame}
          />
          <DpadGrid onDpad={input.setDpad} btnSize="w-14 h-14" />
          <StartButton onBtn={input.setBtn} className="w-full max-w-[200px] py-3" />
        </div>
      </div>
    );
  }

  // ── Normal page layout ──────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-6 py-16">
      <h2 className="text-3xl font-bold mb-2 text-zinc-100">Play in Browser</h2>
      <p className="text-zinc-400 mb-8 text-lg">
        The exact C++ firmware compiled to WebAssembly — same physics, same
        levels, same sounds.
      </p>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex flex-col items-center gap-4 w-full lg:w-auto">
          {/* Canvas */}
          <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 p-3 shadow-[0_0_40px_rgba(255,136,0,0.12)] w-full max-w-[344px]">
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
            <MatrixDisplay
              buffer={displayBuffer}
              size={320}
              className="w-full h-auto"
            />
          </div>

          {/* Play / restart prompt */}
          <PlayPrompt
            gameState={gameState}
            loadState={loadState}
            onStart={startGame}
          />

          {/* Keyboard hints – desktop only */}
          <div className="hidden md:flex flex-wrap gap-1.5 justify-center text-xs text-zinc-500 font-mono max-w-xs">
            {["↑ W", "↓ S", "← A", "→ D", "SPACE = start"].map((k) => (
              <span
                key={k}
                className="border border-zinc-700 rounded px-1.5 py-0.5"
              >
                {k}
              </span>
            ))}
          </div>

          {/* Audio + Fullscreen row */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
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
            <button
              onClick={() => setFullscreen(true)}
              className="text-xs font-mono border border-zinc-600 text-zinc-400 rounded px-3 py-1.5 transition-colors hover:border-zinc-400 hover:text-zinc-200"
              aria-label="Enter full screen game mode"
            >
              ⛶ Full Screen
            </button>
          </div>

          {/* iOS tilt permission */}
          {motionPermission === "unknown" && (
            <button
              onClick={requestMotionPermission}
              className="text-xs border border-cyan-600 text-cyan-400 rounded-lg px-4 py-2 font-mono"
              aria-label="Enable tilt control"
            >
              🎮 Enable Tilt Control
            </button>
          )}

          {/* Touch D-pad – mobile/tablet only */}
          <div className="lg:hidden flex flex-col items-center gap-3">
            <DpadGrid onDpad={input.setDpad} />
            <StartButton
              onBtn={input.setBtn}
              className="w-full max-w-[220px] py-3"
            />
          </div>
        </div>

        {/* DevHud – collapsible on mobile */}
        <div className="w-full lg:w-auto">
          <button
            className="lg:hidden w-full flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 mb-1 text-xs font-mono text-zinc-400"
            onClick={() => setDevHudOpen((o) => !o)}
            aria-expanded={devHudOpen}
            aria-controls="dev-hud-panel"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
              <span className="text-cyan-400 font-bold tracking-widest">
                DEV HUD
              </span>
            </span>
            <span>{devHudOpen ? "▲" : "▼"}</span>
          </button>
          <div
            id="dev-hud-panel"
            className={`${devHudOpen ? "block" : "hidden"} lg:block`}
          >
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
      </div>
    </div>
  );
}
