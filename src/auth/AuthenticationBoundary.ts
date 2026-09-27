/**
 * ============================================================
 * RaceNova V2
 * Authentication Boundary
 * M11.1 — Authentication Contract
 * ============================================================
 *
 * Purpose:
 * - Define the RaceNova authentication boundary
 * - Separate authentication from gameplay
 * - Separate authentication from PlayerProfile persistence
 * - Prepare Pi and Google authentication adapters
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
 * M11.1 = CONTRACT ONLY.
 *
 * Architecture:
 *
 * Authentication Provider
 *          ↓
 * AuthenticationBoundary
 *          ↓
 * AuthenticationManager
 *          ↓
 * PlayerProfile identity
 *
 * Authentication does NOT own:
 * - PlayerSaveData
 * - Economy
 * - Garage
 * - Upgrades
 * - Race progression
 * ============================================================
 */

// ============================================================
// Authentication Provider
// ============================================================

/**
 * Supported RaceNova authentication providers.
 *
 * Provider implementations are added in
 * later M11 milestones.
 */
export enum AuthenticationProvider {

  /**
   * Pi App / Pi ecosystem authentication.
   */
  PI = "pi",

  /**
   * Standalone Web / Android authentication.
   */
  GOOGLE = "google"
}

// ============================================================
// Authentication Status
// ============================================================

export enum AuthenticationStatus {

  /**
   * No authenticated identity is active.
   */
  SIGNED_OUT = "signed-out",

  /**
   * Authentication is currently in progress.
   */
  AUTHENTICATING = "authenticating",

  /**
   * A valid authenticated identity exists.
   */
  AUTHENTICATED = "authenticated",

  /**
   * Authentication failed.
   */
  ERROR = "error"
}

// ============================================================
// Authentication Identity
// ============================================================

/**
 * Authenticated identity returned by a
 * future authentication provider.
 *
 * This is identity metadata only.
 *
 * Gameplay PlayerSaveData is intentionally
 * NOT stored here.
 */
export interface AuthenticationIdentity {

  /**
   * Stable provider-specific account subject.
   *
   * This value is an identity reference,
   * not a wallet passphrase or secret phrase.
   */
  subject: string;

  /**
   * Authentication provider.
   */
  provider:
    AuthenticationProvider;

  /**
   * Optional player-facing display name.
   */
  displayName: string;
}

// ============================================================
// Authentication Session
// ============================================================

/**
 * Current authentication session.
 *
 * No access token or secret is exposed by
 * this contract.
 */
export interface AuthenticationSession {

  /**
   * Current authentication state.
   */
  status:
    AuthenticationStatus;

  /**
   * Authenticated identity when available.
   */
  identity:
    AuthenticationIdentity | null;
}

// ============================================================
// Authentication Result
// ============================================================

/**
 * Result returned by a future sign-in
 * implementation.
 */
export interface AuthenticationResult {

  /**
   * Whether authentication succeeded.
   */
  success: boolean;

  /**
   * Authentication session after the operation.
   */
  session:
    AuthenticationSession;

  /**
   * Optional diagnostic message.
   */
  message?: string;
}

// ============================================================
// Authentication Boundary
// ============================================================

/**
 * Provider-neutral authentication contract.
 *
 * Future Pi and Google adapters will implement
 * this boundary.
 *
 * Authentication implementation remains
 * completely outside gameplay systems.
 */
export interface AuthenticationBoundary {

  /**
   * Sign in using the provider implementation.
   */
  signIn():
    Promise<AuthenticationResult>;

  /**
   * Sign out the current authentication session.
   */
  signOut():
    Promise<AuthenticationResult>;

  /**
   * Return the current authentication session.
   */
  getSession():
    AuthenticationSession;

  /**
   * Check whether an authenticated identity
   * is currently available.
   */
  isAuthenticated():
    boolean;
}
