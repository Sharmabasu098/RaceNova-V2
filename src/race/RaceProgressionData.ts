/**
 * ============================================================
 * RaceNova V2
 * Race Progression Data Model
 * M6.1
 * ============================================================
 *
 * Responsibilities:
 * - Race definitions
 * - Campaign progression state
 * - Race completion state
 * - Race win state
 * - Boss race metadata
 * - Race unlock requirements
 * - Safe validation
 *
 * IMPORTANT:
 * - No gameplay logic
 * - No Three.js dependency
 * - No localStorage logic
 * - No SaveSystem logic
 * - No EconomyManager logic
 *
 * M6.2+ systems will consume this model.
 * ============================================================
 */

// ============================================================
// Race ID
// ============================================================

export type RaceId = string;

// ============================================================
// Race Type
// ============================================================

export type RaceType =
  | "normal"
  | "rival"
  | "boss";

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
   * Unique race identifier.
   */
  id: RaceId;

  /**
   * Display name.
   */
  name: string;

  /**
   * Campaign order.
   *
   * Starts from 1.
   */
  order: number;

  /**
   * Race category.
   */
  type: RaceType;

  /**
   * Optional description.
   */
  description: string;

  /**
   * Minimum player level required.
   */
  requiredLevel: number;

  /**
   * Previous race that must be completed.
   *
   * Empty string means no prerequisite.
   */
  requiredRaceId: RaceId | null;

  /**
   * Number of rival opponents.
   */
  rivalCount: number;

  /**
   * Base difficulty.
   *
   * 1 = easiest.
   */
  difficulty: number;

  /**
   * Whether this race is a boss race.
   */
  isBoss: boolean;

  /**
   * Optional boss identifier.
   */
  bossId: string | null;

  /**
   * Coin reward for completing the race.
   */
  coinReward: number;
}

// ============================================================
// Race Progress State
// ============================================================

export interface RaceProgressState {

  /**
   * Race identifier.
   */
  raceId: RaceId;

  /**
   * Current status.
   */
  status: RaceStatus;

  /**
   * Number of times this race was completed.
   */
  completionCount: number;

  /**
   * Number of wins.
   */
  winCount: number;

  /**
   * Best finishing position.
   *
   * 1 = first place.
   *
   * 0 = no recorded finish.
   */
  bestPosition: number;

  /**
   * Best recorded time in seconds.
   *
   * 0 = no recorded time.
   */
  bestTime: number;

  /**
   * Whether the player has defeated
   * the boss associated with this race.
   */
  bossDefeated: boolean;
}

// ============================================================
// Campaign Progression
// ============================================================

export interface RaceProgressionState {

  /**
   * Current progression schema version.
   */
  version: number;

  /**
   * Currently available campaign level.
   *
   * Starts at 1.
   */
  unlockedLevel: number;

  /**
   * Currently selected race.
   *
   * null means no race selected.
   */
  selectedRaceId: RaceId | null;

  /**
   * Total completed races.
   */
  racesCompleted: number;

  /**
   * Total races won.
   */
  racesWon: number;

  /**
   * Total boss races defeated.
   */
  bossesDefeated: number;

  /**
   * Individual race progress.
   */
  races: RaceProgressState[];
}

// ============================================================
// Version
// ============================================================

export const RACE_PROGRESSION_VERSION = 1;

// ============================================================
// Default Race Progress
// ============================================================

export function createDefaultRaceProgress(
  raceId: RaceId,
  available = false
): RaceProgressState {

  return {
    raceId,

    status:
      available
        ? "available"
        : "locked",

    completionCount: 0,

    winCount: 0,

    bestPosition: 0,

    bestTime: 0,

    bossDefeated: false
  };
}

// ============================================================
// Default Progression State
// ============================================================

export function createDefaultRaceProgressionState(
  races: RaceDefinition[]
): RaceProgressionState {

  const sortedRaces =
    [...races].sort(
      (a, b) =>
        a.order - b.order
    );

  const firstRace =
    sortedRaces.length > 0
      ? sortedRaces[0]
      : null;

  return {
    version:
      RACE_PROGRESSION_VERSION,

    unlockedLevel:
      firstRace
        ? Math.max(
            1,
            firstRace.order
          )
        : 1,

    selectedRaceId:
      firstRace
        ? firstRace.id
        : null,

    racesCompleted: 0,

    racesWon: 0,

    bossesDefeated: 0,

    races:
      sortedRaces.map(
        (
          race,
          index
        ) =>
          createDefaultRaceProgress(
            race.id,
            index === 0
          )
      )
  };
}

