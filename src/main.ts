/**
 * ============================================================
 * RaceNova V2
 * Application Entry Point
 * M11.6.4 — Pi Native Authentication Integration
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
 * - Compose REAL Pi Native Authentication
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
 * M11.6.4:
 * - REAL Pi Browser native authentication
 * - Pi.authenticate(["username"])
 * - No Google authentication
 * - No wallet passphrase
 * - No secret phrase
 * - No OAuth redirect
 * - No OAuth state
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
// Pi Native Authentication Types
// ============================================================

interface PiAuthUser {

  uid:
    string;

  username?:
    string;
}

interface PiAuthResult {

  accessToken:
    string;

  user:
    PiAuthUser;
}


interface PiVerifiedIdentityResponse {

  success:
    boolean;

  uid?:
    string;

  username?:
    string;

  message?:
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

  authenticate(
    scopes:
      string[],
    onIncompletePaymentFound?:
      (
        payment:
          unknown
      ) => void
  ):
    Promise<PiAuthResult>;
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
// M11.6.4:
// - Native Pi Browser authentication
// - No OAuth Client ID
// - No redirect URI
// - No OAuth state
//
// ============================================================

const PI_SCOPES = [
  "username"
];

// ============================================================
// M11.6.5 — Pi Identity Verification Worker
// ============================================================

const PI_AUTH_VERIFY_URL =
  "https://racenova-auth-api.sharmabasu098.workers.dev/api/auth/verify";


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


// ============================================================
// Pi SDK Loader
// ============================================================
//
// Pi Browser does not automatically provide window.Pi.
// RaceNova loads the official Pi SDK explicitly.
//
// ============================================================

const loadPiSdk =
  async (): Promise<PiSdk> => {

    // --------------------------------------------------------
    // SDK already available
    // --------------------------------------------------------

    if (
      window.Pi
    ) {

      return window.Pi;
    }


    // --------------------------------------------------------
    // Check for an existing RaceNova SDK script
    // --------------------------------------------------------

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

      // ------------------------------------------------------
      // Create official Pi SDK script
      // ------------------------------------------------------

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


    // --------------------------------------------------------
    // Validate SDK
    // --------------------------------------------------------

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
// M11.6.4 — Authentication Runtime
// ============================================================

const authenticationRuntime =
  AuthenticationRuntime.create({

    provider:
      AuthenticationProvider.PI,

    handlers: {

      // ======================================================
      // PI NATIVE SIGN IN
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
            // Initialize Pi SDK once
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
            // Set authenticating state
            // ------------------------------------------------

            currentPiSession = {

              status:
                AuthenticationStatus.AUTHENTICATING,

              identity:
                null
            };


            // ------------------------------------------------
            // Runtime diagnostics
            // ------------------------------------------------

            console.info(
              "[RaceNova][Pi Auth] Starting Pi.authenticate()",
              {

                sdkLoaded:
                  !!window.Pi,

                sdkInitialized:
                  piSdkInitialized,

                scopes:
                  PI_SCOPES,

                origin:
                  window.location.origin,

                pathname:
                  window.location.pathname
              }
            );


            // ------------------------------------------------
            // Native Pi Browser authentication
            // ------------------------------------------------

            const auth =
              await Pi.authenticate(
                PI_SCOPES,

                (
                  payment:
                    unknown
                ) => {

                  console.warn(
                    "[RaceNova][Pi Auth] Incomplete payment found:",
                    payment
                  );

                }
              );


            // ------------------------------------------------
            // Validate authentication response
            // ------------------------------------------------

            if (
              !auth
            ) {

              throw new Error(
                "Pi authentication returned no result."
              );
            }


            if (
              !auth.accessToken
            ) {

              throw new Error(
                "Pi authentication returned no access token."
              );
            }


            if (
              !auth.user
            ) {

              throw new Error(
                "Pi authentication returned no user."
              );
            }


            if (
              !auth.user.uid
            ) {

              throw new Error(
                "Pi authentication returned no user UID."
              );
            }


            // ------------------------------------------------
// M11.6.5 — Server-side Pi identity verification
// ------------------------------------------------

const verifyResponse =
  await fetch(
    PI_AUTH_VERIFY_URL,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify({
          accessToken:
            auth.accessToken
        })
    }
  );


// ------------------------------------------------
// Verify Worker response
// ------------------------------------------------

if (
  !verifyResponse.ok
) {

  throw new Error(
    "RaceNova: Pi server verification failed."
  );
}


// ------------------------------------------------
// Read verified identity
// ------------------------------------------------

const verified =
  await verifyResponse.json()
    as PiVerifiedIdentityResponse;


if (
  !verified.success
) {

  throw new Error(
    verified.message ||
    "RaceNova: Pi identity could not be verified."
  );
}


if (
  !verified.uid
) {

  throw new Error(
    "RaceNova: Pi verification returned no verified UID."
  );
}


// ------------------------------------------------
// Memory-only access token
// ------------------------------------------------

currentPiAccessToken =
  auth.accessToken;


// ------------------------------------------------
// Create authenticated session
// IMPORTANT: identity comes from verified Worker data
// ------------------------------------------------

currentPiSession = {

  status:
    AuthenticationStatus.AUTHENTICATED,

  identity: {

    subject:
      verified.uid,

    provider:
      AuthenticationProvider.PI,

    displayName:
      verified.username ||
      "Pi User"
  }
};


// ------------------------------------------------
// Success diagnostics
// ------------------------------------------------

console.info(
  "[RaceNova][Pi Auth] Authentication + server verification successful",
  {

    uid:
      verified.uid,

    username:
      verified.username ||
      "Pi User",

    hasAccessToken:
      Boolean(
        auth.accessToken
      )
  }
);

            // ------------------------------------------------
            // Return authentication result
            // ------------------------------------------------

            return {

              success:
                true,

              session:
                currentPiSession
            };


          } catch (
            error
          ) {

            // ------------------------------------------------
            // Authentication failed
            // ------------------------------------------------

            console.error(
              "[RaceNova][Pi Auth] Authentication failed:",
              error
            );


            currentPiAccessToken =
              null;


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
                  : "Pi authentication failed."
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
      // M11.6.4 — PI LOGIN
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
          // Start Pi Native Sign-In
          // --------------------------------------------------

          const result =
            await authenticationRuntime
              .signIn();


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
// M11.6.4 — Runtime Availability
// ============================================================
//
// Keep AuthenticationRuntime alive for the application lifetime.
//
// ============================================================

void authenticationRuntime;


// ============================================================
// END OF APPLICATION ENTRY POINT
// ============================================================
