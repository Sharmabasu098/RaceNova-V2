/**
 * ============================================================
 * RaceNova V2
 * Google Authentication Provider
 * M11.8.8 — Google UI Cleanup
 * ============================================================
 *
 * Responsibilities:
 * - Initialize Google Identity Services
 * - Render the official Google button
 * - Receive the Google credential callback
 * - Verify the credential through the RaceNova Google Worker
 * - Convert verified identity into AuthenticationSession
 * - Keep Google credential memory-only
 * - Clear GIS login UI after successful verification
 * - Restore GIS login UI after sign-out or verification failure
 *
 * IMPORTANT:
 * - No Google client secret
 * - No token persistence
 * - No localStorage
 * - No OAuth redirect
 * - No One Tap / prompt()
 * - No Pi SDK
 * - No gameplay logic
 * ============================================================
 */

import {
  AuthenticationProvider,
  AuthenticationStatus,
  type AuthenticationResult,
  type AuthenticationSession
} from "./AuthenticationBoundary";

// ============================================================
// Google Identity Services Types
// ============================================================

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(options: {
    client_id: string;
    callback: (
      response: GoogleCredentialResponse
    ) => void;
  }): void;

  renderButton(
    parent: HTMLElement,
    options: {
      type: "standard";
      theme: "outline";
      size: "large";
    }
  ): void;

  disableAutoSelect(): void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

interface GoogleIdentityServices {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

// ============================================================
// Provider Configuration
// ============================================================

export interface GoogleAuthenticationProviderConfig {
  clientId: string;
  verificationUrl: string;
  onResult?: (
    result: AuthenticationResult
  ) => void;
}

// ============================================================
// Worker Response
// ============================================================

interface GoogleVerificationSuccess {
  success: true;
  provider: "google";
  identity: {
    subject: string;
    displayName: string;
  };
}

interface GoogleVerificationFailure {
  success: false;
  error?: string;
}

type GoogleVerificationResponse =
  | GoogleVerificationSuccess
  | GoogleVerificationFailure;

// ============================================================
// Google Authentication Provider
// ============================================================

export class GoogleAuthenticationProvider {

  private readonly clientId: string;

  private readonly verificationUrl: string;

  private readonly onResult?: (
    result: AuthenticationResult
  ) => void;

  private session:
    AuthenticationSession = {
      status:
        AuthenticationStatus.SIGNED_OUT,
      identity:
        null
    };

  private initialized =
    false;

  private googleReady =
    false;

  private renderContainer:
    HTMLElement | null =
      null;

  private readyAttempts =
    0;

  private waitingForGoogle =
    false;

  constructor(
    config:
      GoogleAuthenticationProviderConfig
  ) {

    this.clientId =
      config.clientId;

    this.verificationUrl =
      config.verificationUrl;

    this.onResult =
      config.onResult;
  }

  // ==========================================================
  // Initialize
  // ==========================================================

  public initialize():
    void {

    if (
      this.initialized
    ) {
      return;
    }

    this.initialized =
      true;

    this.waitForGoogleIdentityServices();
  }

  // ==========================================================
  // Render Official Google Button
  // ==========================================================

  public renderButton(
    container:
      HTMLElement
  ):
    void {

    this.renderContainer =
      container;

    container.replaceChildren();

    if (
      this.googleReady &&
      window.google
    ) {

      this.renderGoogleButton();

      return;
    }

    this.waitForGoogleIdentityServices();
  }

  // ==========================================================
  // Current Session
  // ==========================================================

  public getSession():
    AuthenticationSession {

    return this.session;
  }

  // ==========================================================
  // Sign Out
  // ==========================================================

  public async signOut():
    Promise<AuthenticationResult> {

    try {

      if (
        window.google
      ) {

        window.google.accounts.id
          .disableAutoSelect();
      }

      this.session = {
        status:
          AuthenticationStatus.SIGNED_OUT,
        identity:
          null
      };

      // ------------------------------------------------------
      // M11.8.8 — Restore Google Login UI
      // ------------------------------------------------------

      this.renderGoogleButton();

      const result:
        AuthenticationResult = {
        success:
          true,
        session:
          this.session
      };

      this.onResult?.(
        result
      );

      return result;

    } catch (
      error
    ) {

      return this.createErrorResult(
        error instanceof Error
          ? error.message
          : String(error)
      );
    }
  }