// ============================================================
// Race Lookup
// ============================================================

export function getRaceById(
  races: RaceDefinition[],
  raceId: RaceId
): RaceDefinition | null {

  return (
    races.find(
      (race) =>
        race.id === raceId
    ) ?? null
  );
}

// ============================================================
// Race Progress Lookup
// ============================================================

export function getRaceProgress(
  state: RaceProgressionState,
  raceId: RaceId
): RaceProgressState | null {

  return (
    state.races.find(
      (race) =>
        race.raceId === raceId
    ) ?? null
  );
}

// ============================================================
// Race Unlock Check
// ============================================================

export function canUnlockRace(
  race: RaceDefinition,
  state: RaceProgressionState
): boolean {

  // --------------------------------------------------------
  // Level requirement
  // --------------------------------------------------------

  if (
    state.unlockedLevel <
    race.requiredLevel
  ) {
    return false;
  }

  // --------------------------------------------------------
  // Previous race requirement
  // --------------------------------------------------------

  if (
    race.requiredRaceId
  ) {

    const previousRace =
      getRaceProgress(
        state,
        race.requiredRaceId
      );

    if (
      !previousRace ||
      previousRace.winCount <= 0
    ) {
      return false;
    }
  }

  return true;
}

// ============================================================
// Race Completed Check
// ============================================================

export function isRaceCompleted(
  state: RaceProgressionState,
  raceId: RaceId
): boolean {

  const progress =
    getRaceProgress(
      state,
      raceId
    );

  return (
    progress !== null &&
    progress.completionCount > 0
  );
}

// ============================================================
// Race Won Check
// ============================================================

export function isRaceWon(
  state: RaceProgressionState,
  raceId: RaceId
): boolean {

  const progress =
    getRaceProgress(
      state,
      raceId
    );

  return (
    progress !== null &&
    progress.winCount > 0
  );
}

// ============================================================
// Boss Defeated Check
// ============================================================

export function isBossDefeated(
  state: RaceProgressionState,
  raceId: RaceId
): boolean {

  const progress =
    getRaceProgress(
      state,
      raceId
    );

  return (
    progress !== null &&
    progress.bossDefeated
  );
}

// ============================================================
// Safe Number Helpers
// ============================================================

function safeInteger(
  value: unknown,
  fallback: number,
  minimum = 0
): number {

  return Math.max(
    minimum,
    Math.floor(
      Number.isFinite(
        value as number
      )
        ? value as number
        : fallback
    )
  );
}

function safeNumber(
  value: unknown,
  fallback: number,
  minimum = 0
): number {

  return Math.max(
    minimum,
    Number.isFinite(
      value as number
    )
      ? value as number
      : fallback
  );
}

// ============================================================
// Validation
// ============================================================

export function isValidRaceProgressionState(
  value: unknown
): value is RaceProgressionState {

  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const data =
    value as Partial<RaceProgressionState>;

  if (
    data.version !==
    RACE_PROGRESSION_VERSION
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      data.unlockedLevel
    ) ||
    data.unlockedLevel < 1
  ) {
    return false;
  }

  if (
    !Array.isArray(
      data.races
    )
  ) {
    return false;
  }

  return data.races.every(
    (race) => {

      if (
        !race ||
        typeof race !== "object"
      ) {
        return false;
      }

      const item =
        race as Partial<RaceProgressState>;

      return (
        typeof item.raceId ===
          "string" &&

        typeof item.status ===
          "string" &&

        (
          item.status === "locked" ||
          item.status === "available" ||
          item.status === "completed"
        ) &&

        Number.isFinite(
          item.completionCount
        ) &&

        Number.isFinite(
          item.winCount
        ) &&

        Number.isFinite(
          item.bestPosition
        ) &&

        Number.isFinite(
          item.bestTime
        ) &&

        typeof item.bossDefeated ===
          "boolean"
      );
    }
  );
}

// ============================================================
// Normalize Progression State
// ============================================================

