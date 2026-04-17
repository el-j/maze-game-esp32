import { loadGameModule, resetModuleForTesting } from "./wasm";

// Helpers
let appendSpy: jest.SpyInstance;

beforeEach(() => {
  resetModuleForTesting();
  // Reset window.MazeGame
  delete (window as Window & { MazeGame?: unknown }).MazeGame;

  appendSpy = jest
    .spyOn(document.head, "appendChild")
    .mockImplementation((node) => {
      return node;
    });
});

afterEach(() => {
  appendSpy.mockRestore();
  jest.restoreAllMocks();
});

function simulateScriptLoad(succeed: boolean) {
  const script = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement;
  if (!script) return;
  if (succeed) {
    script.onload?.(new Event("load"));
  } else {
    script.onerror?.(new Event("error"));
  }
}

describe("loadGameModule", () => {
  it("rejects when script fails to load", async () => {
    const p = loadGameModule();
    simulateScriptLoad(false);
    await expect(p).rejects.toThrow("Failed to load game.js");
  });

  it("rejects when window.MazeGame is undefined after load", async () => {
    const p = loadGameModule();
    simulateScriptLoad(true);
    await expect(p).rejects.toThrow("MazeGame not found");
  });

  it("resolves with module when window.MazeGame resolves", async () => {
    const fakeModule = { _wasmInit: jest.fn(), HEAPU8: new Uint8Array(8) };
    (window as Window & { MazeGame?: unknown }).MazeGame = jest
      .fn()
      .mockResolvedValue(fakeModule);
    const p = loadGameModule();
    simulateScriptLoad(true);
    const result = await p;
    expect(result).toBe(fakeModule);
  });

  it("returns the same promise on repeated calls (singleton)", () => {
    const p1 = loadGameModule();
    const p2 = loadGameModule();
    expect(p1).toBe(p2);
  });
});
