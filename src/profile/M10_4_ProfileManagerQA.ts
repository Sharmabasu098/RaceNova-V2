/**
 * ============================================================
 * RaceNova V2
 * M10.4 — PlayerProfileManager Functional QA
 * TEMPORARY DEVELOPMENT TEST
 * ============================================================
 *
 * IMPORTANT:
 * - Temporary QA only
 * - Does not touch real localStorage
 * - Does not touch real PlayerSaveData
 * - Remove after M10.4 PASS
 * ============================================================
 */

import {
  PlayerProfileManager
} from "./PlayerProfileManager";

import type {
  PlayerProfile
} from "./PlayerProfile";

import type {
  PersistenceRepository
} from "./PersistenceRepository";

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
  createDefaultPlayerSaveData
} from "../save/PlayerSaveData";

// ============================================================
// Temporary In-Memory Repository
// ============================================================

class QARepository
  implements PersistenceRepository {

  private profile:
    PlayerProfile | null = null;

  public save(
    profile: PlayerProfile
  ): boolean {

    this.profile = {
      ...profile,

      saveData:
        structuredClone(
          profile.saveData
        )
    };

    return true;
  }

  public load():
    PlayerProfile | null {

    if (!this.profile) {
      return null;
    }

    return {
      ...this.profile,

      saveData:
        structuredClone(
          this.profile.saveData
        )
    };
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
// Assertion
// ============================================================

function assert(
  condition: boolean,
  message: string
): void {

  if (!condition) {

    throw new Error(
      `M10.4 QA FAILED: ${message}`
    );
  }

  console.log(
    `M10.4 QA PASS: ${message}`
  );
}

// ============================================================
// QA Runner
// ============================================================

export function runM10_4ProfileManagerQA():
  void {

  try {

    console.log(
      "=========================================="
    );

    console.log(
      "RaceNova V2 — M10.4 Profile Manager QA"
    );

    console.log(
      "=========================================="
    );

    // --------------------------------------------------------
    // Repository
    // --------------------------------------------------------

    const repository =
      new QARepository();

    const manager =
      new PlayerProfileManager(
        repository
      );

    // --------------------------------------------------------
    // Test Save Data
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

const saveData =
  createDefaultPlayerSaveData(
    economyManager.getState(),
    garageManager.getState(),
    upgradeSystem.getState()
  );

    // --------------------------------------------------------
    // 1. No profile initially
    // --------------------------------------------------------

    assert(
      manager.hasCurrentProfile() === false,
      "No current profile initially"
    );

    assert(
      manager.hasPersistedProfile() === false,
      "No persisted profile initially"
    );

    // --------------------------------------------------------
    // 2. Initialize new profile
    // --------------------------------------------------------

    const created =
      manager.initialize(
        "m10-4-qa-profile",
        saveData,
        "RaceNova QA"
      );

    assert(
      created !== null,
      "initialize() creates new profile"
    );

    if (!created) {
      throw new Error(
        "M10.4 QA FAILED: initialize() returned null"
      );
    }

    assert(
      created.profileId ===
        "m10-4-qa-profile",
      "Profile ID is correct"
    );

    assert(
      created.displayName ===
        "RaceNova QA",
      "Initial display name is correct"
    );

    assert(
      manager.hasCurrentProfile() === true,
      "Current profile exists after initialize"
    );

    assert(
      manager.hasPersistedProfile() === true,
      "Profile is persisted after initialize"
    );

    // --------------------------------------------------------
    // 3. Update display name
    // --------------------------------------------------------

    const renamed =
      manager.setDisplayName(
        "RaceNova Player"
      );

    assert(
      renamed === true,
      "setDisplayName() succeeds"
    );

    const updated =
      manager.getCurrentProfile();

    assert(
      updated !== null,
      "Current profile remains available"
    );

    if (!updated) {
      throw new Error(
        "M10.4 QA FAILED: updated profile missing"
      );
    }

    assert(
      updated.displayName ===
        "RaceNova Player",
      "Display name updates in memory"
    );

    // --------------------------------------------------------
    // 4. Save updated profile
    // --------------------------------------------------------

    const saved =
      manager.save();

    assert(
      saved === true,
      "save() succeeds"
    );

    const persisted =
      repository.load();

    assert(
      persisted !== null,
      "Updated profile remains persisted"
    );

    if (!persisted) {
      throw new Error(
        "M10.4 QA FAILED: persisted profile missing"
      );
    }

    assert(
      persisted.displayName ===
        "RaceNova Player",
      "Updated display name is persisted"
    );

    // --------------------------------------------------------
    // 5. Clear memory only
    // --------------------------------------------------------

    manager.clearCurrentProfile();

    assert(
      manager.hasCurrentProfile() === false,
      "clearCurrentProfile() clears memory"
    );

    assert(
      manager.hasPersistedProfile() === true,
      "clearCurrentProfile() keeps persistence"
    );

    // --------------------------------------------------------
    // 6. Load persisted profile
    // --------------------------------------------------------

    const loaded =
      manager.load();

    assert(
      loaded !== null,
      "load() restores persisted profile"
    );

    if (!loaded) {
      throw new Error(
        "M10.4 QA FAILED: load() returned null"
      );
    }

    assert(
      loaded.profileId ===
        "m10-4-qa-profile",
      "Loaded profile ID is correct"
    );

    assert(
      loaded.displayName ===
        "RaceNova Player",
      "Loaded display name is correct"
    );

    assert(
      manager.hasCurrentProfile() === true,
      "Loaded profile becomes current profile"
    );

    // --------------------------------------------------------
    // 7. Delete profile
    // --------------------------------------------------------

    const deleted =
      manager.deleteProfile();

    assert(
      deleted === true,
      "deleteProfile() succeeds"
    );

    assert(
      manager.hasCurrentProfile() === false,
      "deleteProfile() clears current profile"
    );

    assert(
      manager.hasPersistedProfile() === false,
      "deleteProfile() removes persisted profile"
    );

    assert(
      repository.load() === null,
      "Repository is empty after delete"
    );

    // --------------------------------------------------------
    // PASS
    // --------------------------------------------------------

    console.log(
      "=========================================="
    );

    console.log(
      "M10.4 PROFILE MANAGER FUNCTIONAL QA"
    );

    console.log(
      "PASS"
    );

    console.log(
      "=========================================="
    );

    window.alert(
      "M10.4 Profile Manager QA — PASS ✅"
    );

  } catch (
    error
  ) {

    console.error(
      "M10.4 Profile Manager QA — FAILED",
      error
    );

    window.alert(
      "M10.4 Profile Manager QA — FAILED ❌\n\n" +
      String(error)
    );
  }
}