  // ==========================================================
  // GIS Ready Handling
  // ==========================================================

  private waitForGoogleIdentityServices():
    void {

    if (
      this.googleReady ||
      this.waitingForGoogle
    ) {
      return;
    }

    this.waitingForGoogle =
      true;

    if (
      window.google?.accounts?.id
    ) {

      this.googleReady =
        true;

      this.waitingForGoogle =
        false;

      window.google.accounts.id
        .initialize({
          client_id:
            this.clientId,
          callback:
            this.handleCredentialResponse
        });

      if (
        this.renderContainer
      ) {

        this.renderGoogleButton();
      }

      return;
    }

    if (
      this.readyAttempts >= 100
    ) {

      this.waitingForGoogle =
        false;

      const result =
        this.createErrorResult(
          "Google Identity Services is unavailable."
        );

      this.onResult?.(
        result
      );

      return;
    }

    this.readyAttempts +=
      1;

    this.waitingForGoogle =
      false;

    window.setTimeout(
      () => {
        this.waitForGoogleIdentityServices();
      },
      100
    );
  }

  // ==========================================================
  // Render Google Button
  // ==========================================================

  private renderGoogleButton():
    void {

    if (
      !this.renderContainer ||
      !window.google ||
      !this.googleReady
    ) {
      return;
    }

    this.renderContainer.replaceChildren();

    window.google.accounts.id
      .renderButton(
        this.renderContainer,
        {
          type:
            "standard",
          theme:
            "outline",
          size:
            "large"
        }
      );
  }

  // ==========================================================
  // Google Credential Callback
  // ==========================================================

  private readonly handleCredentialResponse =
    async (
      response:
        GoogleCredentialResponse
    ):
      Promise<void> => {

      if (
        !response?.credential
      ) {

        const result =
          this.createErrorResult(
            "Google credential was not returned."
          );

        this.renderGoogleButton();

        this.onResult?.(
          result
        );

        return;
      }

      this.session = {
        status:
          AuthenticationStatus.AUTHENTICATING,
        identity:
          null
      };

      try {

        const verifyResponse =
          await fetch(
            this.verificationUrl,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  credential:
                    response.credential
                }),

              cache:
                "no-store"
            }
          );

        if (
          !verifyResponse.ok
        ) {

          throw new Error(
            `Google verification failed with HTTP ${verifyResponse.status}.`
          );
        }

        const verified =
          await verifyResponse.json() as
            GoogleVerificationResponse;

        if (
          !verified.success
        ) {

          throw new Error(
            verified.error ||
            "Google verification failed."
          );
        }

        if (
          !verified.identity.subject ||
          !verified.identity.displayName
        ) {

          throw new Error(
            "Google verification returned an incomplete identity."
          );
        }

        this.session = {
          status:
            AuthenticationStatus.AUTHENTICATED,

          identity: {
            subject:
              verified.identity.subject,

            provider:
              AuthenticationProvider.GOOGLE,

            displayName:
              verified.identity.displayName
          }
        };

        // ----------------------------------------------------
        // M11.8.8 — Clear GIS Login Button after verification
        // ----------------------------------------------------

        if (
          this.renderContainer
        ) {

          this.renderContainer.replaceChildren();
        }

        const result:
          AuthenticationResult = {
          success:
            true,

          session:
            this.session
        };

        this.onResult?.(
          result
        );

      } catch (
        error
      ) {

        const result =
          this.createErrorResult(
            error instanceof Error
              ? error.message
              : String(error)
          );

        // ----------------------------------------------------
        // M11.8.8 — Restore GIS UI after failure
        // ----------------------------------------------------

        this.renderGoogleButton();

        this.onResult?.(
          result
        );
      }
    };

  // ==========================================================
  // Error Result
  // ==========================================================

  private createErrorResult(
    message:
      string
  ):
    AuthenticationResult {

    this.session = {
      status:
        AuthenticationStatus.ERROR,
      identity:
        null
    };

    return {
      success:
        false,
      session:
        this.session,
      message
    };
  }
}
