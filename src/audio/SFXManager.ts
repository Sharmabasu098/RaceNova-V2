/**
 * ============================================================
 * RaceNova V2
 * SFX Manager
 * M7.1
 * ============================================================
 *
 * Responsibilities:
 * - Lightweight gameplay sound effects
 * - Coin pickup
 * - Nitro
 * - Crash
 * - Boss defeat
 * - Race complete
 * - Race failed
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - Uses Web Audio API
 * - Safe when AudioContext is unavailable
 * - Does not request or load external audio assets
 * ============================================================
 */

export type SFXType =
  | "coin"
  | "nitro"
  | "crash"
  | "bossDefeat"
  | "raceComplete"
  | "raceFailed";

export class SFXManager {
  private audioContext: AudioContext | null = null;

  private masterGain: GainNode | null = null;

  private enabled = true;

  private volume = 0.8;

  /**
   * Initialize the Web Audio context.
   *
   * Browser autoplay policies may keep the context suspended
   * until the player interacts with the page.
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
      this.volume;

    this.masterGain.connect(
      this.audioContext.destination
    );
  }

  /**
   * Resume audio after user interaction.
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
   * Enable or disable all SFX.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get current enabled state.
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set master SFX volume.
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

    if (this.masterGain) {
      this.masterGain.gain.value =
        this.volume;
    }
  }

  /**
   * Get master SFX volume.
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Play a gameplay SFX.
   *
   * If the browser has suspended the AudioContext,
   * resume it first and then play the requested sound.
   */
  public play(type: SFXType): void {
    if (!this.enabled) {
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

    const playSound = (): void => {
      if (
        !this.audioContext ||
        !this.masterGain ||
        !this.enabled
      ) {
        return;
      }

      switch (type) {
        case "coin":
          this.playCoin();
          break;

        case "nitro":
          this.playNitro();
          break;

        case "crash":
          this.playCrash();
          break;

        case "bossDefeat":
          this.playBossDefeat();
          break;

        case "raceComplete":
          this.playRaceComplete();
          break;

        case "raceFailed":
          this.playRaceFailed();
          break;
      }
    };

    if (
      this.audioContext.state === "suspended"
    ) {
      void this.audioContext
        .resume()
        .then(() => {
          playSound();
        })
        .catch(() => {
          // Audio unlock may be blocked by browser policy.
        });

      return;
    }

    playSound();
  }

  /**
   * Coin pickup sound.
   */
  private playCoin(): void {
    this.playTone(
      880,
      0.08,
      "sine",
      0.16
    );

    window.setTimeout(() => {
      this.playTone(
        1320,
        0.1,
        "sine",
        0.13
      );
    }, 60);
  }

  /**
   * Nitro activation sound.
   */
  private playNitro(): void {
    if (!this.audioContext) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    oscillator.type =
      "sawtooth";

    oscillator.frequency.setValueAtTime(
      90,
      this.audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      420,
      this.audioContext.currentTime + 0.35
    );

    gain.gain.setValueAtTime(
      0.001,
      this.audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.16,
      this.audioContext.currentTime + 0.05
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioContext.currentTime + 0.4
    );

    oscillator.connect(gain);

    gain.connect(
      this.masterGain!
    );

    oscillator.start();

    oscillator.stop(
      this.audioContext.currentTime + 0.4
    );
  }

  /**
   * Crash sound.
   */
  private playCrash(): void {
    if (!this.audioContext) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    oscillator.type =
      "square";

    oscillator.frequency.setValueAtTime(
      120,
      this.audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      45,
      this.audioContext.currentTime + 0.25
    );

    gain.gain.setValueAtTime(
      0.001,
      this.audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.22,
      this.audioContext.currentTime + 0.02
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      this.audioContext.currentTime + 0.28
    );

    oscillator.connect(gain);

    gain.connect(
      this.masterGain!
    );

    oscillator.start();

    oscillator.stop(
      this.audioContext.currentTime + 0.28
    );
  }

  /**
   * Boss defeated sound.
   */
  private playBossDefeat(): void {
    const notes = [
      {
        frequency: 440,
        delay: 0,
      },
      {
        frequency: 660,
        delay: 120,
      },
      {
        frequency: 880,
        delay: 240,
      },
    ];

    for (const note of notes) {
      window.setTimeout(() => {
        this.playTone(
          note.frequency,
          0.16,
          "triangle",
          0.15
        );
      }, note.delay);
    }
  }

  /**
   * Race complete sound.
   */
  private playRaceComplete(): void {
    const notes = [
      523,
      659,
      784,
      1047,
    ];

    notes.forEach(
      (frequency, index) => {
        window.setTimeout(() => {
          this.playTone(
            frequency,
            0.18,
            "triangle",
            0.15
          );
        }, index * 130);
      }
    );
  }

  /**
   * Race failed sound.
   */
  private playRaceFailed(): void {
    const notes = [
      440,
      330,
      220,
    ];

    notes.forEach(
      (frequency, index) => {
        window.setTimeout(() => {
          this.playTone(
            frequency,
            0.2,
            "sawtooth",
            0.12
          );
        }, index * 160);
      }
    );
  }

  /**
   * Generic tone helper.
   */
  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (
      !this.audioContext ||
      !this.masterGain
    ) {
      return;
    }

    const oscillator =
      this.audioContext.createOscillator();

    const gain =
      this.audioContext.createGain();

    const now =
      this.audioContext.currentTime;

    oscillator.type =
      type;

    oscillator.frequency.setValueAtTime(
      frequency,
      now
    );

    gain.gain.setValueAtTime(
      0.001,
      now
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.01
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration
    );

    oscillator.connect(gain);

    gain.connect(
      this.masterGain
    );

    oscillator.start(now);

    oscillator.stop(
      now + duration
    );
  }

  /**
   * Release Web Audio resources.
   */
  public dispose(): void {
    if (this.audioContext) {
      void this.audioContext.close();
    }

    this.audioContext = null;

    this.masterGain = null;
  }
}
