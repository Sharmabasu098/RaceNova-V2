/**
 * ============================================================
 * RaceNova V2
 * M11.3 — Provider Adapter QA
 * ============================================================
 *
 * Temporary runtime QA.
 *
 * Verifies:
 * - Provider identity
 * - signIn delegation
 * - signOut delegation
 * - getSession delegation
 * - isAuthenticated()
 * - Pi adapter contract
 * - Google adapter contract
 *
 * IMPORTANT:
 * - Mock handlers only
 * - No Pi SDK
 * - No Google SDK
 * - No network
 * - No localStorage
 * - No authentication credentials
 * - Temporary QA only
 * ============================================================
 */

import {
  AuthenticationProvider,
  AuthenticationStatus,
  type AuthenticationResult,
  type AuthenticationSession
} from "./AuthenticationBoundary";

import {
  ConfiguredAuthenticationProviderAdapter
} from "./AuthenticationProviderAdapter";

function createMockAdapter(
  provider:
    AuthenticationProvider
) {

  let session:
    AuthenticationSession = {
      status:
        AuthenticationStatus.SIGNED_OUT,
      identity:
        null
    };

  const adapter =
    new ConfiguredAuthenticationProviderAdapter(
      provider,
      {
        signIn:
          async (): Promise<AuthenticationResult> => {

            session = {
              status:
                AuthenticationStatus.AUTHENTICATED,

              identity: {
                subject:
                  `qa-${provider}-subject`,

                provider:
                  provider,

                displayName:
                  `QA ${provider}`
              }
            };

            return {
              success:
                true,

              session:
                session
            };
          },

        signOut:
          async (): Promise<AuthenticationResult> => {

            session = {
              status:
                AuthenticationStatus.SIGNED_OUT,

              identity:
                null
            };

            return {
              success:
                true,

              session:
                session
            };
          },

        getSession:
          (): AuthenticationSession => {

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
    );

  return adapter;
}

async function verifyProviderAdapter(
  provider:
    AuthenticationProvider
): Promise<boolean> {

  const adapter =
    createMockAdapter(
      provider
    );

  if (
    adapter.provider !==
    provider
  ) {
    return false;
  }

  const initialSession =
    adapter.getSession();

  if (
    initialSession.status !==
      AuthenticationStatus.SIGNED_OUT
  ) {
    return false;
  }

  if (
    initialSession.identity !==
      null
  ) {
    return false;
  }

  if (
    adapter.isAuthenticated()
  ) {
    return false;
  }

  const signInResult =
    await adapter.signIn();

  if (
    !signInResult.success
  ) {
    return false;
  }

  if (
    signInResult.session.status !==
      AuthenticationStatus.AUTHENTICATED
  ) {
    return false;
  }

  if (
    signInResult.session.identity ===
      null
  ) {
    return false;
  }

  if (
    signInResult.session.identity.provider !==
      provider
  ) {
    return false;
  }

  if (
    !adapter.isAuthenticated()
  ) {
    return false;
  }

  const authenticatedSession =
    adapter.getSession();

  if (
    authenticatedSession.status !==
      AuthenticationStatus.AUTHENTICATED
  ) {
    return false;
  }

  if (
    authenticatedSession.identity ===
      null
  ) {
    return false;
  }

  const signOutResult =
    await adapter.signOut();

  if (
    !signOutResult.success
  ) {
    return false;
  }

  if (
    signOutResult.session.status !==
      AuthenticationStatus.SIGNED_OUT
  ) {
    return false;
  }

  if (
    signOutResult.session.identity !==
      null
  ) {
    return false;
  }

  if (
    adapter.isAuthenticated()
  ) {
    return false;
  }

  const finalSession =
    adapter.getSession();

  if (
    finalSession.status !==
      AuthenticationStatus.SIGNED_OUT
  ) {
    return false;
  }

  if (
    finalSession.identity !==
      null
  ) {
    return false;
  }

  return true;
}

export async function
runM11_3_ProviderAdapterQA():
  Promise<void> {

  try {

    const piPass =
      await verifyProviderAdapter(
        AuthenticationProvider.PI
      );

    const googlePass =
      await verifyProviderAdapter(
        AuthenticationProvider.GOOGLE
      );

    if (
      !piPass ||
      !googlePass
    ) {

      throw new Error(
        "Provider adapter verification failed."
      );
    }

    window.alert(
      "M11.3 Provider Adapter QA — PASS ✅"
    );

  } catch (
    error
  ) {

    console.error(
      "[RaceNova] M11.3 Provider Adapter QA failed:",
      error
    );

    window.alert(
      "M11.3 Provider Adapter QA — FAIL ❌"
    );
  }
}
