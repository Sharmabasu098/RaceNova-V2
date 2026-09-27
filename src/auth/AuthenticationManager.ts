/**
 * ============================================================
 * RaceNova V2
 * Authentication Manager
 * M11.2 — Authentication Manager
 * ============================================================
 *
 * Purpose:
 * - Manage the current authentication session
 * - Provide a provider-neutral authentication lifecycle
 * - Delegate authentication to AuthenticationBoundary
 * - Keep authentication outside gameplay/profile persistence
 *
 * IMPORTANT:
 * - NO Pi SDK implementation
 * - NO Google SDK implementation
 * - NO network requests
 * - NO fetch()
 * - NO localStorage
 * - NO token persistence
 * - NO wallet passphrase
 * - NO secret phrase
 * - NO UI logic
 * - NO Three.js dependency
 *
 * M11.2 = MANAGER LIFECYCLE ONLY.
 *
 * Architecture:
 *
 * Future Authentication Provider
 *             ↓
 *   AuthenticationBoundary
 *             ↓
 *   AuthenticationManager
 *             ↓
 *   AuthenticationSession
 *
 * AuthenticationManager does NOT own:
 * - PlayerSaveData
 * - Economy
 * - Garage
 * - Upgrades
 * - Race progression
 * - Cloud persistence
 * ============================================================
 */

import {
  type AuthenticationBoundary,
  type AuthenticationIdentity,
  type AuthenticationResult,
  type AuthenticationSession,
  AuthenticationStatus
} from "./auth/AuthenticationBoundary";
// ============================================================
// Authentication Manager
// ============================================================

export class AuthenticationManager {

  private readonly boundary:
    AuthenticationBoundary;

  private currentSession:
    AuthenticationSession;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    boundary:
      AuthenticationBoundary
  ) {

    this.boundary =
      boundary;

    this.currentSession = {

      status:
        AuthenticationStatus.SIGNED_OUT,

      identity:
        null
    };
  }

  // ==========================================================
  // Sign In
  // ==========================================================

  /**
   * Starts authentication through the
   * configured provider boundary.
   *
   * The manager stores only the provider's
   * public AuthenticationSession.
   */
  public async signIn():
    Promise<AuthenticationResult> {

    this.currentSession = {

      status:
        AuthenticationStatus.AUTHENTICATING,

      identity:
        null
    };

    try {

      const result =
        await this.boundary
          .signIn();

      if (
        !result ||
        !result.session
      ) {

        this.currentSession = {

          status:
            AuthenticationStatus.ERROR,

          identity:
            null
        };

        return {

          success:
            false,

          session:
            this.getSession(),

          message:
            "Authentication provider returned an invalid result."
        };
      }

      this.currentSession =
        this.cloneSession(
          result.session
        );

      return {

        success:
          result.success,

        session:
          this.getSession(),

        message:
          result.message
      };

    } catch (
      error
    ) {

      console.error(
        "[RaceNova] Authentication sign-in failed:",
        error
      );

      this.currentSession = {

        status:
          AuthenticationStatus.ERROR,

        identity:
          null
      };

      return {

        success:
          false,

        session:
          this.getSession(),

        message:
          "Authentication failed."
      };
    }
  }

  // ==========================================================
  // Sign Out
  // ==========================================================

  /**
   * Ends the current authentication
   * session through the provider boundary.
   *
   * This does NOT delete PlayerSaveData
   * or PlayerProfile persistence.
   */
  public async signOut():
    Promise<AuthenticationResult> {

    try {

      const result =
        await this.boundary
          .signOut();

      if (
        !result ||
        !result.session
      ) {

        this.currentSession = {

          status:
            AuthenticationStatus.ERROR,

          identity:
            null
        };

        return {

          success:
            false,

          session:
            this.getSession(),

          message:
            "Authentication provider returned an invalid result."
        };
      }

      this.currentSession =
        this.cloneSession(
          result.session
        );

      return {

        success:
          result.success,

        session:
          this.getSession(),

        message:
          result.message
      };

    } catch (
      error
    ) {

      console.error(
        "[RaceNova] Authentication sign-out failed:",
        error
      );

      return {

        success:
          false,

        session:
          this.getSession(),

        message:
          "Authentication sign-out failed."
      };
    }
  }

  // ==========================================================
  // Refresh Session
  // ==========================================================

  /**
   * Reads the current provider session.
   *
   * No network or token operation is
   * performed by the manager itself.
   */
  public refreshSession():
    AuthenticationSession {

    try {

      const session =
        this.boundary
          .getSession();

      if (
        !session
      ) {

        this.currentSession = {

          status:
            AuthenticationStatus.ERROR,

          identity:
            null
        };

        return this.getSession();
      }

      this.currentSession =
        this.cloneSession(
          session
        );

      return this.getSession();

    } catch (
      error
    ) {

      console.error(
        "[RaceNova] Authentication session refresh failed:",
        error
      );

      this.currentSession = {

        status:
          AuthenticationStatus.ERROR,

        identity:
          null
      };

      return this.getSession();
    }
  }

  // ==========================================================
  // Get Session
  // ==========================================================

  /**
   * Returns a defensive copy of the
   * current authentication session.
   */
  public getSession():
    AuthenticationSession {

    return this.cloneSession(
      this.currentSession
    );
  }

  // ==========================================================
  // Get Identity
  // ==========================================================

  /**
   * Returns the current authenticated
   * identity when available.
   */
  public getIdentity():
    AuthenticationIdentity | null {

    if (
      !this.currentSession.identity
    ) {
      return null;
    }

    return {

      subject:
        this.currentSession.identity.subject,

      provider:
        this.currentSession.identity.provider,

      displayName:
        this.currentSession.identity.displayName
    };
  }

  // ==========================================================
  // Is Authenticated
  // ==========================================================

  /**
   * Checks the manager's current
   * authentication state.
   */
  public isAuthenticated():
    boolean {

    return (
      this.currentSession.status ===
      AuthenticationStatus.AUTHENTICATED &&
      this.currentSession.identity !==
      null
    );
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  /**
   * Clears only the manager's in-memory
   * authentication session.
   *
   * Provider sign-out must be performed
   * explicitly through signOut().
   */
  public dispose():
    void {

    this.currentSession = {

      status:
        AuthenticationStatus.SIGNED_OUT,

      identity:
        null
    };
  }

  // ==========================================================
  // Clone Session
  // ==========================================================

  /**
   * Creates a defensive session copy.
   */
  private cloneSession(
    session:
      AuthenticationSession
  ):
    AuthenticationSession {

    return {

      status:
        session.status,

      identity:
        session.identity
          ? {

              subject:
                session.identity.subject,

              provider:
                session.identity.provider,

              displayName:
                session.identity.displayName

            }
          : null
    };
  }
}
