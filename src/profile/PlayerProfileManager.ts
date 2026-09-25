/**
 * ============================================================
 * RaceNova V2
 * Player Profile Manager
 * M10.4 — Profile Lifecycle
 * ============================================================
 *
 * Responsibilities:
 * - Load the current PlayerProfile
 * - Create a new PlayerProfile when none exists
 * - Keep the active profile in memory
 * - Save the active profile
 * - Update the display name
 * - Clear the active profile
 *
 * IMPORTANT:
 * - No localStorage access
 * - No UI logic
 * - No authentication logic
 * - No Pi / Google login logic
 * - No cloud logic
 * - No Three.js dependency
 *
 * Persistence is delegated entirely to
 * PersistenceRepository.
 *
 * Architecture:
 *
 * PlayerProfileManager
 *          ↓
 * PersistenceRepository
 *          ↓
 * LocalPersistenceRepository
 *          ↓
 * SaveSystem
 *          ↓
 * localStorage
 * ============================================================
 */

import {
  type PlayerProfile,
  createPlayerProfile,
  clonePlayerProfile,
  touchPlayerProfile,
  isValidPlayerProfile
} from "./PlayerProfile";

import type {
  PersistenceRepository
} from "./PersistenceRepository";

import type {
  PlayerSaveData
} from "../save/PlayerSaveData";

// ============================================================
// Player Profile Manager
// ============================================================

export class PlayerProfileManager {

  private readonly repository:
    PersistenceRepository;

  private currentProfile:
    PlayerProfile | null = null;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    repository:
      PersistenceRepository
  ) {

    this.repository =
      repository;
  }

  // ==========================================================
  // Initialize
  // ==========================================================

  /**
   * Loads the existing profile.
   *
   * If no profile exists, creates a new
   * profile from the supplied PlayerSaveData.
   *
   * The profileId must be supplied by the
   * caller. M10.4 does not generate or
   * authenticate identity.
   */
  public initialize(
    profileId: string,
    saveData: PlayerSaveData,
    displayName = ""
  ): PlayerProfile | null {

    // --------------------------------------------------------
    // Try existing profile first
    // --------------------------------------------------------

    const existingProfile =
      this.repository.load();

    if (
      existingProfile
    ) {

      this.currentProfile =
        clonePlayerProfile(
          existingProfile
        );

      return this.getCurrentProfile();
    }

    // --------------------------------------------------------
    // No profile exists
    // --------------------------------------------------------

    const newProfile =
      createPlayerProfile(
        profileId,
        saveData,
        displayName
      );

    // --------------------------------------------------------
    // Persist new profile
    // --------------------------------------------------------

    const saved =
      this.repository.save(
        newProfile
      );

    if (
      !saved
    ) {
      this.currentProfile =
        null;

      return null;
    }

    this.currentProfile =
      clonePlayerProfile(
        newProfile
      );

    return this.getCurrentProfile();
  }

  // ==========================================================
  // Load
  // ==========================================================

  /**
   * Loads the persisted profile into memory.
   *
   * Returns null when no valid profile
   * is available.
   */
  public load():
    PlayerProfile | null {

    const profile =
      this.repository.load();

    if (
      !profile
    ) {

      this.currentProfile =
        null;

      return null;
    }

    this.currentProfile =
      clonePlayerProfile(
        profile
      );

    return this.getCurrentProfile();
  }

  // ==========================================================
  // Save
  // ==========================================================

  /**
   * Saves the current in-memory profile.
   */
  public save(): boolean {

    if (
      !this.currentProfile
    ) {
      return false;
    }

    if (
      !isValidPlayerProfile(
        this.currentProfile
      )
    ) {
      return false;
    }

    const updatedProfile =
      touchPlayerProfile(
        this.currentProfile
      );

    const saved =
      this.repository.save(
        updatedProfile
      );

    if (
      !saved
    ) {
      return false;
    }

    this.currentProfile =
      clonePlayerProfile(
        updatedProfile
      );

    return true;
  }

  // ==========================================================
  // Save Profile
  // ==========================================================

  /**
   * Replaces the current in-memory
   * profile and persists it.
   */
  public saveProfile(
    profile: PlayerProfile
  ): boolean {

    if (
      !isValidPlayerProfile(
        profile
      )
    ) {
      return false;
    }

    const updatedProfile =
      touchPlayerProfile(
        clonePlayerProfile(
          profile
        )
      );

    const saved =
      this.repository.save(
        updatedProfile
      );

    if (
      !saved
    ) {
      return false;
    }

    this.currentProfile =
      clonePlayerProfile(
        updatedProfile
      );

    return true;
  }

  // ==========================================================
  // Get Current Profile
  // ==========================================================

  /**
   * Returns a defensive copy of the
   * current in-memory profile.
   */
  public getCurrentProfile():
    PlayerProfile | null {

    if (
      !this.currentProfile
    ) {
      return null;
    }

    return clonePlayerProfile(
      this.currentProfile
    );
  }

  // ==========================================================
  // Has Current Profile
  // ==========================================================

  /**
   * Checks whether a profile is currently
   * loaded in memory.
   */
  public hasCurrentProfile():
    boolean {

    return (
      this.currentProfile !==
      null
    );
  }

  // ==========================================================
  // Has Persisted Profile
  // ==========================================================

  /**
   * Checks whether a persisted profile
   * exists in the repository.
   */
  public hasPersistedProfile():
    boolean {

    return this.repository.hasProfile();
  }

  // ==========================================================
  // Update Display Name
  // ==========================================================

  /**
   * Updates the display name in memory.
   *
   * The change is not persisted until
   * save() or saveProfile() is called.
   */
  public setDisplayName(
    displayName: string
  ): boolean {

    if (
      !this.currentProfile
    ) {
      return false;
    }

    if (
      typeof displayName !==
      "string"
    ) {
      return false;
    }

    this.currentProfile = {

      ...this.currentProfile,

      displayName
    };

    return true;
  }

  // ==========================================================
  // Clear Current Profile
  // ==========================================================

  /**
   * Clears only the in-memory profile.
   *
   * Persisted profile remains untouched.
   */
  public clearCurrentProfile():
    void {

    this.currentProfile =
      null;
  }

  // ==========================================================
  // Delete Persisted Profile
  // ==========================================================

  /**
   * Deletes the persisted profile and
   * clears the in-memory profile.
   *
   * This does NOT delete PlayerSaveData.
   */
  public deleteProfile():
    boolean {

    const deleted =
      this.repository.deleteProfile();

    if (
      deleted
    ) {
      this.currentProfile =
        null;
    }

    return deleted;
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  /**
   * Clears the in-memory profile.
   *
   * Persistence is intentionally untouched.
   */
  public dispose():
    void {

    this.clearCurrentProfile();
  }
}
