/**
 * ============================================================
 * RaceNova V2
 * Cloud Persistence Boundary
 * M10.8.1 — Future Cloud Boundary
 * ============================================================
 *
 * Purpose:
 * - Define the future cloud persistence contract
 * - Keep cloud storage independent from gameplay
 * - Keep authentication independent from profile persistence
 * - Prepare PlayerProfile for future remote synchronization
 *
 * IMPORTANT:
 * - NO cloud implementation
 * - NO network requests
 * - NO fetch()
 * - NO localStorage
 * - NO authentication
 * - NO Pi login
 * - NO Google login
 * - NO UI logic
 * - NO Three.js dependency
 *
 * M10.8.1 is CONTRACT ONLY.
 *
 * Current runtime remains:
 *
 * RuntimeProfileBridge
 *        ↓
 * PlayerProfileManager
 *        ↓
 * LocalPersistenceRepository
 *        ↓
 * SaveSystem
 *
 * Future:
 *
 * PlayerProfileManager
 *        ↓
 * Cloud adapter
 *        ↓
 * CloudPersistenceBoundary
 *        ↓
 * Cloud service
 *
 * PlayerSaveData remains the gameplay
 * save authority.
 * ============================================================
 */

import type {
  PlayerProfile
} from "./PlayerProfile";

// ============================================================
// Cloud Profile Record
// ============================================================

/**
 * Remote representation of a PlayerProfile.
 *
 * The cloud implementation may add its own
 * transport metadata later, but the actual
 * RaceNova profile remains unchanged.
 */
export interface CloudProfileRecord {

  /**
   * Stable RaceNova profile identifier.
   *
   * Authentication/account systems may
   * associate this identifier later.
   */
  profileId: string;

  /**
   * Complete RaceNova PlayerProfile.
   */
  profile: PlayerProfile;
}

// ============================================================
// Cloud Save Result
// ============================================================

/**
 * Result returned by a future cloud-save
 * implementation.
 *
 * No network behavior is implemented here.
 */
export interface CloudProfileSaveResult {

  /**
   * Whether the remote operation succeeded.
   */
  success: boolean;

  /**
   * Optional remote update timestamp.
   *
   * Future cloud implementations may
   * provide this value.
   */
  updatedAt?: number;
}

// ============================================================
// Cloud Load Result
// ============================================================

/**
 * Result returned by a future cloud-load
 * implementation.
 */
export interface CloudProfileLoadResult {

  /**
   * Whether a remote profile was found
   * and accepted.
   */
  success: boolean;

  /**
   * Remote profile when available.
   */
  profile: PlayerProfile | null;
}

// ============================================================
// Cloud Persistence Boundary
// ============================================================

/**
 * Contract for a future cloud persistence
 * adapter.
 *
 * This interface intentionally contains
 * no transport or authentication details.
 */
export interface CloudPersistenceBoundary {

  /**
   * Save a complete PlayerProfile remotely.
   */
  saveProfile(
    profile: PlayerProfile
  ):
    CloudProfileSaveResult;

  /**
   * Load a PlayerProfile remotely.
   *
   * profileId identifies the requested
   * remote profile.
   */
  loadProfile(
    profileId: string
  ):
    CloudProfileLoadResult;

  /**
   * Check whether a remote profile exists.
   */
  hasProfile(
    profileId: string
  ):
    boolean;

  /**
   * Delete a remote profile.
   *
   * Authentication/authorization remains
   * outside this contract.
   */
  deleteProfile(
    profileId: string
  ):
    boolean;
}
