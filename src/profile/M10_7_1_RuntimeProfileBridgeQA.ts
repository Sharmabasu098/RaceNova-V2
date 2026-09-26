/**
 * ============================================================
 * RaceNova V2
 * M10.7.1 — Runtime Profile Bridge QA
 * ============================================================
 *
 * Temporary functional QA.
 *
 * Verifies:
 * 1. RuntimeProfileBridge initialization
 * 2. Current profile retrieval
 * 3. hasProfile()
 * 4. syncSaveData()
 * 5. clear()
 * 6. dispose()
 *
 * IMPORTANT:
 * - Temporary QA only
 * - No UI logic
 * - No localStorage logic
 * - No cloud logic
 * - No authentication logic
 * - No Pi / Google login logic
 * - No Three.js dependency
 *
 * Uses an in-memory repository so this QA tests
 * the runtime profile boundary without changing
 * the existing SaveSystem.
 * ============================================================
 */

import {
  type PlayerProfile
} from "./PlayerProfile";

import {
  PlayerProfileManager
} from "./PlayerProfileManager";

import {
  type PersistenceRepository
} from "./PersistenceRepository";

import {
  RuntimeProfileBridge
} from "./RuntimeProfileBridge";

import {
  type PlayerSaveData
} from "../save/PlayerSaveData";

// ============================================================
// In-Memory Test Repository
// ============================================================

class MemoryProfileRepository
  implements PersistenceRepository {

  private profile:
    PlayerProfile | null = null;

  public save(
    profile: PlayerProfile
  ): boolean {

    this.profile = {
      ...profile,

      saveData: {
        ...profile.saveData,

        economy: {
          ...profile.saveData.economy,

          wallet: {
            ...profile.saveData.economy.wallet
          }
        },

        garage: {
          ...profile.saveData.garage,

          ownedCars: [
            ...profile.saveData.garage.ownedCars
          ]
        },

        upgrades: {
          ...profile.saveData.upgrades,

          upgrades: {
            ...profile.saveData.upgrades.upgrades
          }
        },

        progress: {
          ...profile.saveData.progress,

          raceProgression: {
            ...profile.saveData.progress.raceProgression,

            races: [
              ...profile.saveData.progress
                .raceProgression.races
            ]
          }
        }
      }
    };

    return true;
  }

  public load():
    PlayerProfile | null {

    return this.profile;
  }

  public hasProfile():
    boolean {

    return this.profile !== null;
  }

  public deleteProfile():
    boolean {

    this.profile =
      null;

    return true;
  }
}

// ============================================================
// Valid Test Save Data
// ============================================================

function createValidTestSaveData():
  PlayerSaveData {

  return {

    version:
      1,

    economy: {

      wallet: {

        coin:
          100,

        pi:
          0
      },

      transactions: [],

      version:
        1
    },

    garage: {

      ownedCars: [
        "starter"
      ],

      selectedCar:
        "starter"
    },

    upgrades: {

      upgrades: {

        starter: {

          speed:
            0,

          acceleration:
            0,

          handling:
            0
        },

        sport: {

          speed:
            0,

          acceleration:
            0,

          handling:
            0
        },

        muscle: {

          speed:
            0,

          acceleration:
            0,

          handling:
            0
        },

        super: {

          speed:
            0,

          acceleration:
            0,

          handling:
            0
        },

        hyper: {

          speed:
            0,

          acceleration:
            0,

          handling:
            0
        }
      }
    },

    progress: {

      unlockedLevel:
        1,

      racesCompleted:
        0,

      racesWon:
        0,

      totalDistance:
        0,

      selectedRaceId:
        "",

      bossesDefeated:
        0,

      raceProgression: {

        version:
          1,

        unlockedLevel:
          1,

        selectedRaceId:
          "",

        racesCompleted:
          0,

        racesWon:
          0,

        bossesDefeated:
          0,

        races: []
      }
    },

    updatedAt:
      Date.now()
  };
}

// ============================================================
// QA Assertion
// ============================================================

function assertQA(
  condition: boolean,
  message: string
): void {

  if (!condition) {

    throw new Error(
      `M10.7.1 Runtime Bridge QA FAILED: ${message}`
    );
  }
}

// ============================================================
// M10.7.1 Runtime Bridge QA
// ============================================================

export function
runM10_7_1_RuntimeProfileBridgeQA():
  boolean {

  // ----------------------------------------------------------
  // Setup
  // ----------------------------------------------------------

  const repository =
    new MemoryProfileRepository();

  const profileManager =
    new PlayerProfileManager(
      repository
    );

  const bridge =
    new RuntimeProfileBridge(
      profileManager
    );

  const initialSaveData =
    createValidTestSaveData();

  // ----------------------------------------------------------
  // 1. Initialize
  // ----------------------------------------------------------

  const profile =
    bridge.initialize(
      "m10_7_1_test_profile",
      initialSaveData,
      "QA Player"
    );

  assertQA(
    profile !== null,
    "initialize() must create a runtime profile."
  );

  assertQA(
    profile?.profileId ===
      "m10_7_1_test_profile",
    "Initialized profileId must match."
  );

  // ----------------------------------------------------------
  // 2. hasProfile()
  // ----------------------------------------------------------

  assertQA(
    bridge.hasProfile(),
    "hasProfile() must return true after initialization."
  );

  // ----------------------------------------------------------
  // 3. getCurrentProfile()
  // ----------------------------------------------------------

  const currentProfile =
    bridge.getCurrentProfile();

  assertQA(
    currentProfile !== null,
    "getCurrentProfile() must return the active profile."
  );

  assertQA(
    currentProfile?.displayName ===
      "QA Player",
    "Current profile displayName must match."
  );

  assertQA(
    currentProfile?.saveData.economy.wallet.coin ===
      100,
    "Current profile must contain the initial PlayerSaveData."
  );

  // ----------------------------------------------------------
  // 4. syncSaveData()
  // ----------------------------------------------------------

  const updatedSaveData =
    createValidTestSaveData();

  updatedSaveData.economy.wallet.coin =
    250;

  const synced =
    bridge.syncSaveData(
      updatedSaveData
    );

  assertQA(
    synced,
    "syncSaveData() must return true."
  );

  const syncedProfile =
    bridge.getCurrentProfile();

  assertQA(
    syncedProfile?.saveData.economy.wallet.coin ===
      250,
    "syncSaveData() must update the active profile."
  );

  // ----------------------------------------------------------
  // 5. Persistence through Manager
  // ----------------------------------------------------------

  const persistedProfile =
    repository.load();

  assertQA(
    persistedProfile !== null,
    "Synced profile must remain persisted in the repository."
  );

  assertQA(
    persistedProfile?.saveData.economy.wallet.coin ===
      250,
    "Persisted profile must contain synchronized save data."
  );

  // ----------------------------------------------------------
  // 6. clear()
  // ----------------------------------------------------------

  bridge.clear();

  assertQA(
    !bridge.hasProfile(),
    "clear() must remove only the runtime profile."
  );

  assertQA(
    repository.hasProfile(),
    "clear() must not delete the persisted profile."
  );

  // ----------------------------------------------------------
  // 7. dispose()
  // ----------------------------------------------------------

  bridge.dispose();

  assertQA(
    !bridge.hasProfile(),
    "dispose() must leave the runtime profile cleared."
  );

  assertQA(
    repository.hasProfile(),
    "dispose() must not delete persisted profile data."
  );

  // ----------------------------------------------------------
  // PASS
  // ----------------------------------------------------------

  return true;
}
