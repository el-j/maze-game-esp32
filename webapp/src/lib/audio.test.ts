import { AudioPlayer } from "./audio";

// Mock AudioContext
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockDisconnect = jest.fn();
const mockConnect = jest.fn();
const mockCreateOscillator = jest.fn(() => ({
  type: "sine" as OscillatorType,
  frequency: { value: 0 },
  connect: mockConnect,
  disconnect: mockDisconnect,
  start: mockStart,
  stop: mockStop,
}));
const mockGainConnect = jest.fn();
const mockCreateGain = jest.fn(() => ({
  gain: { value: 0 },
  connect: mockGainConnect,
}));

global.AudioContext = jest.fn(() => ({
  createOscillator: mockCreateOscillator,
  createGain: mockCreateGain,
  destination: {},
})) as unknown as typeof AudioContext;

describe("AudioPlayer", () => {
  let player: AudioPlayer;

  beforeEach(() => {
    jest.clearAllMocks();
    player = new AudioPlayer();
    player.init();
  });

  it("playTone(440) creates and starts an OscillatorNode", () => {
    player.playTone(440);
    expect(mockCreateOscillator).toHaveBeenCalled();
    expect(mockStart).toHaveBeenCalled();
    expect(player.currentFreq).toBe(440);
  });

  it("playTone(0) stops the oscillator and sets currentFreq to 0", () => {
    player.playTone(440);
    player.playTone(0);
    expect(mockStop).toHaveBeenCalled();
    expect(player.currentFreq).toBe(0);
  });

  it("isEnabled=false prevents playTone from creating oscillators", () => {
    player.isEnabled = false;
    mockCreateOscillator.mockClear();
    player.playTone(440);
    expect(mockCreateOscillator).not.toHaveBeenCalled();
  });

  it("registerWasmCallbacks sets window._wasmTone", () => {
    player.registerWasmCallbacks();
    expect(typeof window._wasmTone).toBe("function");
  });
});
