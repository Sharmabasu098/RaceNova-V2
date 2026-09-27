/**
 * ============================================================
 * RaceNova V2
 * Authentication ↔ Profile Bridge
 * M11.4 — Authentication ↔ Profile Integration
 * ============================================================
 *
 * Purpose:
 * - Connect authenticated identity to PlayerProfile
 * - Keep AuthenticationManager provider-neutral
 * - Keep PlayerProfileManager authentication-neutral
 * - Bind authenticated subject to profileId
 * - Synchronize authenticated display name
 *
 * IMPORTANT:
 * - No Pi SDK
 * - No Google SDK
 * - No network requests
 * - No token persistence
 * - No wallet passphrase
 * - No secret phrase
 * - No UI logic
 * - No Three.js dependency
 * - No cloud logic
 *
 * Architecture:
 *
 * AuthenticationManager
 *          ↓
 * AuthenticationProfileBridge
 *          ↓
 * RuntimeProfileBridge
 *          ↓
 * PlayerProfileManager
 *          ↓
 * PlayerSaveData
 * ============================================================
 */

import {
  type AuthenticationIdentity
} from "./AuthenticationBoundary";

import {
  type PlayerProfile
} from "../profile/PlayerProfile";

import {
  RuntimeProfileBridge
} from "../profile/RuntimeProfileBridge";

// ============================================================
// Local Profile Identity
// ============================================================

const LOCAL_PROFILE_ID =
  "racenova-local-player";

// ============================================================
// Authentication ↔ Profile Bridge
// ============================================================

export class AuthenticationProfileBridge {

  private readonly runtimeProfileBridge:
    RuntimeProfileBridge;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    runtimeProfileBridge:
      RuntimeProfileBridge
  ) {

    this.runtimeProfileBridge =
      runtimeProfileBridge;
  }

  // ==========================================================
  // Bind Authenticated Identity
  // ==========================================================

  /**
   * Associates the authenticated identity
   * with the current PlayerProfile.
   *
   * The authenticated subject becomes the
   * stable profileId.
   *
   * Existing local profile data is preserved.
   */
  public bindIdentity(
    identity:
      AuthenticationIdentity
  ):
    PlayerProfile | null {

    if (
      !identity
    ) {
      return null;
    }

    if (
      typeof identity.subject !==
      "string" ||
      identity.subject.trim().length === 0
    ) {
      return null;
    }

    const currentProfile =
      this.runtimeProfileBridge
        .getCurrentProfile();

    if (
      !currentProfile
    ) {
      return null;
    }

    // --------------------------------------------------------
    // Already bound to this authenticated identity
    // --------------------------------------------------------

    if (
      currentProfile.profileId ===
      identity.subject
    ) {

      if (
        currentProfile.displayName !==
        identity.displayName
      ) {

        const updatedProfile:
          PlayerProfile = {

          ...currentProfile,

          displayName:
            identity.displayName
        };

        return this.saveProfile(
          updatedProfile
        );
      }

      return currentProfile;
    }

    // --------------------------------------------------------
    // Convert the temporary local profile
    // into the authenticated profile.
    //
    // PlayerSaveData is preserved unchanged.
    // --------------------------------------------------------

    if (
      currentProfile.profileId !==
      LOCAL_PROFILE_ID
    ) {
      return null;
    }

    const authenticatedProfile:
      PlayerProfile = {

      ...currentProfile,

      profileId:
        identity.subject,

      displayName:
        identity.displayName
    };

    return this.saveProfile(
      authenticatedProfile
    );
  }

  // ==========================================================
  // Get Current Profile
  // ==========================================================

  public getCurrentProfile():
    PlayerProfile | null {

    return this.runtimeProfileBridge
      .getCurrentProfile();
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  /**
   * Clears only the bridge reference.
   *
   * Profile persistence remains untouched.
   */
  public dispose():
    void {

    // Intentionally empty.
    //
    // RuntimeProfileBridge owns
    // runtime profile lifecycle.
  }

  // ==========================================================
  // Save Profile
  // ==========================================================

  private saveProfile(
    profile:
      PlayerProfile
  ):
    PlayerProfile | null {

    const saved =
      this.runtimeProfileBridge
        .saveProfile(
          profile
        );

    if (
      !saved
    ) {
      return null;
    }

    return this.runtimeProfileBridge
      .getCurrentProfile();
  }
}
