/**
 * ============================================================
 * RaceNova V2
 * Runtime Profile Bridge
 * M10.7.1 — Profile Runtime Integration
 * ============================================================
 *
 * Purpose:
 * - Connect runtime PlayerSaveData to PlayerProfileManager
 * - Provide a small runtime-safe profile boundary
 * - Keep Profile lifecycle outside gameplay systems
 *
 * IMPORTANT:
 * - No UI logic
 * - No localStorage logic
 * - No cloud logic
 * - No authentication logic
 * - No Pi / Google login logic
 * - No Three.js dependency
 *
 * Architecture:
 *
 * Runtime
 *    ↓
 * RuntimeProfileBridge
 *    ↓
 * PlayerProfileManager
 *    ↓
 * PersistenceRepository
 *    ↓
 * SaveSystem
 *
 * Existing PlayerSaveData remains the gameplay
 * save authority.
 * ============================================================
 */

import {
  type PlayerProfile
} from "./PlayerProfile";

import {
  PlayerProfileManager
} from "./PlayerProfileManager";

import {
  type PlayerSaveData
} from "../save/PlayerSaveData";

// ============================================================
// Runtime Profile Bridge
// ============================================================

export class RuntimeProfileBridge {

  private readonly profileManager:
    PlayerProfileManager;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    profileManager:
      PlayerProfileManager
  ) {

    this.profileManager =
      profileManager;
  }

  // ==========================================================
  // Initialize
  // ==========================================================

  /**
   * Initializes the runtime profile from
   * the supplied gameplay save.
   *
   * Existing persisted profile is loaded first.
   * When no profile exists, a new profile is created.
   */
  public initialize(
    profileId: string,
    saveData: PlayerSaveData,
    displayName = ""
  ):
    PlayerProfile | null {

    return this.profileManager.initialize(
      profileId,
      saveData,
      displayName
    );
  }

  // ==========================================================
  // Get Current Profile
  // ==========================================================

  /**
   * Returns the active runtime profile.
   *
   * PlayerProfileManager provides the
   * defensive clone.
   */
  public getCurrentProfile():
    PlayerProfile | null {

    return this.profileManager
      .getCurrentProfile();
  }

  // ==========================================================
  // Sync Save Data
  // ==========================================================

  /**
   * Synchronizes gameplay PlayerSaveData
   * into the active PlayerProfile.
   *
   * Persistence remains owned by
   * PlayerProfileManager and its repository.
   */
  public syncSaveData(
    saveData: PlayerSaveData
  ): boolean {

    return this.profileManager
      .syncSaveData(
        saveData
      );
  }

  // ==========================================================
  // Has Current Profile
  // ==========================================================

  /**
   * Checks whether a runtime profile
   * is currently loaded.
   */
  public hasProfile():
    boolean {

    return this.profileManager
      .hasCurrentProfile();
  }

  // ==========================================================
  // Clear Runtime Profile
  // ==========================================================

  /**
   * Clears only the in-memory runtime profile.
   *
   * Persisted profile remains untouched.
   */
  public clear():
    void {

    this.profileManager
      .clearCurrentProfile();
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  /**
   * Releases the runtime profile reference.
   *
   * Persistence is intentionally untouched.
   */
  public dispose():
    void {

    this.clear();
  }
}
