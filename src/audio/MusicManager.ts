/**
 * ============================================================
 * RaceNova V2
 * Music Manager
 * M7.1 — Arcade Racing Music
 * ============================================================
 *
 * Responsibilities:
 * - Lightweight background race music
 * - Energetic arcade racing loop
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

  private musicGain: GainNode | null = null;

  private bassOscillator: OscillatorNode | null = null;

  private leadOscillator: OscillatorNode | null = null;

  private bassGain: GainNode | null = null;

  private leadGain: GainNode | null = null;

  private lfoOscillator: OscillatorNode | null = null;

  private lfoGain: GainNode | null = null;

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
   * Start energetic arcade racing music.
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

    /*
     * --------------------------------------------------------
     * Music routing
     * --------------------------------------------------------
     */

    this.musicGain =
      this.audioContext.createGain();

    this.musicGain.gain.value = 0.85;

    this.musicGain.connect(
      this.masterGain
    );

    /*
     * --------------------------------------------------------
     * Bass
     * --------------------------------------------------------
     */

    this.bassGain =
      this.audioContext.createGain();

    this.bassGain.gain.value = 0.30;

    this.bassGain.connect(
      this.musicGain
    );

    this.bassOscillator =
      this.audioContext.createOscillator();

    this.bassOscillator.type =
      "sawtooth";

    this.bassOscillator.frequency.setValueAtTime(
      55,
      now
    );

    this.bassOscillator.connect(
      this.bassGain
    );

    /*
     * --------------------------------------------------------
     * Lead synth
     * --------------------------------------------------------
     */

    this.leadGain =
      this.audioContext.createGain();

    this.leadGain.gain.value = 0.12;

    this.leadGain.connect(
      this.musicGain
    );

    this.leadOscillator =
      this.audioContext.createOscillator();

    this.leadOscillator.type =
      "square";

    this.leadOscillator.frequency.setValueAtTime(
      220,
      now
    );

    this.leadOscillator.connect(
      this.leadGain
    );

    /*
     * --------------------------------------------------------
     * Slow modulation
     * --------------------------------------------------------
     */

    this.lfoGain =
      this.audioContext.createGain();

    this.lfoGain.gain.value = 7;

    this.lfoOscillator =
      this.audioContext.createOscillator();

    this.lfoOscillator.type =
      "sine";

    this.lfoOscillator.frequency.setValueAtTime(
      2,
      now
    );

    this.lfoOscillator.connect(
      this.lfoGain
    );

    this.lfoGain.connect(
      this.leadOscillator.frequency
    );

    /*
     * --------------------------------------------------------
     * Start
     * --------------------------------------------------------
     */

    this.bassOscillator.start(now);

    this.leadOscillator.start(now);

    this.lfoOscillator.start(now);

    /*
     * --------------------------------------------------------
     * Fade in
     * --------------------------------------------------------
     */

    this.masterGain.gain.cancelScheduledValues(
      now
    );

    this.masterGain.gain.setValueAtTime(
      0.001,
      now
    );

    this.masterGain.gain.exponentialRampToValueAtTime(
      this.volume,
      now + 1.2
    );

    this.playing = true;

    /*
     * --------------------------------------------------------
     * Racing pulse
     *
     * The bass frequency changes every 0.5 seconds,
     * creating a simple repeating arcade-racing rhythm.
     * --------------------------------------------------------
     */

    this.scheduleRacePattern(now);
  }

  /**
   * Schedule the repeating racing pattern.
   */
  private scheduleRacePattern(
    startTime: number
  ): void {
    if (
      !this.audioContext ||
      !this.bassOscillator ||
      !this.leadOscillator
    ) {
      return;
    }

    const bassNotes = [
      55,
      55,
      65.41,
      73.42,
      55,
      65.41,
      73.42,
      82.41
    ];

    const leadNotes = [
      220,
      261.63,
      293.66,
      329.63,
      293.66,
      261.63,
      220,
      196
    ];

    const stepDuration = 0.5;

    for (
      let i = 0;
      i < bassNotes.length;
      i++
    ) {
      const time =
        startTime +
        i * stepDuration;

      this.bassOscillator.frequency
        .setValueAtTime(
          bassNotes[i],
          time
        );

      this.leadOscillator.frequency
        .setValueAtTime(
          leadNotes[i],
          time
        );
    }

    /*
     * Re-schedule the pattern while music is active.
     */
    window.setTimeout(() => {
      if (
        this.playing &&
        this.audioContext
      ) {
        this.scheduleRacePattern(
          this.audioContext.currentTime
        );
      }
    }, 3500);
  }

  /**
   * Stop background music.
   */
  public stop(): void {
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

    const bass =
      this.bassOscillator;

    const lead =
      this.leadOscillator;

    const lfo =
      this.lfoOscillator;

    this.bassOscillator = null;
    this.leadOscillator = null;
    this.lfoOscillator = null;

    window.setTimeout(() => {
      try {
        bass?.stop();
      } catch {
        // Already stopped.
      }

      try {
        lead?.stop();
      } catch {
        // Already stopped.
      }

      try {
        lfo?.stop();
      } catch {
        // Already stopped.
      }

      bass?.disconnect();
      lead?.disconnect();
      lfo?.disconnect();

      this.bassGain?.disconnect();
      this.leadGain?.disconnect();
      this.lfoGain?.disconnect();
      this.musicGain?.disconnect();

      this.bassGain = null;
      this.leadGain = null;
      this.lfoGain = null;
      this.musicGain = null;
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

    this.bassOscillator = null;
    this.leadOscillator = null;

    this.bassGain = null;
    this.leadGain = null;

    this.lfoOscillator = null;
    this.lfoGain = null;

    this.playing = false;
  }
}
