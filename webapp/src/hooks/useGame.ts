"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { audioPlayer } from "@/lib/audio";
import { type PhysicsConfig } from "@/lib/config";
import { GameState, loadGameModule, type GameModule } from "@/lib/wasm";
import type { InputState } from "./useInput";

export type LoadState = "loading" | "ready" | "error";

export interface GameHookResult {
  loadState: LoadState;
  displayBuffer: Uint8Array | null;
  gameState: GameState;
  lives: number;
  level: number;
  noteHz: number;
  motorDuty: number;
  setConfig: (cfg: Partial<PhysicsConfig>) => void;
  resetGame: () => void;
}

const TICK_MS = 20;

export function useGame(
  input: InputState,
  config: PhysicsConfig
): GameHookResult {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [displayBuffer, setDisplayBuffer] = useState<Uint8Array | null>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.TITLE);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(0);
  const [noteHz, setNoteHz] = useState(0);
  const [motorDuty, setMotorDuty] = useState(0);

  const moduleRef = useRef<GameModule | null>(null);
  const ptrRef = useRef<number>(0);
  const inputRef = useRef(input);
  const configRef = useRef(config);
  inputRef.current = input;
  configRef.current = config;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    audioPlayer.init();
    audioPlayer.registerWasmCallbacks();

    loadGameModule()
      .then((m) => {
        moduleRef.current = m;
        ptrRef.current = m._malloc(8);
        m._wasmInit();
        setLoadState("ready");

        interval = setInterval(() => {
          const { ax, ay, btn } = inputRef.current;
          m._wasmSetTiltExport(ax, ay);
          m._wasmSetButton(btn ? 1 : 0);
          m._wasmTick();
          m._wasmGetDisplay(ptrRef.current);
          const slice = m.HEAPU8.slice(ptrRef.current, ptrRef.current + 8);
          setDisplayBuffer(slice);
          setGameState(m._wasmGetState() as GameState);
          setLives(m._wasmGetLives());
          setLevel(m._wasmGetLevel());
          setNoteHz(m._wasmNoteHz());
          setMotorDuty(m._wasmMotorDuty());
        }, TICK_MS);
      })
      .catch(() => setLoadState("error"));

    return () => {
      if (interval !== undefined) clearInterval(interval);
      if (moduleRef.current && ptrRef.current) {
        moduleRef.current._free(ptrRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setConfig = useCallback((partial: Partial<PhysicsConfig>) => {
    const m = moduleRef.current;
    if (!m) return;
    if (partial.sensitivity !== undefined) m._wasmSetSensitivity(partial.sensitivity);
    if (partial.friction !== undefined) m._wasmSetFriction(partial.friction);
    if (partial.deadzone !== undefined) m._wasmSetDeadzone(partial.deadzone);
    if (partial.startingLives !== undefined)
      m._wasmSetStartingLives(partial.startingLives);
  }, []);

  const resetGame = useCallback(() => {
    moduleRef.current?._wasmResetGame();
  }, []);

  return {
    loadState,
    displayBuffer,
    gameState,
    lives,
    level,
    noteHz,
    motorDuty,
    setConfig,
    resetGame,
  };
}
