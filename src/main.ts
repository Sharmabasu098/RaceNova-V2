/**
 * ============================================================
 * RaceNova V2
 * Application Entry Point
 * M11.6.2 — Pi Sign-In OAuth Integration
 * ============================================================
 *
 * Responsibilities:
 * - Create RaceNovaEngine
 * - Create MainMenu
 * - Create CampaignMenu
 * - Connect Main Menu navigation
 * - Connect Campaign navigation
 * - Pass selected campaign race to the engine
 * - Update Main Menu from PlayerProgress
 * - Handle Traffic Crash → Main Menu
 * - Handle Race Result → Main Menu
 * - Compose REAL Pi Sign-In OAuth authentication
 *
 * IMPORTANT:
 * - No Three.js code here
 * - No gameplay logic here
 * - Engine remains responsible for gameplay
 * - MainMenu remains responsible for main-menu UI
 * - CampaignMenu remains responsible for campaign UI
 * - RaceResultUI remains responsible for result UI
 * - No save logic here
 *
 * M11.6.2:
 * - REAL Pi Sign-In OAuth flow
 * - Pi OAuth redirect
 * - OAuth state verification
 * - Pi /v2/me identity verification
 * - No Google authentication
 * - No wallet passphrase
 * - No secret phrase
 * - No token persistence
 * - Access token remains memory-only
 * ============================================================
 */

import {
  RaceNovaEngine
} from "./core/RaceNovaEngine";

import {
  MainMenu
} from "./ui/MainMenu";

import {
  CampaignMenu
} from "./ui/CampaignMenu";

import {
  AuthenticationProvider,
  AuthenticationStatus,
  type AuthenticationResult,
  type AuthenticationSession
} from "./auth/AuthenticationBoundary";

import {
  AuthenticationRuntime
} from "./auth/AuthenticationRuntime";


// ============================================================
// Pi Sign-In OAuth Types
// ============================================================

interface PiSignInOptions {

  clientId:
    string;

  redirectUri:
    string;

  scopes?:
    string[];

  state?:
    string;
}

interface PiSdk {

  init(
    options: {
      version:
        string;
    }
  ):
    void;

  signIn(
    options:
      PiSignInOptions
  ):
    void;
}

declare global {

  interface Window {

    Pi?:
      PiSdk;
  }
}


// ============================================================
// Pi Configuration
// ============================================================
//
// IMPORTANT:
// Replace only PI_CLIENT_ID with the OAuth Client ID
// from the Pi Developer Portal.
//
// The Client ID is public and belongs in frontend code.
//
// ============================================================

const PI_CLIENT_ID =
  "IE4XWxaFCY63IGJLmjSkQZ91mtPU-4PKWCEswORheg";

const PI_REDIRECT_URI =
  "https://sharmabasu098.github.io/RaceNova-V2/";

const PI_SCOPES =
  [
    "username"
  ];


// ============================================================
// Pi Runtime State
// ============================================================

let piSdkInitialized =
  false;

let currentPiAccessToken:
  string | null =
    null;

let currentPiSession:
  AuthenticationSession = {

  status:
    AuthenticationStatus.SIGNED_OUT,

  identity:
    null
};

let piCallbackMessage:
  string | undefined;


// ============================================================
// Pi SDK Loader
// ============================================================

