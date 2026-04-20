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
  /** Reset the game and immediately advance to PLAYING state. */
  startGame: () => void;
}

/** Fixed physics step size in milliseconds – matches the hardware 50 Hz loop. */
export const TICK_MS = 20;

/**
 * Maximum physics steps executed per animation frame.
 *
 * Browsers throttle `requestAnimationFrame` while a tab is hidden and resume
 * it when the tab becomes visible again.  Without a cap, the first frame after
 * a long absence would accumulate hundreds of physics ticks (the ball would
 * teleport across the maze).  Five steps cap the burst to 100 ms worth of
 * catch-up – enough to stay smooth while preventing runaway simulation.
 */
const MAX_TICKS_PER_FRAME = 5;

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
    // rafId = 0 is an invalid handle; cancelAnimationFrame(0) is a safe no-op.
    let rafId = 0;
    let mounted = true;
    // Timestamp of the previous animation frame (null until first frame fires).
    let lastTime: number | null = null;
    // Accumulated unprocessed time in milliseconds.
    let accumulator = 0;

    audioPlayer.init();
    audioPlayer.registerWasmCallbacks();

    loadGameModule()
      .then((m) => {
        if (!mounted) return;
        moduleRef.current = m;
        ptrRef.current = m._malloc(8);
        m._wasmInit();
        setLoadState("ready");

        /**
         * Animation-frame callback that drives the fixed-step physics loop.
         *
         * Using requestAnimationFrame instead of setInterval solves two problems:
         *  1. setInterval continues to queue callbacks when the browser tab is
         *     hidden (throttled to ~1 Hz) and fires them all in a burst when the
         *     tab regains focus, running dozens of physics ticks back-to-back and
         *     making the game run at 10–50× normal speed.
         *  2. setInterval does not align with the display refresh cycle, causing
         *     visible tearing on high-refresh-rate monitors.
         *
         * With rAF the browser pauses callbacks entirely while the tab is hidden
         * and resumes at the normal rate when it becomes visible again.  The
         * MAX_TICKS_PER_FRAME cap prevents a burst of catch-up ticks on resume.
         */
        const frame = (timestamp: number) => {
          if (!mounted) return;

          if (lastTime === null) {
            // First frame: initialise lastTime without running any ticks.
            lastTime = timestamp;
            rafId = requestAnimationFrame(frame);
            return;
          }

          const elapsed = timestamp - lastTime;
          lastTime = timestamp;

          // Accumulate elapsed real time; cap to prevent spiral-of-death after
          // background throttling or heavy CPU load.
          accumulator += elapsed;
          if (accumulator > TICK_MS * MAX_TICKS_PER_FRAME) {
            accumulator = TICK_MS * MAX_TICKS_PER_FRAME;
          }

          // Run as many fixed physics steps as the elapsed time demands.
          const { ax, ay, btn } = inputRef.current;
          let ticked = false;
          while (accumulator >= TICK_MS) {
            m._wasmSetTiltExport(ax, ay);
            m._wasmSetButton(btn ? 1 : 0);
            m._wasmTick();
            accumulator -= TICK_MS;
            ticked = true;
          }

          // Read display and diagnostic state only when at least one tick ran.
          if (ticked) {
            m._wasmGetDisplay(ptrRef.current);
            const slice = m.HEAPU8.slice(ptrRef.current, ptrRef.current + 8);
            setDisplayBuffer(slice);
            setGameState(m._wasmGetState() as GameState);
            setLives(m._wasmGetLives());
            setLevel(m._wasmGetLevel());
            setNoteHz(m._wasmNoteHz());
            setMotorDuty(m._wasmMotorDuty());
          }

          rafId = requestAnimationFrame(frame);
        };

        rafId = requestAnimationFrame(frame);
      })
      .catch(() => {
        if (mounted) setLoadState("error");
      });

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
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

  const startGame = useCallback(() => {
    const m = moduleRef.current;
    if (!m) return;
    m._wasmResetGame();   // → TITLE state
    m._wasmSetButton(1);  // press the start button
    m._wasmTick();        // → PLAYING state
    m._wasmSetButton(0);  // release
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
    startGame,
  };
}
