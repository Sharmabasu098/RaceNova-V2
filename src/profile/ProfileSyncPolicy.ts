/**
 * ============================================================
 * RaceNova V2
 * Profile Sync Policy
 * M10.8.3 — Local ↔ Cloud Sync Policy
 * ============================================================
 *
 * Purpose:
 * - Define local/cloud profile synchronization rules
 * - Keep gameplay authority explicit
 * - Prevent silent cloud overwrites
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
 * M10.8.3 = POLICY CONTRACT ONLY.
 *
 * PlayerSaveData remains the current
 * gameplay authority.
 * ============================================================
 */

import type {
  PlayerProfile
} from "./PlayerProfile";

// ============================================================
// Sync Source
// ============================================================

/**
 * Identifies the source of profile data
 * being considered for synchronization.
 */
export enum ProfileSyncSource {

  /**
   * Current local gameplay/profile state.
   */
  LOCAL = "local",

  /**
   * Future remote/cloud profile state.
   */
  CLOUD = "cloud"
}

// ============================================================
// Sync Action
// ============================================================

/**
 * Describes the action that a future
 * synchronization implementation may take.
 */
export enum ProfileSyncAction {

  /**
   * No synchronization is required.
   */
  NONE = "none",

  /**
   * Local profile may be uploaded to cloud.
   */
  PUSH_LOCAL = "push-local",

  /**
   * Cloud profile may be accepted as the
   * current profile.
   *
   * This is intentionally NOT automatic
   * gameplay overwrite behavior.
   */
  ACCEPT_CLOUD = "accept-cloud",

  /**
   * Local and cloud data require explicit
   * conflict handling.
   */
  CONFLICT = "conflict"
}

// ============================================================
// Sync Decision
// ============================================================

/**
 * Result of a future sync-policy evaluation.
 */
export interface ProfileSyncDecision {

  /**
   * Data source being evaluated.
   */
  source:
    ProfileSyncSource;

  /**
   * Action selected by the policy.
   */
  action:
    ProfileSyncAction;

  /**
   * Human-readable reason for diagnostics.
   */
  reason: string;
}

// ============================================================
// Sync Policy
// ============================================================

/**
 * Central M10.8.3 synchronization policy.
 *
 * This class contains NO persistence and
 * NO network behavior.
 *
 * It only defines safe synchronization
 * decisions for future adapters.
 */
export class ProfileSyncPolicy {

  // ==========================================================
  // Local Save
  // ==========================================================

  /**
   * Local gameplay state is authoritative
   * during normal runtime.
   *
   * A future cloud implementation may
   * push this profile remotely.
   */
  public evaluateLocalProfile(
    profile:
      PlayerProfile
  ):
    ProfileSyncDecision {

    return {

      source:
        ProfileSyncSource.LOCAL,

      action:
        ProfileSyncAction.PUSH_LOCAL,

      reason:
        "Local PlayerSaveData remains the current gameplay authority."
    };
  }

  // ==========================================================
  // Cloud Profile
  // ==========================================================

  /**
   * A cloud profile must never silently
   * overwrite current gameplay state.
   *
   * Cloud acceptance is therefore explicit
   * and remains outside automatic gameplay
   * mutation.
   */
  public evaluateCloudProfile(
    profile:
      PlayerProfile
  ):
    ProfileSyncDecision {

    return {

      source:
        ProfileSyncSource.CLOUD,

      action:
        ProfileSyncAction.ACCEPT_CLOUD,

      reason:
        "Cloud profile may be accepted only through an explicit future sync flow."
    };
  }

  // ==========================================================
  // Conflict
  // ==========================================================

  /**
   * When local and cloud profiles cannot be
   * safely reconciled, defer the decision to
   * the dedicated conflict/version boundary.
   */
  public evaluateConflict():
    ProfileSyncDecision {

    return {

      source:
        ProfileSyncSource.LOCAL,

      action:
        ProfileSyncAction.CONFLICT,

      reason:
        "Local/cloud conflict requires explicit version and conflict handling."
    };
  }

  // ==========================================================
  // Current Authority
  // ==========================================================

  /**
   * Returns the source that currently owns
   * gameplay authority.
   */
  public getCurrentGameplayAuthority():
    ProfileSyncSource {

    return ProfileSyncSource.LOCAL;
  }
}