export function normalizeRaceProgressionState(
  value: unknown,
  races: RaceDefinition[]
): RaceProgressionState {

  // ==========================================================
  // Default State
  // ==========================================================

  const defaults =
    createDefaultRaceProgressionState(
      races
    );

  // ==========================================================
  // Validate Input Object
  // ==========================================================

  if (
    !value ||
    typeof value !== "object"
  ) {
    return defaults;
  }

  // ==========================================================
  // Safe Partial Data
  // ==========================================================

  const data =
    value as Partial<RaceProgressionState>;

  // ==========================================================
  // Saved Race List
  // ==========================================================

  const savedRaces =
    Array.isArray(
      data.races
    )
      ? data.races
      : [];

  // ==========================================================
  // Normalize Individual Race Progress
  // ==========================================================

  const normalizedRaces =
    races.map(
      (
        definition,
        index
      ) => {

        const saved =
          savedRaces.find(
            (item) =>
              item &&
              item.raceId ===
                definition.id
          );

        // ----------------------------------------------------
        // No saved progress
        // ----------------------------------------------------

        if (!saved) {

          return createDefaultRaceProgress(
            definition.id,
            index === 0
          );
        }

        // ----------------------------------------------------
        // Completion Count
        // ----------------------------------------------------

        const completionCount =
          safeInteger(
            saved.completionCount,
            0
          );

        // ----------------------------------------------------
        // Win Count
        // ----------------------------------------------------

        const winCount =
          safeInteger(
            saved.winCount,
            0
          );

        // ----------------------------------------------------
        // Race Status
        // ----------------------------------------------------

        let status:
          RaceStatus;

        if (
          winCount > 0
        ) {

          status =
            "completed";

        } else if (
          saved.status ===
          "available"
        ) {

          status =
            "available";

        } else {

          status =
            "locked";
        }

        // ----------------------------------------------------
        // Return Normalized Race
        // ----------------------------------------------------

        return {

          raceId:
            definition.id,

          status,

          completionCount,

          winCount,

          bestPosition:
            safeInteger(
              saved.bestPosition,
              0
            ),

          bestTime:
            safeNumber(
              saved.bestTime,
              0
            ),

          bossDefeated:
            Boolean(
              saved.bossDefeated
            )
        };
      }
    );

  // ==========================================================
  // Safe Unlocked Level
  // M6.1
  // ==========================================================

  /*
   * IMPORTANT:
   *
   * Read unlockedLevel through an
   * unknown record value.
   *
   * This prevents TypeScript
   * TS18048 optional-property
   * narrowing errors.
   */

  const rawUnlockedLevel =
    (
      data as Record<
        string,
        unknown
      >
    )[
      "unlockedLevel"
    ];

  const unlockedLevel =
    typeof rawUnlockedLevel ===
      "number" &&
    Number.isFinite(
      rawUnlockedLevel
    )
      ? rawUnlockedLevel
      : defaults.unlockedLevel;

  // ==========================================================
  // Safe Selected Race
  // ==========================================================

  const rawSelectedRaceId =
    (
      data as Record<
        string,
        unknown
      >
    )[
      "selectedRaceId"
    ];

  const selectedRaceId =
    typeof rawSelectedRaceId ===
      "string"
      ? rawSelectedRaceId
      : defaults.selectedRaceId;

  // ==========================================================
  // Safe Race Counters
  // ==========================================================

  const rawRacesCompleted =
    (
      data as Record<
        string,
        unknown
      >
    )[
      "racesCompleted"
    ];

  const rawRacesWon =
    (
      data as Record<
        string,
        unknown
      >
    )[
      "racesWon"
    ];

  const rawBossesDefeated =
    (
      data as Record<
        string,
        unknown
      >
    )[
      "bossesDefeated"
    ];

  // ==========================================================
  // Return Normalized Progression State
  // ==========================================================

  return {

    version:
      RACE_PROGRESSION_VERSION,

    unlockedLevel:
      safeInteger(
        unlockedLevel,
        defaults.unlockedLevel,
        1
      ),

    selectedRaceId:
      selectedRaceId,

    racesCompleted:
      safeInteger(
        rawRacesCompleted,
        0
      ),

    racesWon:
      safeInteger(
        rawRacesWon,
        0
      ),

    bossesDefeated:
      safeInteger(
        rawBossesDefeated,
        0
      ),

    races:
      normalizedRaces
  };
}
