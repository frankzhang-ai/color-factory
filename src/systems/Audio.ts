export class AudioSystem {
  enabled: boolean;
  private context: AudioContext | null = null;
  lastPitch: number | null = null;
  constructor(enabled = true) { this.enabled = enabled; }
  unlock(): void {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended')
        void this.context.resume();
      const buffer = this.context.createBuffer(1, 1, this.context.sampleRate);
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.context.destination);
      source.start();
    }
    catch { /* Audio may be unavailable in embedded browsers. */ }
  }
  tone(kind: 'good' | 'bad' = 'good', combo = 0): void {
    this.unlock();
    if (!this.enabled || !this.context)
      return;
    try {
      const notes = kind === 'good' ? [523.25 * Math.pow(2,Math.min(combo,24)/12), 659.25 * Math.pow(2,Math.min(combo,24)/12)] : [190, 145];
      this.lastPitch=notes[0];
      notes.forEach((frequency, index) => {
        const oscillator = this.context!.createOscillator();
        const gain = this.context!.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        const start = this.context!.currentTime + index * (kind === 'good' ? .075 : .025);
        gain.gain.setValueAtTime(kind === 'good' ? 0.055 : 0.035, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + .12);
        oscillator.connect(gain); gain.connect(this.context!.destination);
        oscillator.start(start); oscillator.stop(start + .13);
      });
    }
    catch { /* Ignore audio device errors. */ }
  }
}
