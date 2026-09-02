/**
 * ============================================================
 * RaceNova V2
 * Music Manager
 * M7.1 — Arcade Racing Music V2
 * ============================================================
 *
 * Responsibilities:
 * - Lightweight arcade racing background music
 * - 4/4 electronic racing rhythm
 * - Bass + synth melody + percussion
 * - Seamless repeating pattern
 * - Start / stop music
 * - Volume control
 * - Enable / disable music
 * - Mobile browser audio safety
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No external audio asset required
 * - Uses Web Audio API only
 * - Safe when AudioContext is unavailable
 * - SFX system remains independent
 * ============================================================
 */

export class MusicManager {
  private audioContext: AudioContext | null = null;

  private masterGain: GainNode | null = null;

  private musicGain: GainNode | null = null;

  private enabled = true;

  private playing = false;

  private volume = 0.08;

  private patternTimer: number | null = null;

  /**
   * Music pattern duration.
   *
   * 120 BPM:
   * - quarter note = 0.5 sec
   * - 8 quarter notes = 4 sec loop
   */
  private readonly patternDuration = 4;

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

    this.masterGain.gain.value = 0;

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
   * Start arcade racing music.
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

    this.playing = true;

    this.musicGain =
      this.audioContext.createGain();

    this.musicGain.gain.value = 0.9;

    this.musicGain.connect(
      this.masterGain
    );

    const now =
      this.audioContext.currentTime;

    this.masterGain.gain.cancelScheduledValues(
      now
    );

    this.masterGain.gain.setValueAtTime(
      0.001,
      now
    );

    this.masterGain.gain.exponentialRampToValueAtTime(
      this.volume,
      now + 0.8
    );

    this.schedulePattern(now);

    this.patternTimer =
      window.setInterval(() => {
        if (
          this.playing &&
          this.audioContext
        ) {
          this.schedulePattern(
            this.audioContext.currentTime + 0.05
          );
        }
      }, this.patternDuration * 1000);
  }

  /**
   * Schedule one complete racing music pattern.
   */
  private schedulePattern(
    startTime: number
  ): void {
    if (
      !this.audioContext ||
      !this.musicGain ||
      !this.playing
    ) {
      return;
    }

    const step =
      0.25;

    /*
     * --------------------------------------------------------
     * Bass pattern
     * --------------------------------------------------------
     */

    const bassNotes = [
      55.00,
      55.00,
      65.41,
      55.00,
      73.42,
      65.41,
      55.00,
      65.41,
      55.00,
      55.00,
      65.41,
      73.42,
      82.41,
      73.42,
      65.41,
      55.00
    ];

    for (
      let i = 0;
      i < bassNotes.length;
      i++
    ) {
      if (
        i % 2 !== 0
      ) {
        continue;
      }

      this.createBassNote(
        bassNotes[i],
        startTime + i * step,
        step * 1.7
      );
    }

    /*
     * --------------------------------------------------------
     * Synth melody
     * --------------------------------------------------------
     */

    const melody = [
      220.00,
      261.63,
      293.66,
      261.63,
      329.63,
      293.66,
      261.63,
      220.00,
      246.94,
      293.66,
      329.63,
      293.66,
      369.99,
      329.63,
      293.66,
      246.94
    ];

    for (
      let i = 0;
      i < melody.length;
      i++
    ) {
      this.createLeadNote(
        melody[i],
        startTime + i * step,
        step * 0.75
      );
    }

    /*
     * --------------------------------------------------------
     * Kick
     * --------------------------------------------------------
     */

    for (
      let i = 0;
      i < 8;
      i++
    ) {
      this.createKick(
        startTime + i * 0.5
      );
    }

    /*
     * --------------------------------------------------------
     * Snare
     * --------------------------------------------------------
     */

    for (
      let i = 1;
      i < 8;
      i += 2
    ) {
      this.createSnare(
        startTime + i * 0.5
      );
    }

    /*
     * --------------------------------------------------------
     * Hi-hat
     * --------------------------------------------------------
     */

    for (
      let i = 0;
      i < 16;
      i++
    ) {
      this.createHiHat(
        startTime + i * step
      );
    }
  }

  /**
   * Create bass note.
   */
  private createBassNote(
    frequency: number,
    startTime: number,
    duration: number
  ): void {
    if (
      !this.audioContext ||
      !this.musicGain
    ) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    oscillator.type =
      "sawtooth";

    oscillator.frequency.setValueAtTime(
      frequency,
      startTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.20,
      startTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(
      startTime + duration + 0.05
    );
  }

  /**
   * Create lead synth note.
   */
  private createLeadNote(
    frequency: number,
    startTime: number,
    duration: number
  ): void {
    if (
      !this.audioContext ||
      !this.musicGain
    ) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    oscillator.type =
      "triangle";

    oscillator.frequency.setValueAtTime(
      frequency,
      startTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.055,
      startTime + 0.025
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + duration
    );

    oscillator.connect(gain);
    gain.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(
      startTime + duration + 0.05
    );
  }

  /**
   * Create kick drum.
   */
  private createKick(
    startTime: number
  ): void {
    if (
      !this.audioContext ||
      !this.musicGain
    ) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    oscillator.type =
      "sine";

    oscillator.frequency.setValueAtTime(
      120,
      startTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      48,
      startTime + 0.12
    );

    gain.gain.setValueAtTime(
      0.22,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + 0.16
    );

    oscillator.connect(gain);
    gain.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(
      startTime + 0.18
    );
  }

  /**
   * Create snare.
   *
   * Uses a short noise-like oscillator texture.
   */
  private createSnare(
    startTime: number
  ): void {
    if (
      !this.audioContext ||
      !this.musicGain
    ) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    oscillator.type =
      "square";

    oscillator.frequency.setValueAtTime(
      180,
      startTime
    );

    gain.gain.setValueAtTime(
      0.045,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + 0.09
    );

    oscillator.connect(gain);
    gain.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(
      startTime + 0.1
    );
  }

  /**
   * Create lightweight hi-hat.
   */
  private createHiHat(
    startTime: number
  ): void {
    if (
      !this.audioContext ||
      !this.musicGain
    ) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    oscillator.type =
      "square";

    oscillator.frequency.setValueAtTime(
      3200,
      startTime
    );

    gain.gain.setValueAtTime(
      0.012,
      startTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startTime + 0.035
    );

    oscillator.connect(gain);
    gain.connect(this.musicGain);

    oscillator.start(startTime);
    oscillator.stop(
      startTime + 0.04
    );
  }

  /**
   * Stop background music.
   */
  public stop(): void {
    if (this.patternTimer !== null) {
      window.clearInterval(
        this.patternTimer
      );

      this.patternTimer = null;
    }

    if (
      !this.audioContext ||
      !this.masterGain
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

    const musicGain =
      this.musicGain;

    this.musicGain = null;

    window.setTimeout(() => {
      try {
        musicGain?.disconnect();
      } catch {
        // Music gain may already be disconnected.
      }
    }, 450);

    this.playing = false;
  }

  /**
   * Enable or disable music.
   */
  public setEnabled(
    enabled: boolean
  ): void {
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
  public setVolume(
    volume: number
  ): void {
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
    this.musicGain = null;

    this.patternTimer = null;

    this.playing = false;
  }
}
