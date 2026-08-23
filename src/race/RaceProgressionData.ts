/**
 * ============================================================
 * RaceNova V2
 * Race Progression Data
 * M6.9
 * ============================================================
 *
 * Responsibilities:
 * - Race progression data model
 * - Race definitions
 * - Player race progress
 * - Level unlocking
 * - Race completion tracking
 * - Win tracking
 * - Best position
 * - Best time
 * - Boss defeat tracking
 * - Safe save-data normalization
 *
 * IMPORTANT:
 * - No DOM dependency
 * - No Three.js dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - Pure progression data layer
 *
 * M6.9:
 * - Progression Save / Reload compatibility
 * - readonly RaceDefinition[] support
 * ============================================================
 */

// ============================================================
// Version
// ============================================================

export const RACE_PROGRESSION_VERSION =
  1;

// ============================================================
// Race Status
// ============================================================

export type RaceStatus =
  | "locked"
  | "available"
  | "completed";

// ============================================================
// Race Definition
// ============================================================

export interface RaceDefinition {

  /**
   * Stable race identifier.
   */
  id: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Campaign level.
   */
  level: number;

  /**
   * Optional description.
   */
  description?: string;

  /**
   * Whether this race contains
   * a boss encounter.
   */
  isBoss?: boolean;
}

// ============================================================
// Race Progress
// ============================================================

export interface RaceProgress {

  /**
   * Stable race identifier.
   */
  raceId: string;

  /**
   * Current unlock/completion state.
   */
  status: RaceStatus;

  /**
   * Number of times the race
   * has been completed.
   */
  completionCount: number;

  /**
   * Number of wins.
   */
  winCount: number;

  /**
   * Best finishing position.
   *
   * 0 = no recorded result.
   */
  bestPosition: number;

  /**
   * Best race time in seconds.
   *
   * 0 = no recorded time.
   */
  bestTime: number;

  /**
   * Whether the boss associated
   * with this race has been defeated.
   */
  bossDefeated: boolean;
}

// ============================================================
// Complete Progression State
// ============================================================

export interface RaceProgressionState {

  /**
   * Save/data-model version.
   */
  version: number;

  /**
   * Highest campaign level unlocked.
   */
  unlockedLevel: number;

  /**
   * Currently selected race.
   */
  selectedRaceId: string;

  /**
   * Total completed races.
   */
  racesCompleted: number;

  /**
   * Total races won.
   */
  racesWon: number;

  /**
   * Total bosses defeated.
   */
  bossesDefeated: number;

  /**
   * Individual race progress.
   */
  races: RaceProgress[];
}

// ============================================================
// Safe Number Helpers
// ============================================================

export function safeNumber(
  value: unknown,
  fallback: number
): number {

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return value;
}

// ============================================================
// Safe Integer Helper
// ============================================================

export function safeInteger(
  value: unknown,
  fallback: number,
  minimum?: number
): number {

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  let result =
    Math.floor(value);

  if (
    minimum !== undefined &&
    result < minimum
  ) {
    result =
      minimum;
  }

  return result;
}

// ============================================================
// Default Race Progress
// ============================================================

export function createDefaultRaceProgress(
  raceId: string,
  available: boolean = false
): RaceProgress {

  return {

    raceId,

    status:
      available
        ? "available"
        : "locked",

    completionCount:
      0,

    winCount:
      0,

    bestPosition:
      0,

    bestTime:
      0,

    bossDefeated:
      false
  };
}

// ============================================================
// Default Progression State
// ============================================================
//
// IMPORTANT:
// readonly RaceDefinition[] is intentional.
// RACE_DEFINITIONS is a readonly array and
// progression only reads the definitions.
// ============================================================

export function createDefaultRaceProgressionState(
  races: readonly RaceDefinition[]
): RaceProgressionState {

  const normalizedRaces =
    races.map(
      (
        definition,
        index
      ) => {

        return createDefaultRaceProgress(
          definition.id,
          index === 0
        );
      }
    );

  const firstRace =
    races.length > 0
      ? races[0].id
      : "";

  return {

    version:
      RACE_PROGRESSION_VERSION,

    unlockedLevel:
      races.length > 0
        ? Math.max(
            1,
            safeInteger(
              races[0].level,
              1,
              1
            )
          )
        : 1,

    selectedRaceId:
      firstRace,

    racesCompleted:
      0,

    racesWon:
      0,

    bossesDefeated:
      0,

    races:
      normalizedRaces
  };
}

// ============================================================
// Normalize Progression State
// ============================================================
//
// IMPORTANT:
// readonly RaceDefinition[] is intentional.
// This allows the function to accept:
// - RaceDefinition[]
// - readonly RaceDefinition[]
// - RACE_DEFINITIONS
// ============================================================

