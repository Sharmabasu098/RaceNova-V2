/**
 * ============================================================
 * RaceNova V2
 * Profile Conflict Boundary
 * M10.8.4 — Conflict / Version Boundary
 * ============================================================
 *
 * Purpose:
 * - Define local/cloud conflict states
 * - Validate profile and save-data versions
 * - Compare local/cloud profile timestamps
 * - Prevent silent overwrites
 * - Prepare safe future cloud synchronization
 *
 * IMPORTANT:
 * - NO network requests
 * - NO fetch()
 * - NO authentication
 * - NO Pi login
 * - NO Google login
 * - NO localStorage
 * - NO UI logic
 * - NO Three.js dependency
 *
 * M10.8.4 = CONFLICT/VERSION CONTRACT ONLY.
 *
 * PlayerSaveData remains the gameplay
 * authority.
 * ============================================================
 */

import {
  type PlayerProfile,
  PLAYER_PROFILE_VERSION,
  isValidPlayerProfile
} from "./PlayerProfile";

import {
  PLAYER_SAVE_VERSION,
  isValidPlayerSaveData,
  isSupportedPlayerSaveVersion
} from "../save/PlayerSaveData";

// ============================================================
// Profile Version Metadata
// ============================================================

/**
 * Version information carried by a future
 * local/cloud synchronization envelope.
 *
 * PlayerProfile itself is intentionally
 * unchanged in M10.8.4.
 */
export interface ProfileVersionMetadata {

  /**
   * PlayerProfile schema version.
   */
  profileVersion: number;

  /**
   * Nested PlayerSaveData schema version.
   */
  saveVersion: number;
}

// ============================================================
// Profile Sync Snapshot
// ============================================================

/**
 * Versioned profile snapshot used only by
 * the future synchronization boundary.
 */
export interface ProfileSyncSnapshot {

  /**
   * Complete RaceNova profile.
   */
  profile: PlayerProfile;

  /**
   * Schema version metadata.
   */
  versions: ProfileVersionMetadata;
}

// ============================================================
// Conflict State
// ============================================================

export enum ProfileConflictState {

  /**
   * Local and cloud data represent the
   * same profile state.
   */
  IN_SYNC = "in-sync",

  /**
   * Local state is newer.
   */
  LOCAL_NEWER = "local-newer",

  /**
   * Cloud state is newer.
   */
  CLOUD_NEWER = "cloud-newer",

  /**
   * Both states have the same timestamp
   * but different profile data.
   */
  CONFLICT = "conflict",

  /**
   * The local/cloud profile identifiers
   * do not match.
   */
  IDENTITY_MISMATCH = "identity-mismatch",

  /**
   * A profile or nested save-data version
   * is not supported.
   */
  VERSION_MISMATCH = "version-mismatch",

  /**
   * Profile data failed validation.
   */
  INVALID_DATA = "invalid-data"
}

// ============================================================
// Conflict Decision
// ============================================================

export interface ProfileConflictDecision {

  /**
   * Final conflict state.
   */
  state:
    ProfileConflictState;

  /**
   * Human-readable diagnostic reason.
   */
  reason: string;

  /**
   * Whether automatic synchronization is
   * allowed by this boundary.
   *
   * M10.8.4 deliberately keeps this false
   * for conflict cases.
   */
  automaticSyncAllowed:
    boolean;
}

// ============================================================
// Profile Conflict Boundary
// ============================================================

/**
 * Pure conflict/version evaluator.
 *
 * This class does not save, load, upload,
 * download, authenticate or mutate profiles.
 */
export class ProfileConflictBoundary {

  // ==========================================================
  // Version Validation
  // ==========================================================

  /**
   * Validates the version metadata against
   * the currently supported RaceNova schema.
   */
  public isSupportedVersion(
    versions:
      ProfileVersionMetadata
  ):
    boolean {

    return (

      versions.profileVersion ===
        PLAYER_PROFILE_VERSION &&

      isSupportedPlayerSaveVersion(
        versions.saveVersion
      )
    );
  }

  // ==========================================================
  // Snapshot Validation
  // ==========================================================

