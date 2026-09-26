/**
 * ============================================================
 * RaceNova V2
 * M10.5 — Profile ↔ Save Sync Functional QA
 * ============================================================
 *
 * TEMPORARY DEVELOPMENT QA
 *
 * Verifies:
 * - Profile exposes PlayerSaveData
 * - getSaveData() returns a defensive clone
 * - syncSaveData() updates the profile
 * - syncSaveData() persists the updated profile
 * - load() restores the synchronized PlayerSaveData
 * - Original input data is not mutated
 *
 * IMPORTANT:
 * - Does NOT use real localStorage
 * - Does NOT use real player data
 * - Does NOT modify SaveSystem
 * - Does NOT modify gameplay state
 * ============================================================
 */

import {
  EconomyManager
} from "../economy/EconomyManager";

import {
  GarageManager
} from "../garage/GarageManager";

import {
  UpgradeSystem
} from "../garage/UpgradeSystem";

import {
  createDefaultPlayerSaveData,
  clonePlayerSaveData,
  type PlayerSaveData
} from "../save/PlayerSaveData";

import {
  PlayerProfileManager
} from "./PlayerProfileManager";

import type {
  PlayerProfile
} from "./PlayerProfile";

import type {
  PersistenceRepository
} from "./PersistenceRepository";

// ============================================================
// Temporary In-Memory Repository
// ============================================================

class M10_5_QARepository
  implements PersistenceRepository {

  private profile:
    PlayerProfile | null = null;

  public save(
    profile: PlayerProfile
  ): boolean {

    this.profile =
      {
        ...profile,

        saveData:
          clonePlayerSaveData(
            profile.saveData
          )
      };

    return true;
  }

  public load():
    PlayerProfile | null {

    if (
      !this.profile
    ) {
      return null;
    }

    return {
      ...this.profile,

      saveData:
        clonePlayerSaveData(
          this.profile.saveData
        )
    };
  }

  public hasProfile():
    boolean {

    return (
      this.profile !== null
    );
  }

  public deleteProfile():
    boolean {

    this.profile =
      null;

    return true;
  }
}

// ============================================================
// Assertion
// ============================================================

function assert(
  condition: boolean,
  message: string
): void {

  if (!condition) {

    throw new Error(
      `M10.5 QA FAILED: ${message}`
    );
  }

  console.log(
    `M10.5 QA PASS: ${message}`
  );
}

// ============================================================
// Save Data Comparison
// ============================================================

function saveDataMatches(
  a: PlayerSaveData,
  b: PlayerSaveData
): boolean {

  return (
    JSON.stringify(a) ===
    JSON.stringify(b)
  );
}

// ============================================================
// QA Runner
// ============================================================

