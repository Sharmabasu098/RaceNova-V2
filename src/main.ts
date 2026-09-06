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
 * - Keep UI navigation outside the engine loop
 *
 * IMPORTANT:
 * - No Three.js code here
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
// Main Menu
// ============================================================

let campaignMenu:
  CampaignMenu | null =
    null;

const mainMenu =
  new MainMenu(
    app,
    {
      // ------------------------------------------------------
      // START RACE
      // ------------------------------------------------------

      onStartRace: () => {

        if (
          campaignMenu
        ) {

          campaignMenu.hide();
        }

        engine.start();
      },

      // ------------------------------------------------------
      // CAMPAIGN
      // ------------------------------------------------------

      onCampaign: () => {

        mainMenu.hide();

        if (
          campaignMenu
        ) {

          campaignMenu.show();
        }
      },

      // ------------------------------------------------------
      // GARAGE
      // ------------------------------------------------------

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
      // ------------------------------------------------------
      // BACK
      // ------------------------------------------------------

      onBack: () => {

        campaignMenu?.hide();

        mainMenu.resetStartState();

        mainMenu.show();
      },

      // ------------------------------------------------------
      // START CAMPAIGN RACE
      // ------------------------------------------------------

      onStartRace: (
        raceId: string
      ) => {

        campaignMenu?.hide();

        mainMenu.resetStartState();

        /*
         * IMPORTANT:
         *
         * Race selection is handled by CampaignMenu.
         * The RaceNovaEngine race-selection connection
         * will be added in the next milestone step.
         *
         * For now we keep the selected raceId here
         * so the navigation flow is ready.
         */

        void raceId;

        engine.start();
      }
    }
  );

// ============================================================
// Load Campaign Progress
// ============================================================

campaignMenu.setProgress(
  engine.getPlayerProgress()
);

// ============================================================
// Initial UI State
// ============================================================

campaignMenu.hide();

mainMenu.show();
