/**
 * ============================================================
 * RaceNova V2
 * Application Entry Point
 * M11.6 — REAL Pi Authentication
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
 * - Compose REAL Pi Authentication
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
 * M11.6:
 * - REAL Pi SDK
 * - REAL Pi authentication
 * - No Google authentication
 * - No wallet passphrase
 * - No secret phrase
 * - No authentication token persistence
 *
 * NOTE:
 * - Pi accessToken is received only in memory.
 * - Production identity verification must happen server-side.
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
  AuthenticationStatus
} from "./auth/AuthenticationBoundary";

import {
  AuthenticationRuntime
} from "./auth/AuthenticationRuntime";


// ============================================================
// Pi SDK Types
// ============================================================

interface PiUser {
  uid: string;
  username?: string;
}

interface PiAuthResult {
  user: PiUser;
  accessToken: string;
}

interface PiAuthenticationCallbacks {

  onIncompletePaymentFound?: (
    payment: unknown
  ) => void;
}

interface PiSdk {

  init(
    options: {
      version: string;
      sandbox: boolean;
    }
  ): void;

  authenticate(
    scopes: string[],
    callbacks?: PiAuthenticationCallbacks
  ): Promise<PiAuthResult>;
}

declare global {

  interface Window {

    Pi?: PiSdk;
  }
}


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
              once: true
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
              once: true
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
// App Container
// ============================================================

const app =
  document.getElementById(
    "app"
  );

if (!app) {

  throw new Error(
    "RaceNova: #app element not found."
  );
}


// ============================================================
// M11.6 — REAL Pi Authentication Runtime
// ============================================================
//
// REAL Pi SDK authentication.
//
// IMPORTANT:
// - No Google SDK
// - No fake authentication
// - No localStorage
// - No token persistence
// - No wallet passphrase
// - No secret phrase
// - No gameplay dependency
//
// ============================================================

const authenticationRuntime =
  AuthenticationRuntime.create({

    provider:
      AuthenticationProvider.PI,

    handlers: {

      // ======================================================
      // REAL PI SIGN IN
      // ======================================================

      signIn:
        async () => {

          try {

            const Pi =
              await loadPiSdk();

            // ------------------------------------------------
            // Pi SDK initialization
            // ------------------------------------------------

            Pi.init({

              version:
                "2.0",

              sandbox:
                true
            });

            // ------------------------------------------------
            // REAL Pi authentication
            // ------------------------------------------------

            const auth =
              await Pi.authenticate(
                [
                  "username"
                ],
                {

                  onIncompletePaymentFound:
                    (
                      payment
                    ) => {

                      console.warn(
                        "[RaceNova] Incomplete Pi payment found:",
                        payment
                      );
                    }
                }
              );

            // ------------------------------------------------
            // Validate returned identity
            // ------------------------------------------------

            if (
              !auth ||
              !auth.user ||
              !auth.user.uid
            ) {

              return {

                success:
                  false,

                session: {

                  status:
                    AuthenticationStatus.ERROR,

                  identity:
                    null
                },

                message:
                  "Pi authentication returned an invalid identity."
              };
            }

            // ------------------------------------------------
            // IMPORTANT
            //
            // accessToken is intentionally NOT persisted.
            //
            // Production backend verification must verify
            // this token with Pi before treating the identity
            // as trusted.
            // ------------------------------------------------

            if (
              !auth.accessToken
            ) {

              return {

                success:
                  false,

                session: {

                  status:
                    AuthenticationStatus.ERROR,

                  identity:
                    null
                },

                message:
                  "Pi authentication did not return an access token."
              };
            }

            // ------------------------------------------------
            // REAL authenticated session
            // ------------------------------------------------

            return {

              success:
                true,

                session: {

                  status:
                    AuthenticationStatus.AUTHENTICATED,

                  identity: {

                    subject:
                      auth.user.uid,

                    provider:
                      AuthenticationProvider.PI,

                    displayName:
                      auth.user.username ||
                      "Pi User"
                  }
                }
            };

          } catch (
            error
          ) {

            console.error(
              "[RaceNova] Pi authentication failed:",
              error
            );

            return {

              success:
                false,

                session: {

                  status:
                    AuthenticationStatus.ERROR,

                  identity:
                    null
                },

                message:
                  "Pi authentication failed."
            };
          }
        },


      // ======================================================
      // PI SIGN OUT
      // ======================================================
      //
      // Pi SDK does not provide a local credential/token
      // persistence layer in RaceNova.
      //
      // Therefore RaceNova clears its in-memory session.
      //
      // ======================================================

      signOut:
        async () => {

          return {

            success:
              true,

            session: {

              status:
                AuthenticationStatus.SIGNED_OUT,

              identity:
                null
            }
          };
        },


      // ======================================================
      // CURRENT SESSION
      // ======================================================

      getSession:
        () => {

          return {

            status:
              AuthenticationStatus.SIGNED_OUT,

            identity:
              null
          };
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

      onStartRace: () => {

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

      onCampaign: () => {

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

      onGarage: () => {

        mainMenu.hide();

        engine.openGarage();
      }
    }
  );


// ============================================================
// M8.8 — Main Menu Progress Refresh
// ============================================================
//
// Keeps Main Menu NEXT RACE card synchronized with
// authoritative PlayerProgress.
//
// IMPORTANT:
// - No gameplay logic.
// - No save logic.
// - No progression mutation.
// - MainMenu only receives progress and displays it.
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

      onBack: () => {

        campaignMenu?.hide();

        // ----------------------------------------------------
        // M8.8 — Refresh Main Menu Progress
        // ----------------------------------------------------

        refreshMainMenuProgress();

        mainMenu.resetStartState();

        mainMenu.show();
      },


      // ======================================================
      // START SELECTED CAMPAIGN RACE
      // ======================================================

      onStartRace: (
        raceId: string
      ) => {

        if (
          !raceId
        ) {

          return;
        }

        // ----------------------------------------------------
        // Get current player progress
        // ----------------------------------------------------

        const progress =
          engine.getPlayerProgress();

        // ----------------------------------------------------
        // Update selected race
        //
        // RaceNovaEngine uses:
        //
        // playerProgress
        //   .raceProgression
        //   .selectedRaceId
        // ----------------------------------------------------

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

        // ----------------------------------------------------
        // Give updated progression back to engine
        // ----------------------------------------------------

        engine.setPlayerProgress(
          updatedProgress
        );

        // ----------------------------------------------------
        // Close campaign UI
        // ----------------------------------------------------

        campaignMenu?.hide();

        // ----------------------------------------------------
        // Reset Main Menu button state
        // ----------------------------------------------------

        mainMenu.resetStartState();

        // ----------------------------------------------------
        // Start engine
        // ----------------------------------------------------

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
// M7.9.11
// ============================================================

const handleTrafficCrash =
  (): void => {

    // --------------------------------------------------------
    // Close Campaign UI
    // --------------------------------------------------------

    campaignMenu?.hide();

    // --------------------------------------------------------
    // Re-enable Main Menu
    // --------------------------------------------------------

    mainMenu.resetStartState();

    // --------------------------------------------------------
    // M8.8 — Refresh Main Menu Progress
    // --------------------------------------------------------

    refreshMainMenuProgress();

    // --------------------------------------------------------
    // Show Main Menu FIRST
    // --------------------------------------------------------

    mainMenu.show();

    // --------------------------------------------------------
    // Reset active race runtime
    // --------------------------------------------------------

    engine.resetRaceState();
  };


window.addEventListener(
  "racenova:traffic-crash",
  handleTrafficCrash
);


// ============================================================
// Race Result → Main Menu
// M8.3
// ============================================================

const handleRaceResultMenu =
  (): void => {

    // --------------------------------------------------------
    // Close Campaign UI
    // --------------------------------------------------------

    campaignMenu?.hide();

    // --------------------------------------------------------
    // Reset Main Menu button state
    // --------------------------------------------------------

    mainMenu.resetStartState();

    // --------------------------------------------------------
    // Refresh Main Menu progress
    // --------------------------------------------------------

    refreshMainMenuProgress();

    // --------------------------------------------------------
    // Reset active race runtime
    // --------------------------------------------------------

    engine.resetRaceState();

    // --------------------------------------------------------
    // Show Main Menu
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Refresh Main Menu progress
    // --------------------------------------------------------

    refreshMainMenuProgress();

    // --------------------------------------------------------
    // Reset Main Menu button state
    // --------------------------------------------------------

    mainMenu.resetStartState();

    // --------------------------------------------------------
    // Show Main Menu
    // --------------------------------------------------------

    mainMenu.show();
  };


window.addEventListener(
  "racenova:garage-close",
  handleGarageClose
);


// ============================================================
// Initial Main Menu
// ============================================================
//
// M8.8:
// Always load the saved/current player progress before
// displaying the Main Menu.
// ============================================================

refreshMainMenuProgress();

mainMenu.show();


// ============================================================
// M11.6 — Authentication Runtime Availability
// ============================================================
//
// Authentication runtime is composed at application level.
// Actual Pi sign-in is intentionally NOT triggered on startup.
//
// Login UI will explicitly call:
//
// authenticationRuntime.signIn()
//
// in the authentication UI integration.
// ============================================================

void authenticationRuntime;
