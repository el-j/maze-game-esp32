import { renderHook, act, waitFor } from "@testing-library/react";
import { useGame } from "./useGame";
import { loadGameModule } from "@/lib/wasm";
import { DEFAULT_CONFIG } from "@/lib/config";
import type { InputState } from "./useInput";

jest.mock("@/lib/wasm", () => ({
  GameState: { TITLE: 0, PLAYING: 1, CRASHED: 2, GAMEOVER: 3, VICTORY: 4 },
  loadGameModule: jest.fn().mockResolvedValue({
    _malloc: jest.fn().mockReturnValue(0),
    _free: jest.fn(),
    _wasmInit: jest.fn(),
    _wasmTick: jest.fn(),
    _wasmSetTiltExport: jest.fn(),
    _wasmSetButton: jest.fn(),
    _wasmGetDisplay: jest.fn(),
    _wasmNoteHz: jest.fn().mockReturnValue(0),
    _wasmMotorDuty: jest.fn().mockReturnValue(0),
    _wasmGetState: jest.fn().mockReturnValue(0),
    _wasmGetLives: jest.fn().mockReturnValue(3),
    _wasmGetLevel: jest.fn().mockReturnValue(0),
    _wasmSetSensitivity: jest.fn(),
    _wasmSetFriction: jest.fn(),
    _wasmSetDeadzone: jest.fn(),
    _wasmSetStartingLives: jest.fn(),
    _wasmResetGame: jest.fn(),
    HEAPU8: new Uint8Array(1024),
  }),
}));

jest.mock("@/lib/audio", () => ({
  audioPlayer: {
    init: jest.fn(),
    registerWasmCallbacks: jest.fn(),
    isEnabled: true,
  },
}));

const defaultInput: InputState = {
  ax: 0,
  ay: 0,
  btn: false,
  dpad: { up: false, down: false, left: false, right: false },
};

async function getResolvedModule() {
  const mod = await (loadGameModule as jest.Mock).mock.results[0]?.value;
  return mod;
}

describe("useGame", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("initial loadState is 'loading'", async () => {
    const { result } = renderHook(() => useGame(defaultInput, DEFAULT_CONFIG));
    expect(result.current.loadState).toBe("loading");
    // Flush pending microtasks so the promise resolution is wrapped in act()
    // and doesn't produce an "not wrapped in act()" warning.
    await act(async () => {});
  });

  it("after loadGameModule resolves, loadState is 'ready'", async () => {
    const { result } = renderHook(() => useGame(defaultInput, DEFAULT_CONFIG));
    await waitFor(() => {
      expect(result.current.loadState).toBe("ready");
    });
  });

  it("resetGame() calls _wasmResetGame", async () => {
    const { result } = renderHook(() => useGame(defaultInput, DEFAULT_CONFIG));
    await waitFor(() => expect(result.current.loadState).toBe("ready"));
    act(() => { result.current.resetGame(); });
    const m = await getResolvedModule();
    expect(m._wasmResetGame).toHaveBeenCalled();
  });

  it("setConfig({sensitivity: 0.08}) calls _wasmSetSensitivity(0.08)", async () => {
    const { result } = renderHook(() => useGame(defaultInput, DEFAULT_CONFIG));
    await waitFor(() => expect(result.current.loadState).toBe("ready"));
    act(() => { result.current.setConfig({ sensitivity: 0.08 }); });
    const m = await getResolvedModule();
    expect(m._wasmSetSensitivity).toHaveBeenCalledWith(0.08);
  });
});