export function normalizeRaceProgressionState(
  value: unknown,
  races: readonly RaceDefinition[]
): RaceProgressionState {

  // ==========================================================
  // Default State
  // ==========================================================

  const defaults =
    createDefaultRaceProgressionState(
      races
    );

  // ==========================================================
  // Validate Input
  // ==========================================================

  if (
    !value ||
    typeof value !== "object"
  ) {
    return defaults;
  }

  // ==========================================================
  // Read Saved Data Safely
  // ==========================================================

  const data =
    value as Record<
      string,
      unknown
    >;

  // ==========================================================
  // Saved Race List
  // ==========================================================

  const savedRaces =
    Array.isArray(
      data["races"]
    )
      ? data["races"]
      : [];

  // ==========================================================
  // Normalize Individual Races
  // ==========================================================

  const normalizedRaces =
    races.map(
      (
        definition,
        index
      ) => {

        const saved =
          savedRaces.find(
            (item) => {

              if (
                !item ||
                typeof item !== "object"
              ) {
                return false;
              }

              const race =
                item as Record<
                  string,
                  unknown
                >;

              return (
                race["raceId"] ===
                definition.id
              );
            }
          );

        // ----------------------------------------------------
        // No saved progress
        // ----------------------------------------------------

        if (
          !saved ||
          typeof saved !== "object"
        ) {

          return createDefaultRaceProgress(
            definition.id,
            index === 0
          );
        }

        const race =
          saved as Record<
            string,
            unknown
          >;

        // ----------------------------------------------------
        // Completion Count
        // ----------------------------------------------------

        const completionCount =
          safeInteger(
            race["completionCount"],
            0,
            0
          );

        // ----------------------------------------------------
        // Win Count
        // ----------------------------------------------------

        const winCount =
          safeInteger(
            race["winCount"],
            0,
            0
          );

        // ----------------------------------------------------
        // Status
        // ----------------------------------------------------

        let status:
          RaceStatus;

        if (
          winCount > 0
        ) {

          status =
            "completed";

        } else if (
          race["status"] ===
          "available"
        ) {

          status =
            "available";

        } else if (
          race["status"] ===
          "completed"
        ) {

          status =
            "completed";

        } else {

          status =
            "locked";
        }

        // ----------------------------------------------------
        // Best Position
        // ----------------------------------------------------

        const bestPosition =
          safeInteger(
            race["bestPosition"],
            0,
            0
          );

        // ----------------------------------------------------
        // Best Time
        // ----------------------------------------------------

        const bestTime =
          Math.max(
            0,
            safeNumber(
              race["bestTime"],
              0
            )
          );

        // ----------------------------------------------------
        // Boss Defeated
        // ----------------------------------------------------

        const bossDefeated =
          race["bossDefeated"] ===
          true;

        // ----------------------------------------------------
        // Return Normalized Race
        // ----------------------------------------------------

        return {

          raceId:
            definition.id,

          status,

          completionCount,

          winCount,

          bestPosition,

          bestTime,

          bossDefeated
        };
      }
    );

  // ==========================================================
  // Safe Unlocked Level
  // ==========================================================

  const rawUnlockedLevel =
    data["unlockedLevel"];

  const unlockedLevel =
    safeInteger(
      rawUnlockedLevel,
      defaults.unlockedLevel,
      1
    );

  // ==========================================================
  // Safe Selected Race
  // ==========================================================

  const rawSelectedRaceId =
    data["selectedRaceId"];

  let selectedRaceId =
    typeof rawSelectedRaceId ===
      "string"
      ? rawSelectedRaceId
      : defaults.selectedRaceId;

  // ----------------------------------------------------------
  // Ensure selected race exists.
  // ----------------------------------------------------------

  const selectedRaceExists =
    normalizedRaces.some(
      (race) =>
        race.raceId ===
        selectedRaceId
    );

  if (
    !selectedRaceExists
  ) {

    selectedRaceId =
      defaults.selectedRaceId;
  }

  // ==========================================================
  // Safe Counters
  // ==========================================================

  const racesCompleted =
    safeInteger(
      data["racesCompleted"],
      0,
      0
    );

  const racesWon =
    safeInteger(
      data["racesWon"],
      0,
      0
    );

  const bossesDefeated =
    safeInteger(
      data["bossesDefeated"],
      0,
      0
    );

  // ==========================================================
  // Return Normalized State
  // ==========================================================

  return {

    version:
      RACE_PROGRESSION_VERSION,

    unlockedLevel,

    selectedRaceId,

    racesCompleted,

    racesWon,

    bossesDefeated,

    races:
      normalizedRaces
  };
}

// ============================================================
// Find Race Progress
// ============================================================

export function getRaceProgress(
  state: RaceProgressionState,
  raceId: string
): RaceProgress | undefined {

  if (
    !state ||
    !Array.isArray(
      state.races
    )
  ) {
    return undefined;
  }

  return state.races.find(
    (race) =>
      race.raceId === raceId
  );
}

// ============================================================
// Check Race Availability
// ============================================================

export function isRaceAvailable(
  state: RaceProgressionState,
  raceId: string
): boolean {

  const race =
    getRaceProgress(
      state,
      raceId
    );

  if (!race) {
    return false;
  }

  return (
    race.status ===
      "available" ||
    race.status ===
      "completed"
  );
}

// ============================================================
// Check Race Completion
// ============================================================

export function isRaceCompleted(
  state: RaceProgressionState,
  raceId: string
): boolean {

  const race =
    getRaceProgress(
      state,
      raceId
    );

  if (!race) {
    return false;
  }

  return (
    race.status ===
    "completed"
  );
}

// ============================================================
// Get Next Locked Race
// ============================================================

export function getNextLockedRace(
  state: RaceProgressionState
): RaceProgress | undefined {

  if (
    !state ||
    !Array.isArray(
      state.races
    )
  ) {
    return undefined;
  }

  return state.races.find(
    (race) =>
      race.status ===
      "locked"
  );
}

// ============================================================
// Clone Progression State
// ============================================================

export function cloneRaceProgressionState(
  state: RaceProgressionState
): RaceProgressionState {

  return {

    version:
      state.version,

    unlockedLevel:
      state.unlockedLevel,

    selectedRaceId:
      state.selectedRaceId,

    racesCompleted:
      state.racesCompleted,

    racesWon:
      state.racesWon,

    bossesDefeated:
      state.bossesDefeated,

    races:
      state.races.map(
        (race) => ({

          raceId:
            race.raceId,

          status:
            race.status,

          completionCount:
            race.completionCount,

          winCount:
            race.winCount,

          bestPosition:
            race.bestPosition,

          bestTime:
            race.bestTime,

          bossDefeated:
            race.bossDefeated
        })
      )
  };
}
