/**
 * ============================================================
 * RaceNova V2
 * Player Profile
 * M10.1 — Profile Data Model
 * ============================================================
 *
 * Purpose:
 * - Define the persistent player-profile boundary
 * - Wrap existing PlayerSaveData
 * - Prepare the profile for future local/cloud persistence
 *
 * IMPORTANT:
 * - No UI logic
 * - No localStorage logic
 * - No cloud logic
 * - No authentication logic
 * - No Pi / Google login logic
 * - No Three.js dependency
 *
 * M10.1 = DATA MODEL ONLY
 * ============================================================
 */

import {
  type PlayerSaveData,
  clonePlayerSaveData
} from "../save/PlayerSaveData";

// ============================================================
// Profile Schema Version
// ============================================================

/**
 * Version of the PlayerProfile structure.
 *
 * This is separate from PLAYER_SAVE_VERSION.
 */
export const PLAYER_PROFILE_VERSION = 1;

// ============================================================
// Player Profile
// ============================================================

export interface PlayerProfile {

  /**
   * Stable profile identifier.
   *
   * Future authentication/cloud systems
   * can associate this profile with an account.
   */
  profileId: string;

  /**
   * Player-facing display name.
   *
   * No UI is connected in M10.1.
   */
  displayName: string;

  /**
   * Profile creation timestamp.
   */
  createdAt: number;

  /**
   * Last profile update timestamp.
   */
  updatedAt: number;

  /**
   * Existing RaceNova gameplay save.
   *
   * PlayerSaveData remains authoritative for:
   * - Economy
   * - Garage
   * - Upgrades
   * - Campaign/Race Progress
   */
  saveData: PlayerSaveData;
}

// ============================================================
// Create Player Profile
// ============================================================

export function createPlayerProfile(
  profileId: string,
  saveData: PlayerSaveData,
  displayName = ""
): PlayerProfile {

  const now =
    Date.now();

  return {

    profileId,

    displayName,

    createdAt:
      now,

    updatedAt:
      now,

    saveData
  };
}

// ============================================================
// Clone Player Profile
// ============================================================

export function clonePlayerProfile(
  profile: PlayerProfile
): PlayerProfile {

  return {

    profileId:
      profile.profileId,

    displayName:
      profile.displayName,

    createdAt:
      profile.createdAt,

    updatedAt:
      profile.updatedAt,

    saveData:
      clonePlayerSaveData(
        profile.saveData
      )
  };
}

// ============================================================
// Touch Profile Timestamp
// ============================================================

export function touchPlayerProfile(
  profile: PlayerProfile
): PlayerProfile {

  return {

    ...profile,

    updatedAt:
      Date.now()
  };
}

// ============================================================
// Profile Validation
// ============================================================

export function isValidPlayerProfile(
  value: unknown
): value is PlayerProfile {

  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const profile =
    value as Partial<PlayerProfile>;

  // ----------------------------------------------------------
  // Profile ID
  // ----------------------------------------------------------

  if (
    typeof profile.profileId !== "string" ||
    profile.profileId.trim().length === 0
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Display Name
  // ----------------------------------------------------------

  if (
    typeof profile.displayName !== "string"
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Created At
  // ----------------------------------------------------------

  if (
    !Number.isFinite(
      profile.createdAt
    ) ||
    profile.createdAt <= 0
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Updated At
  // ----------------------------------------------------------

  if (
    !Number.isFinite(
      profile.updatedAt
    ) ||
    profile.updatedAt <= 0
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Save Data
  // ----------------------------------------------------------

  if (
    !profile.saveData ||
    typeof profile.saveData !== "object"
  ) {
    return false;
  }

  return true;
}