  /**
   * Validates a complete synchronization
   * snapshot before comparison.
   */
  public isValidSnapshot(
    snapshot:
      ProfileSyncSnapshot
  ):
    boolean {

    if (
      !snapshot
    ) {
      return false;
    }

    if (
      !isValidPlayerProfile(
        snapshot.profile
      )
    ) {
      return false;
    }

    if (
      !isValidPlayerSaveData(
        snapshot.profile.saveData
      )
    ) {
      return false;
    }

    if (
      !this.isSupportedVersion(
        snapshot.versions
      )
    ) {
      return false;
    }

    if (
      snapshot.profile.saveData.version !==
        snapshot.versions.saveVersion
    ) {
      return false;
    }

    return true;
  }

  // ==========================================================
  // Compare
  // ==========================================================

  /**
   * Compares local and cloud snapshots.
   *
   * No profile is modified.
   */
  public compare(
    local:
      ProfileSyncSnapshot,

    cloud:
      ProfileSyncSnapshot
  ):
    ProfileConflictDecision {

    // --------------------------------------------------------
    // Local validation
    // --------------------------------------------------------

    if (
      !this.isValidSnapshot(
        local
      )
    ) {

      return {

        state:
          ProfileConflictState.INVALID_DATA,

        reason:
          "Local profile snapshot is invalid.",

        automaticSyncAllowed:
          false
      };
    }

    // --------------------------------------------------------
    // Cloud validation
    // --------------------------------------------------------

    if (
      !this.isValidSnapshot(
        cloud
      )
    ) {

      return {

        state:
          ProfileConflictState.INVALID_DATA,

        reason:
          "Cloud profile snapshot is invalid.",

        automaticSyncAllowed:
          false
      };
    }

    // --------------------------------------------------------
    // Version compatibility
    // --------------------------------------------------------

    if (
      local.versions.profileVersion !==
        cloud.versions.profileVersion ||

      local.versions.saveVersion !==
        cloud.versions.saveVersion
    ) {

      return {

        state:
          ProfileConflictState.VERSION_MISMATCH,

        reason:
          "Local and cloud profile versions are incompatible.",

        automaticSyncAllowed:
          false
      };
    }

    // --------------------------------------------------------
    // Profile identity
    // --------------------------------------------------------

    if (
      local.profile.profileId !==
        cloud.profile.profileId
    ) {

      return {

        state:
          ProfileConflictState.IDENTITY_MISMATCH,

        reason:
          "Local and cloud profiles belong to different profile identities.",

        automaticSyncAllowed:
          false
      };
    }

    // --------------------------------------------------------
    // Exact data equality
    // --------------------------------------------------------

    const localData =
      JSON.stringify(
        local.profile
      );

    const cloudData =
      JSON.stringify(
        cloud.profile
      );

    if (
      localData ===
        cloudData
    ) {

      return {

        state:
          ProfileConflictState.IN_SYNC,

        reason:
          "Local and cloud profiles are synchronized.",

        automaticSyncAllowed:
          true
      };
    }

    // --------------------------------------------------------
    // Timestamp comparison
    // --------------------------------------------------------

    if (
      local.profile.updatedAt >
        cloud.profile.updatedAt
    ) {

      return {

        state:
          ProfileConflictState.LOCAL_NEWER,

        reason:
          "Local profile has a newer update timestamp.",

        automaticSyncAllowed:
          false
      };
    }

    if (
      cloud.profile.updatedAt >
        local.profile.updatedAt
    ) {

      return {

        state:
          ProfileConflictState.CLOUD_NEWER,

        reason:
          "Cloud profile has a newer update timestamp.",

        automaticSyncAllowed:
          false
      };
    }

    // --------------------------------------------------------
    // Same timestamp + different data
    // --------------------------------------------------------

    return {

      state:
        ProfileConflictState.CONFLICT,

      reason:
        "Local and cloud profiles differ but have the same update timestamp.",

      automaticSyncAllowed:
        false
    };
  }

  // ==========================================================
  // Current Versions
  // ==========================================================

  /**
   * Returns the currently supported RaceNova
   * profile/save schema versions.
   */
  public getCurrentVersions():
    ProfileVersionMetadata {

    return {

      profileVersion:
        PLAYER_PROFILE_VERSION,

      saveVersion:
        PLAYER_SAVE_VERSION
    };
  }
}
