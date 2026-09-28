/**
 * ============================================================
 * RaceNova V2
 * Application Entry Point
 * M8.8.1
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
 *
 * IMPORTANT:
 * - No Three.js code here
 * - No gameplay logic here
 * - Engine remains responsible for gameplay
 * - MainMenu remains responsible for main-menu UI
 * - CampaignMenu remains responsible for campaign UI
 * - RaceResultUI remains responsible for result UI
 * - No save logic here
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
  runM11_4_AuthenticationProfileBridgeQA
} from "./auth/M11_4_AuthenticationProfileBridgeQA";

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
// TEMPORARY M11.4 QA INVOCATION
// ============================================================
//
// Run only when URL contains:
//
// ?m11_4_qa=1
//
// Example:
// https://sharmabasu098.github.io/RaceNova-V2/?m11_4_qa=1
//
// TEMPORARY ONLY.
// Remove after M11.4 QA PASS.
// ============================================================

const m11_4QaEnabled =
  new URLSearchParams(
    window.location.search
  ).get(
    "m11_4_qa"
  ) === "1";

if (
  m11_4QaEnabled
) {

  // =========================================================
  // M11.4 QA — Visible Runtime Result Panel
  // Temporary QA-only UI
  // =========================================================

  const qaOverlay =
    document.createElement(
      "div"
    );

  qaOverlay.id =
    "m11-4-qa-overlay";

  Object.assign(
    qaOverlay.style,
    {
      position: "fixed",
      top: "16px",
      left: "16px",
      right: "16px",
      zIndex: "99999",

      padding: "18px",

      borderRadius: "12px",

      border:
        "2px solid #ffffff",

      background:
        "#1f2937",

      color:
        "#ffffff",

      fontFamily:
        "Arial, sans-serif",

      fontSize:
        "18px",

      fontWeight:
        "700",

      lineHeight:
        "1.5",

      textAlign:
        "center",

      whiteSpace:
        "pre-line",

      boxShadow:
        "0 8px 30px rgba(0,0,0,0.45)",

      pointerEvents:
        "none"
    }
  );

  qaOverlay.textContent =
    "M11.4 AUTH PROFILE QA\nRUNNING...";

  document.body.appendChild(
    qaOverlay
  );

  console.log(
    "[M11.4 QA] INVOCATION ENABLED"
  );

  try {

    runM11_4_AuthenticationProfileBridgeQA();

    qaOverlay.textContent =
      "M11.4 AUTH PROFILE QA\nPASS ✅";

    qaOverlay.style.background =
      "#166534";

    qaOverlay.style.borderColor =
      "#86efac";

    console.log(
      "[M11.4 QA] PASS"
    );

  } catch (
    error
  ) {

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    qaOverlay.textContent =
      "M11.4 AUTH PROFILE QA\nFAIL ❌\n" +
      message;

    qaOverlay.style.background =
      "#991b1b";

    qaOverlay.style.borderColor =
      "#fca5a5";

    console.error(
      "[M11.4 QA] FAIL",
      error
    );
  }
}

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
    //
    // Crash does not modify campaign progress,
    // but refreshing here guarantees the UI is always
    // synchronized with the engine state.
    // --------------------------------------------------------

    refreshMainMenuProgress();

    // --------------------------------------------------------
    // Show Main Menu FIRST
    //
    // This guarantees that the player can see
    // the menu immediately after a traffic crash.
    // --------------------------------------------------------

    mainMenu.show();

    // --------------------------------------------------------
    // Reset active race runtime
    //
    // Player progress, coins, garage and upgrades
    // remain untouched.
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
