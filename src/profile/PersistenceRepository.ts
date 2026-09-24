/**
 * ============================================================
 * RaceNova V2
 * Persistence Repository
 * M10.2 — Persistence Interface
 * ============================================================
 *
 * Purpose:
 * - Define the persistence contract for PlayerProfile
 * - Separate profile data from storage implementation
 * - Prepare local and future cloud persistence
 *
 * IMPORTANT:
 * - No localStorage logic
 * - No cloud logic
 * - No authentication logic
 * - No Pi / Google login logic
 * - No UI logic
 * - No Three.js dependency
 *
 * M10.2 = INTERFACE ONLY
 *
 * Implementations are added in later M10 steps.
 * ============================================================
 */

import type {
  PlayerProfile
} from "./PlayerProfile";

// ============================================================
// Persistence Repository
// ============================================================

export interface PersistenceRepository {

  /**
   * Save the complete player profile.
   *
   * Returns true when the persistence
   * implementation accepts the profile.
   */
  save(
    profile: PlayerProfile
  ): boolean;

  /**
   * Load the complete player profile.
   *
   * Returns null when no valid profile
   * is available.
   */
  load(): PlayerProfile | null;

  /**
   * Check whether a persisted profile exists.
   */
  hasProfile(): boolean;

  /**
   * Remove the persisted profile.
   *
   * This does not modify the in-memory
   * PlayerProfile.
   */
  deleteProfile(): boolean;
}
