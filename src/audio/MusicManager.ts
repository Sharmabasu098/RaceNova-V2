/**
 * ============================================================
 * RaceNova V2
 * Music Manager
 * M7.1 — Real Racing Music
 * ============================================================
 *
 * Responsibilities:
 * - Real background racing music
 * - Seamless music loop
 * - Start / stop music
 * - Volume control
 * - Enable / disable music
 * - Mobile browser audio safety
 *
 * IMPORTANT:
 * - Uses RaceNova racing music asset
 * - No Three.js dependency
 * - SFXManager remains independent
 * ============================================================
 */

export class MusicManager {
  private audioContext: AudioContext | null = null;

  private masterGain: GainNode | null = null;

  private audioElement: HTMLAudioElement | null = null;

  private mediaSource: MediaElementAudioSourceNode | null = null;

  private enabled = true;

  private playing = false;

  private volume = 0.08;

  /**
   * RaceNova background music asset.
   *
   * BASE_URL keeps this compatible with GitHub Pages.
   */
  private readonly musicPath =
    `${import.meta.env.BASE_URL}assets/audio/music/fever_stadium_bpm165.mp3`;

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

    this.audioElement =
      new Audio();

    this.audioElement.src =
      this.musicPath;

    this.audioElement.loop = true;

    this.audioElement.preload =
      "auto";

    this.audioElement.volume = 1;

    this.audioElement.setAttribute(
      "playsinline",
      ""
    );

    this.mediaSource =
      this.audioContext.createMediaElementSource(
        this.audioElement
      );

    this.mediaSource.connect(
      this.masterGain
    );
  }

  /**
   * Unlock audio after user interaction.
   */
  public async unlock(): Promise<void> {
    if (!this.audioContext) {
      this.initialize();
    }

    if (!this.audioContext) {
      return;
    }

    if (
      this.audioContext.state ===
      "suspended"
    ) {
      await this.audioContext.resume();
    }
  }

  /**
   * Start real RaceNova racing music.
   */
  public start(): void {
    if (
      !this.enabled ||
      this.playing
    ) {
      return;
    }

    if (!this.audioContext) {
      this.initialize();
    }

    if (
      !this.audioContext ||
      !this.masterGain ||
      !this.audioElement
    ) {
      return;
    }

    if (
      this.audioContext.state ===
      "suspended"
    ) {
      return;
    }

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
      now + 1.0
    );

    this.audioElement.currentTime =
      0;

    void this.audioElement
      .play()
      .then(() => {
        this.playing = true;
      })
      .catch(() => {
        /*
         * Browser may block playback until
         * another user interaction.
         */
        this.playing = false;
      });
  }

  /**
   * Stop background music.
   */
  public stop(): void {
    if (
      !this.audioContext ||
      !this.masterGain ||
      !this.audioElement
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
      now + 0.5
    );

    const audio =
      this.audioElement;

    window.setTimeout(() => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {
        // Audio may already be stopped.
      }
    }, 550);

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

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.removeAttribute(
          "src"
        );
        this.audioElement.load();
      } catch {
        // Audio element may already be released.
      }
    }

    if (this.mediaSource) {
      try {
        this.mediaSource.disconnect();
      } catch {
        // Already disconnected.
      }
    }

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // Already disconnected.
      }
    }

    if (this.audioContext) {
      void this.audioContext.close();
    }

    this.audioContext = null;
    this.masterGain = null;
    this.audioElement = null;
    this.mediaSource = null;

    this.playing = false;
  }
}