export function runM10_5ProfileSaveSyncQA():
  void {

  try {

    console.log(
      "=========================================="
    );

    console.log(
      "RaceNova V2 — M10.5 Profile ↔ Save Sync"
    );

    console.log(
      "=========================================="
    );

    // --------------------------------------------------------
    // Create isolated test managers
    // --------------------------------------------------------

    const economyManager =
      new EconomyManager({
        initialCoins: 0
      });

    const garageManager =
      new GarageManager(
        economyManager
      );

    const upgradeSystem =
      new UpgradeSystem(
        economyManager
      );

    // --------------------------------------------------------
    // Create isolated PlayerSaveData
    // --------------------------------------------------------

    const originalSaveData =
      createDefaultPlayerSaveData(
        economyManager.getState(),
        garageManager.getState(),
        upgradeSystem.getState()
      );

    const expectedInitialData =
      clonePlayerSaveData(
        originalSaveData
      );

    // --------------------------------------------------------
    // Create isolated repository
    // --------------------------------------------------------

    const repository =
      new M10_5_QARepository();

    const manager =
      new PlayerProfileManager(
        repository
      );

    // ========================================================
    // TEST 1
    // Profile initialization
    // ========================================================

    const profile =
      manager.initialize(
        "m10-5-qa-profile",
        originalSaveData,
        "M10.5 QA"
      );

    assert(
      profile !== null,
      "Profile initializes successfully"
    );

    assert(
      manager.hasCurrentProfile(),
      "Current profile exists"
    );

    assert(
      manager.hasPersistedProfile(),
      "Profile is persisted"
    );

    // ========================================================
    // TEST 2
    // getSaveData()
    // ========================================================

    const readSaveData =
      manager.getSaveData();

    assert(
      readSaveData !== null,
      "getSaveData() returns PlayerSaveData"
    );

    if (!readSaveData) {
      throw new Error(
        "M10.5 QA FAILED: getSaveData() returned null"
      );
    }

    assert(
      saveDataMatches(
        readSaveData,
        expectedInitialData
      ),
      "getSaveData() matches initial PlayerSaveData"
    );

    // ========================================================
    // TEST 3
    // Defensive clone
    // ========================================================

    readSaveData.economy.wallet.coin =
      999999;

    const afterMutation =
      manager.getSaveData();

    assert(
      afterMutation !== null,
      "Save data remains available after external mutation"
    );

    if (!afterMutation) {
      throw new Error(
        "M10.5 QA FAILED: save data disappeared"
      );
    }

    assert(
      afterMutation.economy.wallet.coin !==
        999999,
      "getSaveData() returns a defensive clone"
    );

    // ========================================================
    // TEST 4
    // Create updated SaveData
    // ========================================================

    const updatedSaveData =
      clonePlayerSaveData(
        originalSaveData
      );

    updatedSaveData.economy.wallet.coin =
      250;

    updatedSaveData.progress.totalDistance =
      1234;

    updatedSaveData.progress.racesCompleted =
      2;

    updatedSaveData.progress.racesWon =
      1;

    // ========================================================
    // TEST 5
    // syncSaveData()
    // ========================================================

    const syncResult =
      manager.syncSaveData(
        updatedSaveData
      );

    assert(
      syncResult === true,
      "syncSaveData() succeeds"
    );

    // ========================================================
    // TEST 6
    // Current profile contains new data
    // ========================================================

    const syncedData =
      manager.getSaveData();

    assert(
      syncedData !== null,
      "Synchronized SaveData is available"
    );

    if (!syncedData) {
      throw new Error(
        "M10.5 QA FAILED: synchronized data missing"
      );
    }

    assert(
      syncedData.economy.wallet.coin ===
        250,
      "Coin balance synchronized correctly"
    );

    assert(
      syncedData.progress.totalDistance ===
        1234,
      "Total distance synchronized correctly"
    );

    assert(
      syncedData.progress.racesCompleted ===
        2,
      "Race completion data synchronized correctly"
    );

    assert(
      syncedData.progress.racesWon ===
        1,
      "Race win data synchronized correctly"
    );

    // ========================================================
    // TEST 7
    // Input object was not replaced/mutated
    // ========================================================

    assert(
      updatedSaveData.economy.wallet.coin ===
        250,
      "Original sync input remains intact"
    );

    // ========================================================
    // TEST 8
    // Persistence verification
    // ========================================================

    const persistedProfile =
      repository.load();

    assert(
      persistedProfile !== null,
      "Synchronized profile is persisted"
    );

    if (!persistedProfile) {
      throw new Error(
        "M10.5 QA FAILED: persisted profile missing"
      );
    }

    assert(
      persistedProfile.saveData.economy.wallet.coin ===
        250,
      "Persisted coin balance is correct"
    );

    assert(
      persistedProfile.saveData.progress.totalDistance ===
        1234,
      "Persisted distance is correct"
    );

    // ========================================================
    // TEST 9
    // Clear memory and reload
    // ========================================================

    manager.clearCurrentProfile();

    assert(
      manager.hasCurrentProfile() === false,
      "Current profile clears from memory"
    );

    assert(
      manager.hasPersistedProfile() === true,
      "Persistence remains after memory clear"
    );

    const reloaded =
      manager.load();

    assert(
      reloaded !== null,
      "Profile reload succeeds"
    );

    if (!reloaded) {
      throw new Error(
        "M10.5 QA FAILED: reload returned null"
      );
    }

    const reloadedSaveData =
      manager.getSaveData();

    assert(
      reloadedSaveData !== null,
      "Reloaded SaveData is available"
    );

    if (!reloadedSaveData) {
      throw new Error(
        "M10.5 QA FAILED: reloaded SaveData missing"
      );
    }

    assert(
      reloadedSaveData.economy.wallet.coin ===
        250,
      "Reloaded coin balance matches"
    );

    assert(
      reloadedSaveData.progress.totalDistance ===
        1234,
      "Reloaded distance matches"
    );

    assert(
      reloadedSaveData.progress.racesCompleted ===
        2,
      "Reloaded race completion matches"
    );

    assert(
      reloadedSaveData.progress.racesWon ===
        1,
      "Reloaded race win count matches"
    );

    // ========================================================
    // FINAL PASS
    // ========================================================

    console.log(
      "=========================================="
    );

    console.log(
      "M10.5 PROFILE ↔ SAVE SYNC QA"
    );

    console.log(
      "PASS"
    );

    console.log(
      "=========================================="
    );

    window.alert(
      "M10.5 Profile ↔ Save Sync QA — PASS ✅"
    );

  } catch (
    error
  ) {

    console.error(
      "M10.5 Profile ↔ Save Sync QA — FAILED",
      error
    );

    window.alert(
      "M10.5 Profile ↔ Save Sync QA — FAILED ❌\n\n" +
      String(error)
    );
  }
}
