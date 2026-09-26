/**
 * ============================================================
 * RaceNova V2
 * M10.6.1 — Profile Validation Hardening QA
 * ============================================================
 *
 * Temporary functional QA.
 *
 * Verifies:
 * 1. Valid PlayerProfile
 * 2. Invalid profileId
 * 3. Invalid timestamps
 * 4. Invalid nested PlayerSaveData
 * 5. Unsupported PlayerSaveData version
 *
 * IMPORTANT:
 * - Temporary QA only
 * - No UI logic
 * - No localStorage logic
 * - No cloud logic
 * - No Three.js dependency
 * ============================================================
 */

import type {
  PlayerSaveData
} from "../save/PlayerSaveData";

import {
  createPlayerProfile,
  isValidPlayerProfile
} from "./PlayerProfile";

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

      ownedCars: [],

      selectedCar:
        ""
    },

    upgrades: {

      upgrades: {}
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
// QA Helper
// ============================================================

function assertQA(
  condition: boolean,
  message: string
): void {

  if (!condition) {

    throw new Error(
      `M10.6.1 QA FAILED: ${message}`
    );
  }
}

// ============================================================
// M10.6.1 Functional QA
// ============================================================

export function runM10_6_1_ProfileValidationQA():
  boolean {

  // ----------------------------------------------------------
  // Base Valid Profile
  // ----------------------------------------------------------

  const validProfile =
    createPlayerProfile(
      "m10_6_1_test_profile",
      createValidTestSaveData(),
      "QA Player"
    );

  assertQA(
    isValidPlayerProfile(
      validProfile
    ),
    "Valid PlayerProfile must be accepted."
  );

  // ----------------------------------------------------------
  // Invalid Profile ID
  // ----------------------------------------------------------

  const invalidProfileId =
    {
      ...validProfile,
      profileId: ""
    };

  assertQA(
    !isValidPlayerProfile(
      invalidProfileId
    ),
    "Empty profileId must be rejected."
  );

  // ----------------------------------------------------------
  // Invalid Created Timestamp
  // ----------------------------------------------------------

  const invalidCreatedAt =
    {
      ...validProfile,
      createdAt:
        0
    };

  assertQA(
    !isValidPlayerProfile(
      invalidCreatedAt
    ),
    "Invalid createdAt must be rejected."
  );

  // ----------------------------------------------------------
  // Invalid Updated Timestamp
  // ----------------------------------------------------------

  const invalidUpdatedAt =
    {
      ...validProfile,
      updatedAt:
        Number.NaN
    };

  assertQA(
    !isValidPlayerProfile(
      invalidUpdatedAt
    ),
    "Invalid updatedAt must be rejected."
  );

  // ----------------------------------------------------------
  // Invalid Nested PlayerSaveData
  // ----------------------------------------------------------

  const invalidNestedSaveData =
    {
      ...validProfile,
      saveData: {

        ...validProfile.saveData,

        economy:
          undefined
      }
    };

  assertQA(
    !isValidPlayerProfile(
      invalidNestedSaveData
    ),
    "Invalid nested PlayerSaveData must be rejected."
  );

  // ----------------------------------------------------------
  // Unsupported PlayerSaveData Version
  // ----------------------------------------------------------

  const unsupportedSaveVersion =
    {
      ...validProfile,
      saveData: {

        ...validProfile.saveData,

        version:
          999
      }
    };

  assertQA(
    !isValidPlayerProfile(
      unsupportedSaveVersion
    ),
    "Unsupported PlayerSaveData version must be rejected."
  );

  // ----------------------------------------------------------
  // PASS
  // ----------------------------------------------------------

  return true;
}