const loadPiSdk =
  async (): Promise<PiSdk> => {

    if (
      window.Pi
    ) {

      return window.Pi;
    }

    const existingScript =
      document.querySelector(
        'script[data-racenova-pi-sdk="true"]'
      );

    if (
      existingScript
    ) {

      await new Promise<void>(
        (
          resolve,
          reject
        ) => {

          const timeout =
            window.setTimeout(
              () => {

                reject(
                  new Error(
                    "RaceNova: Pi SDK load timeout."
                  )
                );

              },
              15000
            );

          existingScript.addEventListener(
            "load",
            () => {

              window.clearTimeout(
                timeout
              );

              resolve();

            },
            {
              once:
                true
            }
          );

          existingScript.addEventListener(
            "error",
            () => {

              window.clearTimeout(
                timeout
              );

              reject(
                new Error(
                  "RaceNova: Pi SDK failed to load."
                )
              );

            },
            {
              once:
                true
            }
          );
        }
      );

    } else {

      await new Promise<void>(
        (
          resolve,
          reject
        ) => {

          const script =
            document.createElement(
              "script"
            );

          script.src =
            "https://sdk.minepi.com/pi-sdk.js";

          script.async =
            true;

          script.dataset.racenovaPiSdk =
            "true";

          script.onload =
            () => {

              resolve();
            };

          script.onerror =
            () => {

              reject(
                new Error(
                  "RaceNova: Unable to load Pi SDK."
                )
              );
            };

          document.head.appendChild(
            script
          );
        }
      );
    }

    if (
      !window.Pi
    ) {

      throw new Error(
        "RaceNova: Pi SDK loaded but window.Pi is unavailable."
      );
    }

    return window.Pi;
  };


// ============================================================
// Pi OAuth Fragment Cleanup
// ============================================================

const clearPiOAuthFragment =
  (): void => {

    window.history.replaceState(
      null,
      document.title,
      window.location.pathname +
        window.location.search
    );
  };


// ============================================================
// Pi OAuth Callback
// ============================================================
//
// Pi Sign-In returns the OAuth result in the URL fragment:
//
// #access_token=...
// &token_type=Bearer
// &expires_in=3600
// &state=...
//
// RaceNova:
// 1. Reads state
// 2. Verifies state
// 3. Reads access token
// 4. Calls Pi /v2/me
// 5. Uses verified identity
// 6. Removes OAuth fragment from URL
//
// ============================================================

const processPiOAuthCallback =
  async (): Promise<void> => {

    const hash =
      window.location.hash;

    if (
      !hash
    ) {

      return;
    }


    // ----------------------------------------------------------
    // Parse OAuth Fragment
    // ----------------------------------------------------------

    const params =
      new URLSearchParams(
        hash.slice(1)
      );


    const state =
      params.get(
        "state"
      );


    const expectedState =
      sessionStorage.getItem(
        "pi_oauth_state"
      );


    // ----------------------------------------------------------
    // State is single-use
    // ----------------------------------------------------------

    sessionStorage.removeItem(
      "pi_oauth_state"
    );


    // ----------------------------------------------------------
    // Verify OAuth State
    // ----------------------------------------------------------

    if (
      !state ||
      !expectedState ||
      state !== expectedState
    ) {

      currentPiSession = {

        status:
          AuthenticationStatus.ERROR,

        identity:
          null
      };

      piCallbackMessage =
        "Pi Sign-In state verification failed.";

      clearPiOAuthFragment();

      return;
    }


    // ----------------------------------------------------------
    // OAuth Error
    // ----------------------------------------------------------

    const error =
      params.get(
        "error"
      );

    if (
      error
    ) {

      currentPiSession = {

        status:
          AuthenticationStatus.ERROR,

        identity:
          null
      };

      piCallbackMessage =
        `Pi Sign-In failed: ${error}`;

      clearPiOAuthFragment();

      return;
    }


    // ----------------------------------------------------------
    // Access Token
    // ----------------------------------------------------------

    const accessToken =
      params.get(
        "access_token"
      );

    if (
      !accessToken
    ) {

      currentPiSession = {

        status:
          AuthenticationStatus.ERROR,

        identity:
          null
      };

      piCallbackMessage =
        "Pi Sign-In did not return an access token.";

      clearPiOAuthFragment();

      return;
    }


    // ----------------------------------------------------------
    // Verify Token with Pi /v2/me
    // ----------------------------------------------------------

    try {

      const response =
        await fetch(
          "https://api.minepi.com/v2/me",
          {

            method:
              "GET",

            headers: {

              Authorization:
                `Bearer ${accessToken}`
            }
          }
        );


      if (
        !response.ok
      ) {

        throw new Error(
          `Pi /me verification failed: HTTP ${response.status}`
        );
      }


      const me =
        await response.json() as {

          uid?:
            string;

          username?:
            string;
        };


      // --------------------------------------------------------
      // Verified Pi Identity
      // --------------------------------------------------------

      if (
        !me.uid
      ) {

        throw new Error(
          "Pi /me response did not contain uid."
        );
      }


      // --------------------------------------------------------
      // Memory-only token
      // --------------------------------------------------------

      currentPiAccessToken =
        accessToken;


      // --------------------------------------------------------
      // Authenticated Session
      // --------------------------------------------------------

      currentPiSession = {

        status:
          AuthenticationStatus.AUTHENTICATED,

        identity: {

          subject:
            me.uid,

          provider:
            AuthenticationProvider.PI,

          displayName:
            me.username ||
            "Pi User"
        }
      };


      piCallbackMessage =
        undefined;


      // --------------------------------------------------------
      // Remove access token from browser URL
      // --------------------------------------------------------

      clearPiOAuthFragment();

    } catch (
      error
    ) {

      currentPiAccessToken =
        null;

      currentPiSession = {

        status:
          AuthenticationStatus.ERROR,

        identity:
          null
      };

      piCallbackMessage =
        error instanceof Error
          ? error.message
          : "Pi Sign-In verification failed.";

      clearPiOAuthFragment();
    }
  };


