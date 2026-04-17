export class AudioPlayer {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private _enabled = true;
  private _currentFreq = 0;

  get isEnabled(): boolean {
    return this._enabled;
  }
  set isEnabled(v: boolean) {
    this._enabled = v;
    if (!v) this.playTone(0);
  }

  get currentFreq(): number {
    return this._currentFreq;
  }

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.07;
    this.gain.connect(this.ctx.destination);
  }

  playTone(freq: number): void {
    this._currentFreq = freq;
    if (!this._enabled || !this.ctx || !this.gain) return;
    if (this.osc) {
      try {
        this.osc.stop();
      } catch {
        // already stopped
      }
      this.osc.disconnect();
      this.osc = null;
    }
    if (freq === 0) return;
    this.osc = this.ctx.createOscillator();
    this.osc.type = "square";
    this.osc.frequency.value = freq;
    this.osc.connect(this.gain);
    this.osc.start();
  }

  registerWasmCallbacks(): void {
    if (typeof window !== "undefined") {
      window._wasmTone = (freq: number) => this.playTone(freq);
      window._wasmMotor = () => {
        // motor duty is polled via _wasmMotorDuty()
      };
    }
  }
}

export const audioPlayer = new AudioPlayer();
