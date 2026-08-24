/**
 * ============================================================
 * RaceNova V2
 * Boss Difficulty
 * M6.8.1
 * ============================================================
 *
 * Responsibilities:
 * - Define Boss difficulty levels
 * - Provide safe Boss AI configurations
 * - Keep difficulty data separate from BossAI
 * - Keep progression logic separate from BossAI
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No RaceProgression dependency
 *
 * M6.8.1:
 * Boss Difficulty Profiles
 * ============================================================
 */

import type {
  BossAIConfig
} from "./BossAI";

// ============================================================
// Boss Difficulty Level
// ============================================================

export type BossDifficultyLevel =
  | "easy"
  | "normal"
  | "hard"
  | "elite"
  | "legendary";

// ============================================================
// Boss Difficulty Profile
// ============================================================

export interface BossDifficultyProfile {

  /**
   * Difficulty identifier.
   */
  level:
    BossDifficultyLevel;

  /**
   * Boss maximum speed.
   *
   * km/h
   */
  maxSpeed:
    number;

  /**
   * Boss acceleration.
   *
   * km/h per second.
   */
  acceleration:
    number;

  /**
   * Lateral lane-change speed.
   */
  laneChangeSpeed:
    number;

  /**
   * Minimum time between
   * automatic lane changes.
   */
  laneChangeCooldown:
    number;

  /**
   * Distance at which Boss
   * becomes aware of player.
   */
  playerAwarenessDistance:
    number;

  /**
   * Distance at which Boss
   * aggressively pursues player.
   */
  pursuitDistance:
    number;
}

// ============================================================
// Default Difficulty Profiles
// ============================================================

const DIFFICULTY_PROFILES:
  Readonly<
    Record<
      BossDifficultyLevel,
      BossDifficultyProfile
    >
  > = {

  // ----------------------------------------------------------
  // EASY
  // ----------------------------------------------------------

  easy: {

    level:
      "easy",

    maxSpeed:
      105,

    acceleration:
      28,

    laneChangeSpeed:
      6,

    laneChangeCooldown:
      1.75,

    playerAwarenessDistance:
      70,

    pursuitDistance:
      30
  },

  // ----------------------------------------------------------
  // NORMAL
  // ----------------------------------------------------------

  normal: {

    level:
      "normal",

    maxSpeed:
      120,

    acceleration:
      35,

    laneChangeSpeed:
      8,

    laneChangeCooldown:
      1.25,

    playerAwarenessDistance:
      90,

    pursuitDistance:
      45
  },

  // ----------------------------------------------------------
  // HARD
  // ----------------------------------------------------------

  hard: {

    level:
      "hard",

    maxSpeed:
      135,

    acceleration:
      42,

    laneChangeSpeed:
      10,

    laneChangeCooldown:
      1.0,

    playerAwarenessDistance:
      110,

    pursuitDistance:
      55
  },

  // ----------------------------------------------------------
  // ELITE
  // ----------------------------------------------------------

  elite: {

    level:
      "elite",

    maxSpeed:
      150,

    acceleration:
      50,

    laneChangeSpeed:
      12,

    laneChangeCooldown:
      0.8,

    playerAwarenessDistance:
      130,

    pursuitDistance:
      65
  },

  // ----------------------------------------------------------
  // LEGENDARY
  // ----------------------------------------------------------

  legendary: {

    level:
      "legendary",

    maxSpeed:
      165,

    acceleration:
      58,

    laneChangeSpeed:
      14,

    laneChangeCooldown:
      0.65,

    playerAwarenessDistance:
      150,

    pursuitDistance:
      75
  }
};

// ============================================================
// Get Difficulty Profile
// ============================================================

export function getBossDifficultyProfile(
  level:
    BossDifficultyLevel
): BossDifficultyProfile {

  const profile =
    DIFFICULTY_PROFILES[
      level
    ];

  return {
    ...profile
  };
}

// ============================================================
// Convert Difficulty Profile
// to BossAI Configuration
// ============================================================

export function getBossAIConfigForDifficulty(
  level:
    BossDifficultyLevel
): BossAIConfig {

  const profile =
    getBossDifficultyProfile(
      level
    );

  return {

    laneCount:
      3,

    laneWidth:
      4,

    laneChangeSpeed:
      profile.laneChangeSpeed,

    laneChangeCooldown:
      profile.laneChangeCooldown,

    playerAwarenessDistance:
      profile.playerAwarenessDistance,

    pursuitDistance:
      profile.pursuitDistance,

    maxSpeed:
      profile.maxSpeed,

    acceleration:
      profile.acceleration
  };
}

// ============================================================
// Get Difficulty Order
// ============================================================

export function getBossDifficultyOrder():
  BossDifficultyLevel[] {

  return [

    "easy",

    "normal",

    "hard",

    "elite",

    "legendary"
  ];
}

// ============================================================
// Get Next Difficulty
// ============================================================

export function getNextBossDifficulty(
  level:
    BossDifficultyLevel
):
  BossDifficultyLevel {

  switch (
    level
  ) {

    case "easy":
      return "normal";

    case "normal":
      return "hard";

    case "hard":
      return "elite";

    case "elite":
      return "legendary";

    case "legendary":
      return "legendary";

    default:
      return "normal";
  }
}

// ============================================================
// Validate Difficulty
// ============================================================

export function isValidBossDifficulty(
  value:
    unknown
): value is BossDifficultyLevel {

  return (

    value === "easy" ||

    value === "normal" ||

    value === "hard" ||

    value === "elite" ||

    value === "legendary"
  );
}

// ============================================================
// Default Difficulty
// ============================================================

export const DEFAULT_BOSS_DIFFICULTY:
  BossDifficultyLevel =
    "normal";
