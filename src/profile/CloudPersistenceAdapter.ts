/**
 * ============================================================
 * RaceNova V2
 * Cloud Persistence Adapter
 * M10.8.2 — Cloud Adapter Design
 * ============================================================
 *
 * Purpose:
 * - Define the future cloud adapter contract
 * - Separate cloud transport from PlayerProfile lifecycle
 * - Prepare asynchronous cloud persistence
 * - Keep authentication outside the persistence layer
 *
 * IMPORTANT:
 * - NO network requests
 * - NO fetch()
 * - NO API URL
 * - NO authentication
 * - NO Pi login
 * - NO Google login
 * - NO localStorage
 * - NO UI logic
 * - NO Three.js dependency
 *
 * M10.8.2 = ADAPTER CONTRACT ONLY.
 *
 * Architecture:
 *
 * PlayerProfileManager
 *        ↓
 * PersistenceRepository
 *        ↓
 * Future Cloud Adapter
 *        ↓
 * CloudPersistenceBoundary
 *        ↓
 * Future Cloud Service
 *
 * PlayerSaveData remains the gameplay
 * save authority.
 * ============================================================
 */

import type {
  PlayerProfile
} from "./PlayerProfile";

import type {
  CloudProfileLoadResult,
  CloudProfileSaveResult
} from "./CloudPersistenceBoundary";

// ============================================================
// Cloud Persistence Adapter
// ============================================================

/**
 * Future cloud adapter contract.
 *
 * The adapter is intentionally asynchronous
 * because a real cloud implementation may
 * require network I/O.
 *
 * No network implementation exists in M10.8.2.
 */
export interface CloudPersistenceAdapter {

  /**
   * Save a complete PlayerProfile remotely.
   *
   * Authentication is NOT handled here.
   */
  saveProfile(
    profile: PlayerProfile
  ):
    Promise<CloudProfileSaveResult>;

  /**
   * Load a PlayerProfile remotely.
   *
   * profileId identifies the requested
   * RaceNova profile.
   */
  loadProfile(
    profileId: string
  ):
    Promise<CloudProfileLoadResult>;

  /**
   * Check whether a remote profile exists.
   */
  hasProfile(
    profileId: string
  ):
    Promise<boolean>;

  /**
   * Delete a remote profile.
   *
   * Authentication and authorization
   * remain outside this adapter contract.
   */
  deleteProfile(
    profileId: string
  ):
    Promise<boolean>;
}
