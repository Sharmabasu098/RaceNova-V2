/**
 * ============================================================
 * RaceNova V2
 * Application Entry Point
 * M7.9.9
 * ============================================================
 *
 * Responsibilities:
 * - Create RaceNovaEngine
 * - Create MainMenu
 * - Create CampaignMenu
 * - Connect Main Menu navigation
 * - Connect Campaign navigation
 * - Pass selected campaign race to the engine
 *
 * IMPORTANT:
 * - No Three.js code here
 * - No gameplay logic here
 * - Engine remains responsible for gameplay
 * - MainMenu remains responsible for main-menu UI
 * - CampaignMenu remains responsible for campaign UI
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
        // playerProgress.raceProgression.selectedRaceId
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
              progress.raceProgression.races.map(
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
// ============================================================

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

mainMenu.show();
