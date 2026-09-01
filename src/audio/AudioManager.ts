/**
 * ============================================================
 * RaceNova V2
 * Audio Manager
 * M7.1
 * ============================================================
 *
 * Responsibilities:
 * - Central audio controller
 * - Manage SFX and music
 * - Audio initialization
 * - Mobile audio unlock
 * - Master volume control
 * - Safe enable / disable
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No gameplay logic
 * - No SaveSystem dependency
 * - No DOM dependency beyond browser Web Audio support
 * - Does not request or store any wallet/payment information
 * ============================================================
 */

import {
  SFXManager,
  type SFXType,
} from "./SFXManager";

import {
  MusicManager,
} from "./MusicManager";

export class AudioManager {
  private readonly sfxManager: SFXManager;

  private readonly musicManager: MusicManager;

  private enabled = true;

  private masterVolume = 1.0;

  private initialized = false;

  constructor() {
    this.sfxManager =
      new SFXManager();

    this.musicManager =
      new MusicManager();
  }

  /**
   * Initialize all audio systems.
   */
  public initialize(): void {
    if (this.initialized) {
      return;
    }

    this.sfxManager.initialize();

    this.musicManager.initialize();

    this.applyMasterVolume();

    this.initialized = true;
  }

  /**
   * Unlock browser audio after user interaction.
   */
  public async unlock(): Promise<void> {
    if (!this.initialized) {
      this.initialize();
    }

    await this.sfxManager.unlock();

    await this.musicManager.unlock();
  }

  /**
   * Play a sound effect.
   */
  public playSFX(type: SFXType): void {
    if (!this.enabled) {
      return;
    }

    this.sfxManager.play(type);
  }

  /**
   * Start background music.
   */
  public startMusic(): void {
    if (!this.enabled) {
      return;
    }

    this.musicManager.start();
  }

  /**
   * Stop background music.
   */
  public stopMusic(): void {
    this.musicManager.stop();
  }

  /**
   * Enable or disable all audio.
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    this.sfxManager.setEnabled(
      enabled
    );

    this.musicManager.setEnabled(
      enabled
    );

    if (!enabled) {
      this.stopMusic();
    }
  }

  /**
   * Get master enabled state.
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set master volume.
   *
   * Accepted range: 0.0 - 1.0
   */
  public setMasterVolume(
    volume: number
  ): void {
    this.masterVolume =
      Math.max(
        0,
        Math.min(1, volume)
      );

    this.applyMasterVolume();
  }

  /**
   * Get master volume.
   */
  public getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Set SFX volume.
   */
  public setSFXVolume(
    volume: number
  ): void {
    this.sfxManager.setVolume(
      volume * this.masterVolume
    );
  }

  /**
   * Get SFX volume.
   */
  public getSFXVolume(): number {
    if (this.masterVolume <= 0) {
      return 0;
    }

    return (
      this.sfxManager.getVolume() /
      this.masterVolume
    );
  }

  /**
   * Set music volume.
   */
  public setMusicVolume(
    volume: number
  ): void {
    this.musicManager.setVolume(
      volume * this.masterVolume
    );
  }

  /**
   * Get music volume.
   */
  public getMusicVolume(): number {
    if (this.masterVolume <= 0) {
      return 0;
    }

    return (
      this.musicManager.getVolume() /
      this.masterVolume
    );
  }

  /**
   * Check whether music is playing.
   */
  public isMusicPlaying(): boolean {
    return this.musicManager.isPlaying();
  }

  /**
   * Apply master volume to both channels.
   */
  private applyMasterVolume(): void {
    this.sfxManager.setVolume(
      this.masterVolume
    );

    this.musicManager.setVolume(
      this.masterVolume
    );
  }

  /**
   * Release all audio resources.
   */
  public dispose(): void {
    this.sfxManager.dispose();

    this.musicManager.dispose();

    this.initialized = false;
  }
}
