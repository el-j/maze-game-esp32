import { renderHook, act } from "@testing-library/react";
import { useAudio } from "./useAudio";
import { audioPlayer } from "@/lib/audio";

jest.mock("@/lib/audio", () => {
  const player = {
    _enabled: true,
    get isEnabled() { return this._enabled; },
    set isEnabled(v: boolean) { this._enabled = v; },
    init: jest.fn(),
    playTone: jest.fn(),
    registerWasmCallbacks: jest.fn(),
    get currentFreq() { return 0; },
  };
  return { audioPlayer: player };
});

describe("useAudio", () => {
  beforeEach(() => {
    (audioPlayer as unknown as { _enabled: boolean })._enabled = true;
    jest.clearAllMocks();
  });

  it("returns enabled: true initially", () => {
    const { result } = renderHook(() => useAudio());
    expect(result.current.enabled).toBe(true);
  });

  it("toggle() sets enabled: false", () => {
    const { result } = renderHook(() => useAudio());
    act(() => { result.current.toggle(); });
    expect(result.current.enabled).toBe(false);
  });

  it("toggle() twice returns to enabled: true", () => {
    const { result } = renderHook(() => useAudio());
    act(() => { result.current.toggle(); });
    act(() => { result.current.toggle(); });
    expect(result.current.enabled).toBe(true);
  });
});
