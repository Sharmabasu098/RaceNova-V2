/**
 * ============================================================
 * RaceNova V2
 * Authentication Runtime
 * M11.5.2 — Runtime Composition
 * ============================================================
 *
 * Purpose:
 * - Compose AuthenticationProviderAdapter
 * - Create AuthenticationManager with the adapter
 * - Keep runtime authentication wiring provider-neutral
 *
 * IMPORTANT:
 * - NO Pi SDK
 * - NO Google SDK
 * - NO network requests
 * - NO fetch()
 * - NO localStorage
 * - NO token persistence
 * - NO wallet passphrase
 * - NO secret phrase
 * - NO UI logic
 * - NO gameplay logic
 * - NO Three.js dependency
 *
 * M11.5.2 = RUNTIME COMPOSITION ONLY.
 * ============================================================
 */

import {
  AuthenticationProvider,
  type AuthenticationResult,
  type AuthenticationSession
} from "./AuthenticationBoundary";

import {
  AuthenticationProviderAdapter,
  ConfiguredAuthenticationProviderAdapter,
  type AuthenticationProviderAdapterHandlers
} from "./AuthenticationProviderAdapter";

import {
  AuthenticationManager
} from "../AuthenticationManager";

// ============================================================
// Runtime Configuration
// ============================================================

export interface AuthenticationRuntimeConfiguration {

  provider:
    AuthenticationProvider;

  handlers:
    AuthenticationProviderAdapterHandlers;
}

// ============================================================
// Authentication Runtime
// ============================================================

export class AuthenticationRuntime {

  private readonly adapter:
    AuthenticationProviderAdapter;

  private readonly manager:
    AuthenticationManager;

  // ==========================================================
  // Constructor
  // ==========================================================

  private constructor(
    configuration:
      AuthenticationRuntimeConfiguration
  ) {

    this.adapter =
      new ConfiguredAuthenticationProviderAdapter(
        configuration.provider,
        configuration.handlers
      );

    this.manager =
      new AuthenticationManager(
        this.adapter
      );
  }

  // ==========================================================
  // Create Runtime
  // ==========================================================

  public static create(
    configuration:
      AuthenticationRuntimeConfiguration
  ):
    AuthenticationRuntime {

    return new AuthenticationRuntime(
      configuration
    );
  }

  // ==========================================================
  // Get Authentication Manager
  // ==========================================================

  public getManager():
    AuthenticationManager {

    return this.manager;
  }

  // ==========================================================
  // Get Provider Adapter
  // ==========================================================

  public getAdapter():
    AuthenticationProviderAdapter {

    return this.adapter;
  }

  // ==========================================================
  // Get Session
  // ==========================================================

  public getSession():
    AuthenticationSession {

    return this.manager.getSession();
  }

  // ==========================================================
  // Is Authenticated
  // ==========================================================

  public isAuthenticated():
    boolean {

    return this.manager.isAuthenticated();
  }

  // ==========================================================
  // Sign In
  // ==========================================================

  public async signIn():
    Promise<AuthenticationResult> {

    return this.manager.signIn();
  }

  // ==========================================================
  // Sign Out
  // ==========================================================

  public async signOut():
    Promise<AuthenticationResult> {

    return this.manager.signOut();
  }

  // ==========================================================
  // Refresh Session
  // ==========================================================

  public refreshSession():
    AuthenticationSession {

    return this.manager.refreshSession();
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  public dispose():
    void {

    this.manager.dispose();
  }
}
