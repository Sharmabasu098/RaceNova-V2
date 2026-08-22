/**
 * ============================================================
 * RaceNova V2
 * Race Definitions
 * M6.2
 * ============================================================
 *
 * Authoritative campaign race definitions.
 *
 * Responsibilities:
 * - Define campaign races
 * - Define race IDs
 * - Define level order
 * - Define race names
 * - Define race descriptions
 * - Mark boss races
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No SaveSystem dependency
 * - No localStorage dependency
 * - No unlock logic
 * - No gameplay logic
 *
 * M6.3 will use these definitions
 * for the Race Unlock System.
 * ============================================================
 */

import {
  type RaceDefinition
} from "./RaceProgressionData";

// ============================================================
// Race Definitions
// ============================================================

export const RACE_DEFINITIONS:
  readonly RaceDefinition[] = [

  // ==========================================================
  // Level 1
  // ==========================================================

  {
    id:
      "race_01",

    name:
      "First Run",

    level:
      1,

    description:
      "Your first RaceNova campaign race.",

    isBoss:
      false
  },

  // ==========================================================
  // Level 2
  // ==========================================================

  {
    id:
      "race_02",

    name:
      "Rising Speed",

    level:
      2,

    description:
      "A faster race with tougher traffic.",

    isBoss:
      false
  },

  // ==========================================================
  // Level 3
  // ==========================================================

  {
    id:
      "race_03",

    name:
      "Highway Rush",

    level:
      3,

    description:
      "Push your car harder through the highway.",

    isBoss:
      false
  },

  // ==========================================================
  // Level 4
  // ==========================================================

  {
    id:
      "race_04",

    name:
      "Street Challenge",

    level:
      4,

    description:
      "The competition becomes more aggressive.",

    isBoss:
      false
  },

  // ==========================================================
  // Level 5
  // ==========================================================

  {
    id:
      "race_05",

    name:
      "Velocity Run",

    level:
      5,

    description:
      "A high-speed campaign challenge.",

    isBoss:
      false
  },

  // ==========================================================
  // Level 6
  // ==========================================================

  {
    id:
      "race_06",

    name:
      "Rival Territory",

    level:
      6,

    description:
      "Enter territory controlled by stronger rivals.",

    isBoss:
      false
  },

  // ==========================================================
  // Level 7
  // ==========================================================

  {
    id:
      "race_07",

    name:
      "Final Rival",

    level:
      7,

    description:
      "Defeat the final rival before the boss.",

    isBoss:
      false
  },

  // ==========================================================
  // Level 8 — Boss
  // ==========================================================

  {
    id:
      "boss_01",

    name:
      "The First Boss",

    level:
      8,

    description:
      "Face the first RaceNova campaign boss.",

    isBoss:
      true
  }
];

// ============================================================
// Default Race
// ============================================================

export const DEFAULT_RACE_ID =
  RACE_DEFINITIONS.length > 0
    ? RACE_DEFINITIONS[0].id
    : "";

// ============================================================
// Get Race Definition
// ============================================================

export function getRaceDefinition(
  raceId: string
): RaceDefinition | undefined {

  return RACE_DEFINITIONS.find(
    (race) =>
      race.id === raceId
  );
}

// ============================================================
// Get Race By Level
// ============================================================

export function getRaceByLevel(
  level: number
): RaceDefinition | undefined {

  return RACE_DEFINITIONS.find(
    (race) =>
      race.level === level
  );
}

// ============================================================
// Get All Boss Races
// ============================================================

export function getBossRaces():
  readonly RaceDefinition[] {

  return RACE_DEFINITIONS.filter(
    (race) =>
      race.isBoss === true
  );
}

// ============================================================
// Get All Normal Races
// ============================================================

export function getNormalRaces():
  readonly RaceDefinition[] {

  return RACE_DEFINITIONS.filter(
    (race) =>
      race.isBoss !== true
  );
}

// ============================================================
// Validate Race Definitions
// ============================================================

export function isValidRaceDefinitions():
  boolean {

  if (
    RACE_DEFINITIONS.length === 0
  ) {
    return false;
  }

  const ids =
    new Set<string>();

  for (
    const race of RACE_DEFINITIONS
  ) {

    if (
      !race.id ||
      typeof race.id !== "string"
    ) {
      return false;
    }

    if (
      ids.has(race.id)
    ) {
      return false;
    }

    ids.add(
      race.id
    );

    if (
      !Number.isInteger(
        race.level
      ) ||
      race.level < 1
    ) {
      return false;
    }

    if (
      !race.name ||
      typeof race.name !== "string"
    ) {
      return false;
    }
  }

  return true;
}
