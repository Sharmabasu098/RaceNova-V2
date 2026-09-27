/**
 * ============================================================
 * RaceNova V2
 * M11.2 — Authentication Manager Runtime QA
 * TEMPORARY QA
 * ============================================================
 */

import {
  AuthenticationManager
} from "./../AuthenticationManager";

import {
  AuthenticationProvider,
  AuthenticationStatus,
  type AuthenticationBoundary,
  type AuthenticationResult,
  type AuthenticationSession
} from "./AuthenticationBoundary";

// ============================================================
// Mock Authentication Boundary
// ============================================================

class MockAuthenticationBoundary
  implements AuthenticationBoundary {

  private session:
    AuthenticationSession = {

      status:
        AuthenticationStatus.SIGNED_OUT,

      identity:
        null
    };

  public async signIn():
    Promise<AuthenticationResult> {

    this.session = {

      status:
        AuthenticationStatus.AUTHENTICATED,

      identity: {

        subject:
          "m11-qa-user",

        provider:
          AuthenticationProvider.GOOGLE,

        displayName:
          "M11 QA User"
      }
    };

    return {

      success:
        true,

      session:
        this.session
    };
  }

  public async signOut():
    Promise<AuthenticationResult> {

    this.session = {

      status:
        AuthenticationStatus.SIGNED_OUT,

      identity:
        null
    };

    return {

      success:
        true,

      session:
        this.session
    };
  }

  public getSession():
    AuthenticationSession {

    return {

      status:
        this.session.status,

      identity:
        this.session.identity
          ? {
              subject:
                this.session.identity.subject,

              provider:
                this.session.identity.provider,

              displayName:
                this.session.identity.displayName
            }
          : null
    };
  }

  public isAuthenticated():
    boolean {

    return (
      this.session.status ===
      AuthenticationStatus.AUTHENTICATED &&
      this.session.identity !==
      null
    );
  }
}

// ============================================================
// Assertion
// ============================================================

function assert(
  condition: boolean,
  message: string
):
  void {

  if (!condition) {

    throw new Error(
      "M11.2 QA failed: " +
      message
    );
  }
}

// ============================================================
// QA Runner
// ============================================================

export async function
runM11_2_AuthenticationManagerQA():
  Promise<void> {

  const boundary =
    new MockAuthenticationBoundary();

  const manager =
    new AuthenticationManager(
      boundary
    );

  // ----------------------------------------------------------
  // 1. Initial state
  // ----------------------------------------------------------

  const initialSession =
    manager.getSession();

  assert(
    initialSession.status ===
      AuthenticationStatus.SIGNED_OUT,
    "Initial status must be SIGNED_OUT."
  );

  assert(
    initialSession.identity === null,
    "Initial identity must be null."
  );

  assert(
    manager.isAuthenticated() === false,
    "Initial authentication state must be false."
  );

  // ----------------------------------------------------------
  // 2. Sign in
  // ----------------------------------------------------------

  const signInResult =
    await manager.signIn();

  assert(
    signInResult.success === true,
    "Sign-in result must be successful."
  );

  assert(
    signInResult.session.status ===
      AuthenticationStatus.AUTHENTICATED,
    "Session must become AUTHENTICATED."
  );

  assert(
    signInResult.session.identity !== null,
    "Authenticated identity must exist."
  );

  assert(
    signInResult.session.identity?.subject ===
      "m11-qa-user",
    "Authenticated subject must match."
  );

  assert(
    manager.isAuthenticated() === true,
    "Manager must report authenticated."
  );

  // ----------------------------------------------------------
  // 3. Identity accessor
  // ----------------------------------------------------------

  const identity =
    manager.getIdentity();

  assert(
    identity !== null,
    "getIdentity() must return identity."
  );

  assert(
    identity?.provider ===
      AuthenticationProvider.GOOGLE,
    "Provider must be GOOGLE in mock QA."
  );

  // ----------------------------------------------------------
  // 4. Defensive session copy
  // ----------------------------------------------------------

  const copiedSession =
    manager.getSession();

  if (
    copiedSession.identity
  ) {

    copiedSession.identity.displayName =
      "Modified QA Copy";
  }

  const protectedSession =
    manager.getSession();

  assert(
    protectedSession.identity?.displayName ===
      "M11 QA User",
    "Session must be returned defensively."
  );

  // ----------------------------------------------------------
  // 5. Refresh session
  // ----------------------------------------------------------

  const refreshedSession =
    manager.refreshSession();

  assert(
    refreshedSession.status ===
      AuthenticationStatus.AUTHENTICATED,
    "refreshSession() must preserve authenticated state."
  );

  // ----------------------------------------------------------
  // 6. Sign out
  // ----------------------------------------------------------

  const signOutResult =
    await manager.signOut();

  assert(
    signOutResult.success === true,
    "Sign-out result must be successful."
  );

  assert(
    signOutResult.session.status ===
      AuthenticationStatus.SIGNED_OUT,
    "Session must become SIGNED_OUT."
  );

  assert(
    manager.isAuthenticated() === false,
    "Manager must report signed out."
  );

  assert(
    manager.getIdentity() === null,
    "Identity must be cleared after sign-out."
  );

  // ----------------------------------------------------------
  // 7. Dispose
  // ----------------------------------------------------------

  manager.dispose();

  const disposedSession =
    manager.getSession();

  assert(
    disposedSession.status ===
      AuthenticationStatus.SIGNED_OUT,
    "Dispose must clear session."
  );

  assert(
    disposedSession.identity === null,
    "Dispose must clear identity."
  );

  // ----------------------------------------------------------
  // PASS
  // ----------------------------------------------------------

  alert(
    "M11.2 Authentication Manager QA — PASS ✅"
  );
}
