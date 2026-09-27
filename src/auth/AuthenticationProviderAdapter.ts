/**
 * ============================================================
 * RaceNova V2
 * Authentication Provider Adapter
 * M11.3 — Provider Adapter
 * ============================================================
 *
 * Purpose:
 * - Provide a provider-neutral adapter boundary
 * - Allow Pi / Google providers to plug into AuthenticationManager
 * - Keep provider SDKs outside AuthenticationManager
 *
 * IMPORTANT:
 * - NO Pi SDK
 * - NO Google SDK
 * - NO network requests
 * - NO token persistence
 * - NO localStorage
 * - NO wallet passphrase
 * - NO secret phrase
 * - NO UI logic
 * - NO Three.js dependency
 *
 * M11.3 = PROVIDER ADAPTER CONTRACT ONLY.
 * ============================================================
 */

import {
  AuthenticationProvider,
  AuthenticationStatus,
  type AuthenticationBoundary,
  type AuthenticationResult,
  type AuthenticationSession
} from "./AuthenticationBoundary";

export interface AuthenticationProviderAdapter
  extends AuthenticationBoundary {

  readonly provider:
    AuthenticationProvider;
}

export interface AuthenticationProviderAdapterHandlers {

  signIn():
    Promise<AuthenticationResult>;

  signOut():
    Promise<AuthenticationResult>;

  getSession():
    AuthenticationSession;
}

/**
 * Provider-neutral adapter implementation.
 *
 * Future Pi / Google adapters can supply
 * their own handlers without changing
 * AuthenticationManager.
 */
export class ConfiguredAuthenticationProviderAdapter
  implements AuthenticationProviderAdapter {

  public readonly provider:
    AuthenticationProvider;

  private readonly handlers:
    AuthenticationProviderAdapterHandlers;

  constructor(
    provider:
      AuthenticationProvider,

    handlers:
      AuthenticationProviderAdapterHandlers
  ) {

    this.provider =
      provider;

    this.handlers =
      handlers;
  }

  public signIn():
    Promise<AuthenticationResult> {

    return this.handlers
      .signIn();
  }

  public signOut():
    Promise<AuthenticationResult> {

    return this.handlers
      .signOut();
  }

  public getSession():
    AuthenticationSession {

    return this.handlers
      .getSession();
  }

  public isAuthenticated():
    boolean {

    const session =
      this.getSession();

    return (
      session.status ===
        AuthenticationStatus.AUTHENTICATED &&
      session.identity !==
        null
    );
  }
  }
