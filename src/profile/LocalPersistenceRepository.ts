/**
 * ============================================================
 * RaceNova V2
 * Local Persistence Repository
 * M10.3 — Local Persistence Adapter
 * ============================================================
 *
 * Purpose:
 * - Implement PersistenceRepository for local persistence
 * - Delegate profile storage to SaveSystem
 * - Keep browser-storage ownership inside SaveSystem
 *
 * IMPORTANT:
 * - Does NOT access localStorage directly
 * - Does NOT contain cloud logic
 * - Does NOT contain authentication logic
 * - Does NOT contain Pi / Google login logic
 * - Does NOT contain UI logic
 * - Does NOT contain Three.js dependency
 *
 * Architecture:
 *
 * LocalPersistenceRepository
 *            ↓
 *   PersistenceRepository
 *            ↓
 *        SaveSystem
 *            ↓
 *       localStorage
 * ============================================================
 */

import {
  SaveSystem
} from "../save/SaveSystem";

import type {
  PlayerProfile
} from "./PlayerProfile";

import type {
  PersistenceRepository
} from "./PersistenceRepository";

// ============================================================
// Local Persistence Repository
// ============================================================

export class LocalPersistenceRepository
  implements PersistenceRepository {

  private readonly saveSystem:
    SaveSystem;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    saveSystem: SaveSystem
  ) {

    this.saveSystem =
      saveSystem;
  }

  // ==========================================================
  // Save
  // ==========================================================

  /**
   * Saves the complete player profile
   * through SaveSystem.
   *
   * SaveSystem remains the only layer
   * that talks to browser storage.
   */
  public save(
    profile: PlayerProfile
  ): boolean {

    return this.saveSystem.saveProfile(
      profile
    );
  }

  // ==========================================================
  // Load
  // ==========================================================

  /**
   * Loads the complete player profile
   * through SaveSystem.
   *
   * Returns null when no valid profile
   * is available.
   */
  public load():
    PlayerProfile | null {

    return this.saveSystem.loadProfile();
  }

  // ==========================================================
  // Has Profile
  // ==========================================================

  /**
   * Checks whether a profile record exists.
   */
  public hasProfile(): boolean {

    return this.saveSystem.hasProfile();
  }

  // ==========================================================
  // Delete Profile
  // ==========================================================

  /**
   * Deletes the persisted profile.
   *
   * This does not reset gameplay managers.
   */
  public deleteProfile(): boolean {

    return this.saveSystem.deleteProfile();
  }
  }
