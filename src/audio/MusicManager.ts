/**
 * ============================================================
 * RaceNova V2
 * Music Manager
 * M7.1
 * ============================================================
 *
 * Responsibilities:
 * - Lightweight background race music
 * - Start / stop music
 * - Volume control
 * - Enable / disable music
 * - Mobile browser audio safety
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency beyond Web Audio API
 * - No external audio asset required
 * - Safe when AudioContext is unavailable
 * ============================================================
 */

export class MusicManager {
  private audioContext: AudioContext | null = null;

  private masterGain: GainNode | null = null;

  private oscillator: OscillatorNode | null = null;

  private enabled = true;

  private playing = false;

  private volume = 0.08;

  /**
   * Initialize the music system.
   */
  public initialize(): void {
    if (this.audioContext) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ??
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    this.audioContext =
      new AudioContextClass();

    this.masterGain =
      this.audioContext.createGain();

    this.masterGain.gain.value =
      0;

    this.masterGain.connect(
      this.audioContext.destination
    );
  }

  /**
   * Unlock audio after user interaction.
   */
  public async unlock(): Promise<void> {
    if (!this.audioContext) {
      this.initialize();
    }

    if (
      this.audioContext &&
      this.audioContext.state === "suspended"
    ) {
      await this.audioContext.resume();
    }
  }

  /**
   * Start lightweight background music.
   */
  public start(): void {
    if (!this.enabled || this.playing) {
      return;
    }

    if (!this.audioContext) {
      this.initialize();
    }

    if (
      !this.audioContext ||
      !this.masterGain
    ) {
      return;
    }

    if (
      this.audioContext.state === "suspended"
    ) {
      return;
    }

    const now =
      this.audioContext.currentTime;

    this.oscillator =
      this.audioContext.createOscillator();

    this.oscillator.type =
      "triangle";

    this.oscillator.frequency.setValueAtTime(
      110,
      now
    );

    this.oscillator.connect(
      this.masterGain
    );

    this.masterGain.gain.cancelScheduledValues(
      now
    );

    this.masterGain.gain.setValueAtTime(
      0.001,
      now
    );

    this.masterGain.gain.exponentialRampToValueAtTime(
      this.volume,
      now + 1.5
    );

    this.oscillator.start(now);

    this.playing = true;
  }

  /**
   * Stop background music.
   */
  public stop(): void {
    if (
      !this.audioContext ||
      !this.masterGain ||
      !this.oscillator
    ) {
      this.playing = false;
      return;
    }

    const now =
      this.audioContext.currentTime;

    this.masterGain.gain.cancelScheduledValues(
      now
    );

    this.masterGain.gain.setValueAtTime(
      Math.max(
        0.001,
        this.masterGain.gain.value
      ),
      now
    );

    this.masterGain.gain.exponentialRampToValueAtTime(
      0.001,
      now + 0.4
    );

    const oscillator =
      this.oscillator;

    this.oscillator = null;

    window.setTimeout(() => {
      try {
        oscillator.stop();
      } catch {
        // Oscillator may already be stopped.
      }

      oscillator.disconnect();
    }, 450);

    this.playing = false;
  }

  /**
   * Enable or disable music.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Get enabled state.
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set music volume.
   *
   * Accepted range: 0.0 - 1.0
   */
  public setVolume(volume: number): void {
    this.volume =
      Math.max(
        0,
        Math.min(1, volume)
      );

    if (
      this.masterGain &&
      this.playing
    ) {
      this.masterGain.gain.value =
        this.volume;
    }
  }

  /**
   * Get music volume.
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Get current playback state.
   */
  public isPlaying(): boolean {
    return this.playing;
  }

  /**
   * Release Web Audio resources.
   */
  public dispose(): void {
    this.stop();

    if (this.audioContext) {
      void this.audioContext.close();
    }

    this.audioContext = null;
    this.masterGain = null;
    this.oscillator = null;
    this.playing = false;
  }
}