// ============================================================
// Start OAuth Callback Processing
// ============================================================
//
// This starts immediately when RaceNova loads.
//
// If this is a normal launch:
// - no hash
// - nothing happens
//
// If this is a Pi OAuth callback:
// - callback is processed
// - /v2/me is called
// - authenticated session is created
//
// ============================================================

const piOAuthCallbackPromise =
  processPiOAuthCallback();


// ============================================================
// App Container
// ============================================================

const app =
  document.getElementById(
    "app"
  );

if (
  !app
) {

  throw new Error(
    "RaceNova: #app element not found."
  );
}


// ============================================================
// M11.6.2 — REAL Pi Sign-In Authentication Runtime
// ============================================================

const authenticationRuntime =
  AuthenticationRuntime.create({

    provider:
      AuthenticationProvider.PI,

    handlers: {

      // ======================================================
      // PI SIGN IN
      // ======================================================

      signIn:
        async (): Promise<AuthenticationResult> => {

          // --------------------------------------------------
          // Already authenticated
          // --------------------------------------------------

          if (
            currentPiSession.status ===
              AuthenticationStatus.AUTHENTICATED
          ) {

            return {

              success:
                true,

              session:
                currentPiSession
            };
          }


          // --------------------------------------------------
          // Load Pi SDK
          // --------------------------------------------------

          try {

            const Pi =
              await loadPiSdk();


            // ------------------------------------------------
            // Initialize SDK once
            // ------------------------------------------------

            if (
              !piSdkInitialized
            ) {

              Pi.init({

                version:
                  "2.0"
              });

              piSdkInitialized =
                true;
            }


            // ------------------------------------------------
            // Generate OAuth State
            // ------------------------------------------------

            const state =
              crypto.randomUUID();


            sessionStorage.setItem(
              "pi_oauth_state",
              state
            );


            // ------------------------------------------------
            // Set Authentication State
            // ------------------------------------------------

            currentPiSession = {

              status:
                AuthenticationStatus.AUTHENTICATING,

              identity:
                null
            };


            piCallbackMessage =
              undefined;


            // ------------------------------------------------
            // Start Official Pi Sign-In OAuth
            // ------------------------------------------------

            Pi.signIn({

              clientId:
                PI_CLIENT_ID,

              redirectUri:
                PI_REDIRECT_URI,

              scopes:
                PI_SCOPES,

              state
            });


            // ------------------------------------------------
            // Browser will redirect to Pi.
            // ------------------------------------------------

            return {

              success:
                false,

              session:
                currentPiSession,

              message:
                "Redirecting to Pi Sign-In..."
            };

          } catch (
            error
          ) {

            console.error(
              "[RaceNova] Pi Sign-In failed:",
              error
            );


            currentPiSession = {

              status:
                AuthenticationStatus.ERROR,

              identity:
                null
            };


            return {

              success:
                false,

              session:
                currentPiSession,

              message:
                error instanceof Error
                  ? error.message
                  : "Pi Sign-In failed."
            };
          }
        },


      // ======================================================
      // SIGN OUT
      // ======================================================

      signOut:
        async (): Promise<AuthenticationResult> => {

          // --------------------------------------------------
          // Clear memory-only token
          // --------------------------------------------------

          currentPiAccessToken =
            null;


          // --------------------------------------------------
          // Clear OAuth state
          // --------------------------------------------------

          sessionStorage.removeItem(
            "pi_oauth_state"
          );


          // --------------------------------------------------
          // Signed-out state
          // --------------------------------------------------

          currentPiSession = {

            status:
              AuthenticationStatus.SIGNED_OUT,

            identity:
              null
          };


          return {

            success:
              true,

            session:
              currentPiSession
          };
        },


      // ======================================================
      // CURRENT SESSION
      // ======================================================

      getSession:
        (): AuthenticationSession => {

          return currentPiSession;
        }
    }
  });


