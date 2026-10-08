/**
 * ============================================================
 * RaceNova V2
 * Application Entry Point
 * M11.6.6 — Pi Runtime Diagnostic
 * ============================================================
 *
 * Responsibilities:
 * - Create RaceNovaEngine
 * - Create MainMenu
 * - Create CampaignMenu
 * - Connect navigation
 * - Compose REAL Pi authentication
 * - Verify Pi identity through RaceNova Worker
 *
 * IMPORTANT:
 * - No Three.js code here
 * - No gameplay logic here
 * - No wallet passphrase
 * - No secret phrase
 * - No OAuth redirect
 * - No OAuth state
 * - No token persistence
 * - Access token remains memory-only
 *
 * TEMPORARY:
 * - Visible Pi runtime diagnostic
 * - Used only to identify why Pi login does not open
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

import {
  GoogleAuthenticationProvider
} from "./auth/GoogleAuthenticationProvider";


// ============================================================
// Pi Types
// ============================================================

interface PiAuthUser {
  uid: string;
  username?: string;
}

interface PiAuthResult {
  accessToken: string;
  user: PiAuthUser;
}

interface PiVerifiedIdentityResponse {
  success: boolean;
  uid?: string;
  username?: string;
  message?: string;
}

interface PiSdk {
  init(
    options: {
      version: string;
    }
  ): void;

  authenticate(
    scopes: string[],
    onIncompletePaymentFound?: (
      payment: unknown
    ) => void
  ): Promise<PiAuthResult>;
}

declare global {
  interface Window {
    Pi?: PiSdk;
  }
}


// ============================================================
// Pi Configuration
// ============================================================

const PI_SCOPES = [
  "username"
];

const PI_AUTH_VERIFY_URL =
  "https://racenova-auth-api.sharmabasu098.workers.dev/api/auth/verify";

const GOOGLE_CLIENT_ID =
  "136956253270-dihc3vs0cgk9eueggl85of1cn7u3nh7c.apps.googleusercontent.com";

const GOOGLE_AUTH_VERIFY_URL =
  "https://racenova-google-auth-api.sharmabasu098.workers.dev/api/auth/google/verify";


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
// Pi Runtime Diagnostic
// ============================================================
//
// Production UI: disabled.
// Pi authentication logic remains unchanged.
// ============================================================

const updatePiDiagnostic =
  (
    _message: string
  ): void => {
    // Production: no visible diagnostic UI.
  };


// ============================================================
// Pi SDK Initialization
// ============================================================
//
// index.html loads the official Pi SDK before main.ts.
//
// We initialize it during application startup.
//
// ============================================================

if (
  window.Pi
) {

  try {

    window.Pi.init({
      version:
        "2.0"
    });

    piSdkInitialized =
      true;

    updatePiDiagnostic(
      "BOOT: Pi SDK detected\n" +
      "Pi.init: PASS\n" +
      "Waiting for LOGIN..."
    );

    console.info(
      "[RaceNova][Pi Auth] Pi SDK initialized."
    );

  } catch (
    error
  ) {

    updatePiDiagnostic(
      "BOOT: Pi SDK detected\n" +
      "Pi.init: FAIL\n\n" +
      (
        error instanceof Error
          ? error.message
          : String(error)
      )
    );

    console.error(
      "[RaceNova][Pi Auth] Pi.init failed:",
      error
    );
  }

} else {

  updatePiDiagnostic(
    "BOOT: Pi SDK NOT detected\n\n" +
    "window.Pi is unavailable."
  );

  console.warn(
    "[RaceNova][Pi Auth] Pi SDK unavailable."
  );
}


// ============================================================
// Authentication Runtime
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

            updatePiDiagnostic(
              "Already authenticated."
            );

            return {
              success:
                true,

              session:
                currentPiSession
            };
          }


          // --------------------------------------------------
          // Login click already reached this function
          // --------------------------------------------------

          updatePiDiagnostic(
            "1. LOGIN CLICK: PASS\n" +
            "2. Entering authentication..."
          );


          try {

            // ------------------------------------------------
            // Use already-loaded Pi SDK.
            //
            // IMPORTANT:
            // No async SDK loader is used here.
            // ------------------------------------------------

            const Pi =
              window.Pi;


            if (
              !Pi
            ) {

              updatePiDiagnostic(
                "1. LOGIN CLICK: PASS\n" +
                "2. Pi SDK: FAIL\n\n" +
                "window.Pi is unavailable."
              );

              throw new Error(
                "RaceNova: Pi SDK is unavailable."
              );
            }


            updatePiDiagnostic(
              "1. LOGIN CLICK: PASS\n" +
              "2. Pi SDK: PASS"
            );


            // ------------------------------------------------
            // Safety initialization
            // ------------------------------------------------

            if (
              !piSdkInitialized
            ) {

              updatePiDiagnostic(
                "1. LOGIN CLICK: PASS\n" +
                "2. Pi SDK: PASS\n" +
                "3. Pi.init: START"
              );

              Pi.init({
                version:
                  "2.0"
              });

              piSdkInitialized =
                true;
            }


            updatePiDiagnostic(
              "1. LOGIN CLICK: PASS\n" +
              "2. Pi SDK: PASS\n" +
              "3. Pi.init: PASS\n" +
              "4. Calling Pi.authenticate..."
            );


            // ------------------------------------------------
            // Authentication state
            // ------------------------------------------------

            currentPiSession = {
              status:
                AuthenticationStatus.AUTHENTICATING,

              identity:
                null
            };


            console.info(
              "[RaceNova][Pi Auth] Calling Pi.authenticate()",
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


            // =================================================
            // Pi Native Authentication
            // =================================================

            const auth =
              await Pi.authenticate(
                PI_SCOPES,

                (
                  payment:
                    unknown
                ) => {

                  console.warn(
                    "[RaceNova][Pi Auth] Incomplete payment:",
                    payment
                  );
                }
              );


            // ------------------------------------------------
            // Pi.authenticate returned
            // ------------------------------------------------

            updatePiDiagnostic(
              "1. LOGIN CLICK: PASS\n" +
              "2. Pi SDK: PASS\n" +
              "3. Pi.init: PASS\n" +
              "4. Pi.authenticate: RETURNED"
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
            // Pi authentication succeeded
            // ------------------------------------------------

            updatePiDiagnostic(
              "1. LOGIN CLICK: PASS\n" +
              "2. Pi SDK: PASS\n" +
              "3. Pi.init: PASS\n" +
              "4. Pi.authenticate: PASS\n" +
              "5. Server verification: START"
            );


            // =================================================
            // M11.6.5 — Worker Verification
            // =================================================

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
            // Worker HTTP result
            // ------------------------------------------------

            if (
              !verifyResponse.ok
            ) {

              let workerMessage =
                "Pi server verification failed.";

              try {

                const workerError =
                  await verifyResponse.json();

                if (
                  workerError &&
                  typeof workerError.message ===
                    "string"
                ) {

                  workerMessage =
                    workerError.message;
                }

              } catch {
                // Keep default message.
              }

              throw new Error(
                workerMessage
              );
            }


            // ------------------------------------------------
            // Read verified identity
            // ------------------------------------------------

            const verified:
              PiVerifiedIdentityResponse =
                await verifyResponse.json();


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
            // Authenticated session
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
            // Full success diagnostic
            // ------------------------------------------------

            updatePiDiagnostic(
              "1. LOGIN CLICK: PASS\n" +
              "2. Pi SDK: PASS\n" +
              "3. Pi.init: PASS\n" +
              "4. Pi.authenticate: PASS\n" +
              "5. Server verification: PASS\n" +
              "6. LOGIN SUCCESS\n\n" +
              "User: " +
              (
                verified.username ||
                "Pi User"
              )
            );


            console.info(
              "[RaceNova][Pi Auth] Authentication successful",
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
            // Authentication failure
            // ------------------------------------------------

            const errorMessage =
              error instanceof Error
                ? error.message
                : String(error);


            updatePiDiagnostic(
              "PI AUTH ERROR\n\n" +
              errorMessage
            );


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
                errorMessage ||
                "Pi authentication failed."
            };
          }
        },


      // ======================================================
      // SIGN OUT
      // ======================================================

      signOut:
        async (): Promise<AuthenticationResult> => {

          currentPiAccessToken =
            null;

          currentPiSession = {

            status:
              AuthenticationStatus.SIGNED_OUT,

            identity:
              null
          };


          updatePiDiagnostic(
            "SIGNED OUT\n\n" +
            "Waiting for LOGIN..."
          );


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

let engine:
  RaceNovaEngine | null =
    null;

let activeAccountId:
  string | null =
    null;


// ============================================================
// Campaign Menu Reference
// ============================================================

let campaignMenu:
  CampaignMenu | null =
    null;

let googleAuthenticationProvider:
  GoogleAuthenticationProvider | null =
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
            !engine
          ) {
            return;
          }

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

          if (
            !engine
          ) {
            return;
          }

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

          if (
            !engine
          ) {
            return;
          }

          mainMenu.hide();

          engine.openGarage();
        },


      // ======================================================
      // PI LOGIN
      // ======================================================

      onPiLogin:
        async () => {

          updatePiDiagnostic(
            "1. LOGIN CLICK: PASS\n" +
            "2. Entering authentication..."
          );


          // --------------------------------------------------
          // Authenticated → Sign Out
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
          // Sign In
          // --------------------------------------------------

          const result =
            await authenticationRuntime
              .signIn();


          // --------------------------------------------------
          // Success
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

            activateAuthenticatedEngine(
              result.session
            );

            return;
          }


          // --------------------------------------------------
          // Failure
          // --------------------------------------------------

          mainMenu.setAuthenticationState(
            false
          );

          console.warn(
            "[RaceNova] Pi login failed:",
            result.message
          );
        },


      // ======================================================
      // GOOGLE SIGN OUT
      // ======================================================

      onGoogleSignOut:
        async () => {

          if (
            !googleAuthenticationProvider
          ) {
            return;
          }


          const result =
            await googleAuthenticationProvider
              .signOut();


          if (
            result.success
          ) {

            mainMenu.setGoogleAuthenticationState(
              false
            );

            return;
          }


          console.warn(
            "[RaceNova] Google sign-out failed:",
            result.message
          );
        }
    }
  );


// ============================================================
// M11.8.8 — Authenticated Engine Activation
// ============================================================
//
// Engine is created only after verified authentication.
//
// Account IDs:
// - Pi     → pi:<verified-uid>
// - Google → google:<verified-sub>
//
// IMPORTANT:
// - No local fallback account
// - No localStorage auth
// - No live account switching
// - Authentication verification remains unchanged
// ============================================================

const activateAuthenticatedEngine =
  (
    session:
      AuthenticationSession
  ): void => {

    if (
      !session.identity
    ) {
      return;
    }

    const identity =
      session.identity;

    const accountId =
      identity.provider ===
        AuthenticationProvider.PI
        ? `pi:${identity.subject}`
        : `google:${identity.subject}`;


    // --------------------------------------------------------
    // Prevent live account switching.
    // --------------------------------------------------------

    if (
      engine
    ) {

      if (
        activeAccountId ===
          accountId
      ) {
        return;
      }

      console.warn(
        "[RaceNova] Engine already active for another account."
      );

      return;
    }

  // --------------------------------------------------------
    // Bind verified account to Engine.
    // --------------------------------------------------------

    activeAccountId =
      accountId;

    engine =
      new RaceNovaEngine(
        app,
        accountId
      );


    // --------------------------------------------------------
    // Refresh account-bound progress.
    // --------------------------------------------------------

    refreshMainMenuProgress();

    if (
      campaignMenu
    ) {

      campaignMenu.setProgress(
        engine.getPlayerProgress()
      );
    }


    console.info(
      "[RaceNova] Authenticated Engine activated.",
      {
        provider:
          identity.provider,

        accountId:
          accountId
      }
    );
  };


// ============================================================
// M11.7.2-D — Google Authentication Provider
// ============================================================

const configuredGoogleAuthenticationProvider =
  new GoogleAuthenticationProvider({

    clientId:
      GOOGLE_CLIENT_ID,

    verificationUrl:
      GOOGLE_AUTH_VERIFY_URL,

    onResult:
      (
        result
      ) => {

        if (
          result.success &&
          result.session.identity
        ) {

          mainMenu.setGoogleAuthenticationState(
            true,
            result.session.identity.displayName
          );

          activateAuthenticatedEngine(
            result.session
          );

          return;
        }


        mainMenu.setGoogleAuthenticationState(
          false
        );

        console.warn(
          "[RaceNova] Google login failed:",
          result.message
        );
      }
  });


googleAuthenticationProvider =
  configuredGoogleAuthenticationProvider;


configuredGoogleAuthenticationProvider
  .initialize();


configuredGoogleAuthenticationProvider
  .renderButton(
    mainMenu.getGoogleLoginContainer()
  );


// ============================================================
// Main Menu Progress Refresh
// ============================================================

const refreshMainMenuProgress =
  (): void => {

    if (
      !engine
    ) {
      return;
    }

    mainMenu.setProgress(
      engine.getPlayerProgress()
    );
  };


// ============================================================
// RaceNova V2
// Application Entry Point
// M11.6.6 — Continuation
// ============================================================


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

          if (
            !engine
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

    if (
      engine
    ) {
      engine.resetRaceState();
    }
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

    if (
      engine
    ) {
      engine.resetRaceState();
    }

    mainMenu.show();
  };


window.addEventListener(
  "racenova:race-result-menu",
  handleRaceResultMenu
);


// ============================================================
// Garage → Main Menu
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
// Runtime Availability
// ============================================================
//
// Keep AuthenticationRuntime alive for the application lifetime.
//
// ============================================================

void authenticationRuntime;


// ============================================================
// END OF APPLICATION ENTRY POINT
// ============================================================
