"use client";
import { exportConfigH, type PhysicsConfig } from "@/lib/config";
import { GameState } from "@/lib/wasm";

const STATE_LABELS: Record<number, string> = {
  [GameState.TITLE]: "TITLE",
  [GameState.PLAYING]: "PLAYING",
  [GameState.CRASHED]: "CRASHED",
  [GameState.GAMEOVER]: "GAME OVER",
  [GameState.VICTORY]: "VICTORY",
};

interface Props {
  config: PhysicsConfig;
  onConfigChange: (cfg: PhysicsConfig) => void;
  gameState: GameState;
  lives: number;
  level: number;
  noteHz: number;
  motorDuty: number;
  onReset: () => void;
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  testId: string;
  isInt?: boolean;
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  testId,
  isInt,
}: SliderProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-amber-400">
          {isInt ? String(value) : value.toFixed(3)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        data-testid={testId}
        className="w-full h-1 bg-zinc-700 rounded appearance-none cursor-pointer accent-amber-400"
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function DevHud({
  config,
  onConfigChange,
  gameState,
  lives,
  level,
  noteHz,
  motorDuty,
  onReset,
}: Props): JSX.Element {
  const handleExport = () => {
    const content = exportConfigH(config);
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "config.h";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <aside className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-w-[260px] font-mono text-sm">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <span className="text-cyan-400 font-bold text-xs tracking-widest">
          DEV HUD
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "STATE", value: STATE_LABELS[gameState] ?? "?" },
          { label: "LIVES", value: String(lives) },
          { label: "LEVEL", value: String(level + 1) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-800 rounded p-2">
            <div className="text-zinc-500 text-[10px]">{label}</div>
            <div className="text-emerald-400 text-xs font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
        Physics
      </div>
      <Slider
        label="SENSITIVITY"
        min={0.01}
        max={0.15}
        step={0.005}
        value={config.sensitivity}
        testId="slider-sensitivity"
        onChange={(v) => onConfigChange({ ...config, sensitivity: v })}
      />
      <Slider
        label="FRICTION"
        min={0.7}
        max={0.99}
        step={0.01}
        value={config.friction}
        testId="slider-friction"
        onChange={(v) => onConfigChange({ ...config, friction: v })}
      />
      <Slider
        label="DEADZONE"
        min={0.0}
        max={1.5}
        step={0.05}
        value={config.deadzone}
        testId="slider-deadzone"
        onChange={(v) => onConfigChange({ ...config, deadzone: v })}
      />
      <Slider
        label="STARTING_LIVES"
        min={1}
        max={5}
        step={1}
        value={config.startingLives}
        testId="slider-lives"
        isInt
        onChange={(v) =>
          onConfigChange({ ...config, startingLives: Math.round(v) })
        }
      />

      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">
        Output
      </div>
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-zinc-400">MOTOR</span>
          <span className="text-pink-400">{motorDuty}</span>
        </div>
        <div className="h-1.5 bg-zinc-700 rounded overflow-hidden">
          <div
            className="h-full bg-pink-500 transition-all duration-100 rounded"
            style={{ width: `${(motorDuty / 255) * 100}%` }}
          />
        </div>
      </div>
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-zinc-400">BUZZER</span>
          <span className="text-amber-400">
            {noteHz > 0 ? `${noteHz} Hz` : "silent"}
          </span>
        </div>
        <div className="h-1.5 bg-zinc-700 rounded overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-100 rounded"
            style={{ width: `${Math.min(100, (noteHz / 1400) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleExport}
          className="flex-1 text-xs border border-zinc-600 text-zinc-300 hover:border-amber-500 hover:text-amber-400 rounded px-3 py-1.5 transition-colors"
          aria-label="Export config.h"
        >
          Export config.h
        </button>
        <button
          onClick={onReset}
          className="flex-1 text-xs border border-zinc-600 text-zinc-300 hover:border-red-500 hover:text-red-400 rounded px-3 py-1.5 transition-colors"
          aria-label="Reset Game"
        >
          Reset Game
        </button>
      </div>
    </aside>
  );
}