// ============================================================
// Engine
// ============================================================

const engine =
  new RaceNovaEngine(
    app
  );


// ============================================================
// Campaign Menu Reference
// ============================================================

let campaignMenu:
  CampaignMenu | null =
    null;


// ============================================================
// Main Menu
// ============================================================

const mainMenu =
  new MainMenu(
    app,
    {

      // ======================================================
      // START RACE
      // ======================================================

      onStartRace:
        () => {

          if (
            campaignMenu
          ) {

            campaignMenu.hide();
          }

          engine.start();
        },


      // ======================================================
      // CAMPAIGN
      // ======================================================

      onCampaign:
        () => {

          mainMenu.hide();

          if (
            campaignMenu
          ) {

            campaignMenu.setProgress(
              engine.getPlayerProgress()
            );

            campaignMenu.show();
          }
        },


      // ======================================================
      // GARAGE
      // ======================================================

      onGarage:
        () => {

          mainMenu.hide();

          engine.openGarage();
        },


      // ======================================================
      // M11.6.2 — PI LOGIN
      // ======================================================

      onPiLogin:
        async () => {

          // --------------------------------------------------
          // Already authenticated → Sign Out
          // --------------------------------------------------

          if (
            authenticationRuntime
              .isAuthenticated()
          ) {

            await authenticationRuntime
              .signOut();


            mainMenu.setAuthenticationState(
              false
            );

            return;
          }


          // --------------------------------------------------
          // Start Pi OAuth Sign-In
          // --------------------------------------------------

          const result =
            await authenticationRuntime
              .signIn();


          // --------------------------------------------------
          // OAuth redirect is starting
          //
          // Do NOT mark login as failed.
          // Browser is going to Pi.
          // --------------------------------------------------

          if (
            result.session.status ===
              AuthenticationStatus.AUTHENTICATING
          ) {

            return;
          }


                    // --------------------------------------------------
          // Successful authentication
          // --------------------------------------------------

          if (
            result.success &&
            result.session.identity
          ) {

            mainMenu.setAuthenticationState(
              true,

              result.session.identity
                .displayName
            );

            return;
          }


          // --------------------------------------------------
          // Authentication failed
          // --------------------------------------------------

          mainMenu.setAuthenticationState(
            false
          );


          console.warn(
            "[RaceNova] Pi login failed:",
            result.message
          );
        }
    }
  );


