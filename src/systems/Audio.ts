export class AudioSystem {
  enabled: boolean;
  private context: AudioContext | null = null;
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
  tone(kind: 'good' | 'bad' = 'good'): void {
    if (!this.enabled)
      return;
    this.unlock();
    if (!this.context)
      return;
    try {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(kind === 'good' ? 650 : 180, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(kind === 'good' ? 980 : 120, this.context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.14);
      oscillator.connect(gain);
      gain.connect(this.context.destination);
      oscillator.start();
      oscillator.stop(this.context.currentTime + 0.15);
    }
    catch { /* Ignore audio device errors. */ }
  }
}
