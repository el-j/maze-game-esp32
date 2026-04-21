export enum GameState {
  TITLE = 0,
  PLAYING = 1,
  CRASHED = 2,
  GAMEOVER = 3,
  VICTORY = 4,
  LEVELUP = 5,
}

export interface GameModule {
  _wasmInit(): void;
  _wasmTick(): void;
  _wasmSetTiltExport(ax: number, ay: number): void;
  _wasmSetButton(pressed: number): void;
  _wasmGetDisplay(ptr: number): void;
  _wasmNoteHz(): number;
  _wasmMotorDuty(): number;
  _wasmGetState(): number;
  _wasmGetLives(): number;
  _wasmGetLevel(): number;
  _wasmSetSensitivity(v: number): void;
  _wasmSetFriction(v: number): void;
  _wasmSetDeadzone(v: number): void;
  _wasmSetStartingLives(v: number): void;
  _wasmResetGame(): void;
  _malloc(size: number): number;
  _free(ptr: number): void;
  HEAPU8: Uint8Array;
}

declare global {
  interface Window {
    MazeGame?: (opts: {
      locateFile: (path: string) => string;
    }) => Promise<GameModule>;
    _wasmTone?: (freq: number) => void;
    _wasmMotor?: (duty: number) => void;
  }
}

let _promise: Promise<GameModule> | null = null;

export function loadGameModule(): Promise<GameModule> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Browser only"));
  }
  if (_promise) return _promise;
  _promise = new Promise<GameModule>((resolve, reject) => {
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    const script = document.createElement("script");
    script.src = `${base}/game.js`;
    script.onload = () => {
      if (!window.MazeGame) {
        reject(new Error("MazeGame not found after script load"));
        return;
      }
      window
        .MazeGame({ locateFile: (p: string) => `${base}/${p}` })
        .then(resolve)
        .catch(reject);
    };
    script.onerror = () => reject(new Error("Failed to load game.js"));
    document.head.appendChild(script);
  });
  return _promise;
}

/** Reset singleton – for testing only */
export function resetModuleForTesting(): void {
  _promise = null;
}