// ============================================================
// M8.8 — Main Menu Progress Refresh
// ============================================================

const refreshMainMenuProgress =
  (): void => {

    mainMenu.setProgress(
      engine.getPlayerProgress()
    );
  };


// ============================================================
// Campaign Menu
// ============================================================

campaignMenu =
  new CampaignMenu(
    app,
    {

      // ======================================================
      // BACK TO MAIN MENU
      // ======================================================

      onBack:
        () => {

          campaignMenu?.hide();

          refreshMainMenuProgress();

          mainMenu.resetStartState();

          mainMenu.show();
        },


      // ======================================================
      // START SELECTED CAMPAIGN RACE
      // ======================================================

      onStartRace:
        (
          raceId:
            string
        ) => {

          if (
            !raceId
          ) {

            return;
          }


          const progress =
            engine.getPlayerProgress();


          const updatedProgress = {

            ...progress,

            selectedRaceId:
              raceId,

            raceProgression: {

              ...progress.raceProgression,

              selectedRaceId:
                raceId,

              races:
                progress
                  .raceProgression
                  .races
                  .map(
                    (
                      race
                    ) => ({

                      ...race
                    })
                  )
            }
          };


          engine.setPlayerProgress(
            updatedProgress
          );


          campaignMenu?.hide();

          mainMenu.resetStartState();

          engine.start();
        }
    }
  );


// ============================================================
// Initial Campaign Progress
// ============================================================

campaignMenu.setProgress(
  engine.getPlayerProgress()
);


// ============================================================
// Initial UI State
// ============================================================

campaignMenu.hide();


// ============================================================
// Traffic Crash → Main Menu
// ============================================================

const handleTrafficCrash =
  (): void => {

    campaignMenu?.hide();

    mainMenu.resetStartState();

    refreshMainMenuProgress();

    mainMenu.show();

    engine.resetRaceState();
  };


window.addEventListener(
  "racenova:traffic-crash",
  handleTrafficCrash
);

// ============================================================
// Race Result → Main Menu
// ============================================================

const handleRaceResultMenu =
  (): void => {

    campaignMenu?.hide();

    mainMenu.resetStartState();

    refreshMainMenuProgress();

    engine.resetRaceState();

    mainMenu.show();
  };


window.addEventListener(
  "racenova:race-result-menu",
  handleRaceResultMenu
);


// ============================================================
// M8.8 — Garage → Main Menu
// ============================================================

const handleGarageClose =
  (): void => {

    refreshMainMenuProgress();

    mainMenu.resetStartState();

    mainMenu.show();
  };


window.addEventListener(
  "racenova:garage-close",
  handleGarageClose
);


// ============================================================
// Initial Main Menu
// ============================================================

refreshMainMenuProgress();

mainMenu.show();


// ============================================================
// M11.6.2 — Apply Pi OAuth Callback Result
// ============================================================
//
// When returning from Pi:
//
// Pi Browser
//      ↓
// RaceNova callback
//      ↓
// /v2/me
//      ↓
// currentPiSession
//      ↓
// MainMenu authentication state
//
// ============================================================

void piOAuthCallbackPromise.then(
  () => {

    if (
      currentPiSession.status ===
        AuthenticationStatus.AUTHENTICATED &&
      currentPiSession.identity
    ) {

      mainMenu.setAuthenticationState(
        true,

        currentPiSession.identity
          .displayName
      );

      return;
    }


    if (
      piCallbackMessage
    ) {

      console.warn(
        "[RaceNova] Pi OAuth callback:",
        piCallbackMessage
      );
    }
  }
);


// ============================================================
// M11.6.2 — Runtime Availability
// ============================================================
//
// Keep AuthenticationRuntime alive for application lifetime.
//
// ============================================================

void authenticationRuntime;


// ============================================================
// END OF APPLICATION ENTRY POINT
// ============================================================
