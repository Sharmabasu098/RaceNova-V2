/**
 * ============================================================
 * RaceNova V2
 * Player Save Data
 * M6.9
 * ============================================================
 *
 * Complete persistent player save structure.
 *
 * M4.9:
 * - Economy
 * - Garage
 * - Upgrades
 * - Basic player progress
 *
 * M6.9:
 * - Race progression
 * - Selected race
 * - Race completion
 * - Race wins
 * - Best position
 * - Best time
 * - Boss defeat state
 *
 * IMPORTANT:
 * - No UI logic
 * - No localStorage logic
 * - No Three.js dependency
 * - No direct storage access
 * - SaveSystem remains the only storage layer
 * ============================================================
 */

import type {
  EconomyState
} from "../economy/EconomyTypes";

import type {
  GarageState
} from "../garage/GarageManager";

import type {
  UpgradeState
} from "../garage/UpgradeSystem";

import {
  type RaceProgressionState,
  type RaceProgress,
  type RaceDefinition,
  createDefaultRaceProgressionState,
  normalizeRaceProgressionState
} from "../progression/RaceProgressionData";

// ============================================================
// Save Version
// ============================================================

export const PLAYER_SAVE_VERSION = 1;

// ============================================================
// Player Progress
// ============================================================

export interface PlayerProgress {

  /**
   * Highest campaign level unlocked.
   *
   * M4.9 compatibility field.
   */
  unlockedLevel: number;

  /**
   * Total races completed.
   */
  racesCompleted: number;

  /**
   * Total races won.
   */
  racesWon: number;

  /**
   * Total distance travelled.
   */
  totalDistance: number;

  /**
   * Currently selected campaign race.
   *
   * M6.9.
   */
  selectedRaceId: string;

  /**
   * Total bosses defeated.
   *
   * M6.9.
   */
  bossesDefeated: number;

  /**
   * Complete RaceNova campaign
   * progression state.
   *
   * M6.9 authoritative progression data.
   */
  raceProgression: RaceProgressionState;
}

// ============================================================
// Default Player Progress
// ============================================================

export const DEFAULT_PLAYER_PROGRESS:
  PlayerProgress = {

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

    raceProgression:
      createDefaultRaceProgressionState(
        []
      )
  };

// ============================================================
// Create Default Progress
// ============================================================

export function createDefaultPlayerProgress(
  races:
    RaceDefinition[] = []
): PlayerProgress {

  const progression =
    createDefaultRaceProgressionState(
      races
    );

  return {

    unlockedLevel:
      progression.unlockedLevel,

    racesCompleted:
      progression.racesCompleted,

    racesWon:
      progression.racesWon,

    totalDistance:
      0,

    selectedRaceId:
      progression.selectedRaceId,

    bossesDefeated:
      progression.bossesDefeated,

    raceProgression:
      progression
  };
}

// ============================================================
// Complete Player Save Data
// ============================================================

export interface PlayerSaveData {

  /**
   * Save-data schema version.
   */
  version: number;

  /**
   * Economy state.
   */
  economy: EconomyState;

  /**
   * Garage state.
   */
  garage: GarageState;

  /**
   * Upgrade state.
   */
  upgrades: UpgradeState;

  /**
   * General + campaign progress.
   */
  progress: PlayerProgress;

  /**
   * Save timestamp.
   */
  updatedAt: number;
}

// ============================================================
// Clone Race Progress
// ============================================================

function cloneRaceProgress(
  race: RaceProgress
): RaceProgress {

  return {

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
  };
}

// ============================================================
// Clone Race Progression
// ============================================================

function cloneRaceProgression(
  progression:
    RaceProgressionState
): RaceProgressionState {

  return {

    version:
      progression.version,

    unlockedLevel:
      progression.unlockedLevel,

    selectedRaceId:
      progression.selectedRaceId,

    racesCompleted:
      progression.racesCompleted,

    racesWon:
      progression.racesWon,

    bossesDefeated:
      progression.bossesDefeated,

    races:
      progression.races.map(
        cloneRaceProgress
      )
  };
}

// ============================================================
// Clone Player Progress
// ============================================================

function clonePlayerProgress(
  progress:
    PlayerProgress
): PlayerProgress {

  return {

    unlockedLevel:
      progress.unlockedLevel,

    racesCompleted:
      progress.racesCompleted,

    racesWon:
      progress.racesWon,

    totalDistance:
      progress.totalDistance,

    selectedRaceId:
      progress.selectedRaceId,

    bossesDefeated:
      progress.bossesDefeated,

    raceProgression:
      cloneRaceProgression(
        progress.raceProgression
      )
  };
}

// ============================================================
// Create Default Save Data
// ============================================================

export function createDefaultPlayerSaveData(
  economy:
    EconomyState,

  garage:
    GarageState,

  upgrades:
    UpgradeState,

  races:
    RaceDefinition[] = []
): PlayerSaveData {

  const progress =
    createDefaultPlayerProgress(
      races
    );

  return {

    version:
      PLAYER_SAVE_VERSION,

    economy: {

      wallet: {
        ...economy.wallet
      },

      transactions:
        economy.transactions.map(
          (
            transaction
          ) => ({
            ...transaction
          })
        ),

      version:
        economy.version
    },

    garage: {

      ownedCars: [
        ...garage.ownedCars
      ],

      selectedCar:
        garage.selectedCar
    },

    upgrades: {

      upgrades:
        Object.fromEntries(
          Object.entries(
            upgrades.upgrades
          ).map(
            (
              [
                carId,
                levels
              ]
            ) => [
              carId,
              {
                ...levels
              }
            ]
          )
        ) as UpgradeState["upgrades"]
    },

    progress,

    updatedAt:
      Date.now()
  };
}

// ============================================================
// Clone Save Data
// ============================================================

export function clonePlayerSaveData(
  data:
    PlayerSaveData
): PlayerSaveData {

  return {

    version:
      data.version,

    economy: {

      wallet: {
        ...data.economy.wallet
      },

      transactions:
        data.economy.transactions.map(
          (
            transaction
          ) => ({
            ...transaction
          })
        ),

      version:
        data.economy.version
    },

    garage: {

      ownedCars: [
        ...data.garage.ownedCars
      ],

      selectedCar:
        data.garage.selectedCar
    },

    upgrades: {

      upgrades:
        Object.fromEntries(
          Object.entries(
            data.upgrades.upgrades
          ).map(
            (
              [
                carId,
                levels
              ]
            ) => [
              carId,
              {
                ...levels
              }
            ]
          )
        ) as UpgradeState["upgrades"]
    },

    progress:
      clonePlayerProgress(
        data.progress
      ),

    updatedAt:
      data.updatedAt
  };
}

// ============================================================
// Normalize Player Progress
// ============================================================

export function normalizePlayerProgress(
  value:
    unknown,

  races:
    RaceDefinition[] = []
): PlayerProgress {

  const defaults =
    createDefaultPlayerProgress(
      races
    );

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return defaults;
  }

  const data =
    value as Record<
      string,
      unknown
    >;

  // ----------------------------------------------------------
  // Legacy / Basic Progress
  // ----------------------------------------------------------

  const unlockedLevel =
    Number.isFinite(
      data["unlockedLevel"]
    )
      ? Math.max(
          1,
          Math.floor(
            data["unlockedLevel"] as number
          )
        )
      : defaults.unlockedLevel;

  const racesCompleted =
    Number.isFinite(
      data["racesCompleted"]
    )
      ? Math.max(
          0,
          Math.floor(
            data["racesCompleted"] as number
          )
        )
      : 0;

  const racesWon =
    Number.isFinite(
      data["racesWon"]
    )
      ? Math.max(
          0,
          Math.floor(
            data["racesWon"] as number
          )
        )
      : 0;

  const totalDistance =
    Number.isFinite(
      data["totalDistance"]
    )
      ? Math.max(
          0,
          data["totalDistance"] as number
        )
      : 0;

  // ----------------------------------------------------------
  // Race Progression
  // ----------------------------------------------------------

  const raceProgression =
    normalizeRaceProgressionState(
      data["raceProgression"],
      races
    );

  // ----------------------------------------------------------
  // Keep legacy counters synchronized
  // ----------------------------------------------------------

  const finalUnlockedLevel =
    Math.max(
      unlockedLevel,
      raceProgression.unlockedLevel
    );

  const finalRacesCompleted =
    Math.max(
      racesCompleted,
      raceProgression.racesCompleted
    );

  const finalRacesWon =
    Math.max(
      racesWon,
      raceProgression.racesWon
    );

  const finalBossesDefeated =
    Math.max(
      Number.isFinite(
        data["bossesDefeated"]
      )
        ? Math.max(
            0,
            Math.floor(
              data["bossesDefeated"] as number
            )
          )
        : 0,

      raceProgression.bossesDefeated
    );

  const selectedRaceId =
    typeof data["selectedRaceId"] ===
      "string"
      ? data["selectedRaceId"] as string
      : raceProgression.selectedRaceId;

  return {

    unlockedLevel:
      finalUnlockedLevel,

    racesCompleted:
      finalRacesCompleted,

    racesWon:
      finalRacesWon,

    totalDistance,

    selectedRaceId,

    bossesDefeated:
      finalBossesDefeated,

    raceProgression: {

      ...raceProgression,

      unlockedLevel:
        finalUnlockedLevel,

      racesCompleted:
        finalRacesCompleted,

      racesWon:
        finalRacesWon,

      bossesDefeated:
        finalBossesDefeated,

      selectedRaceId:
        selectedRaceId
    }
  };
}

// ============================================================
// Validation
// ============================================================

export function isValidPlayerSaveData(
  data:
    unknown
): data is PlayerSaveData {

  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return false;
  }

  const save =
    data as Partial<
      PlayerSaveData
    >;

  // ----------------------------------------------------------
  // Version
  // ----------------------------------------------------------

  if (
    typeof save.version !==
      "number" ||
    !Number.isFinite(
      save.version
    ) ||
    save.version < 1
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Economy
  // ----------------------------------------------------------

  if (
    !save.economy ||
    typeof save.economy !==
      "object"
  ) {
    return false;
  }

  if (
    !save.economy.wallet ||
    typeof save.economy.wallet !==
      "object"
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      save.economy.wallet.coin
    ) ||
    save.economy.wallet.coin < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      save.economy.wallet.pi
    ) ||
    save.economy.wallet.pi < 0
  ) {
    return false;
  }

  if (
    !Array.isArray(
      save.economy.transactions
    )
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Garage
  // ----------------------------------------------------------

  if (
    !save.garage ||
    typeof save.garage !==
      "object"
  ) {
    return false;
  }

  if (
    !Array.isArray(
      save.garage.ownedCars
    )
  ) {
    return false;
  }

  if (
    typeof save.garage.selectedCar !==
      "string"
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Upgrades
  // ----------------------------------------------------------

  if (
    !save.upgrades ||
    typeof save.upgrades !==
      "object"
  ) {
    return false;
  }

  if (
    !save.upgrades.upgrades ||
    typeof save.upgrades.upgrades !==
      "object"
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Progress
  // ----------------------------------------------------------

  if (
    !save.progress ||
    typeof save.progress !==
      "object"
  ) {
    return false;
  }

  const progress =
    save.progress;

  if (
    !Number.isFinite(
      progress.unlockedLevel
    ) ||
    progress.unlockedLevel < 1
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progress.racesCompleted
    ) ||
    progress.racesCompleted < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progress.racesWon
    ) ||
    progress.racesWon < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progress.totalDistance
    ) ||
    progress.totalDistance < 0
  ) {
    return false;
  }

  if (
    typeof progress.selectedRaceId !==
      "string"
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progress.bossesDefeated
    ) ||
    progress.bossesDefeated < 0
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Race Progression
  // ----------------------------------------------------------

  if (
    !progress.raceProgression ||
    typeof progress.raceProgression !==
      "object"
  ) {
    return false;
  }

  const progression =
    progress.raceProgression;

  if (
    !Number.isFinite(
      progression.version
    )
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progression.unlockedLevel
    ) ||
    progression.unlockedLevel < 1
  ) {
    return false;
  }

  if (
    typeof progression.selectedRaceId !==
      "string"
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progression.racesCompleted
    ) ||
    progression.racesCompleted < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progression.racesWon
    ) ||
    progression.racesWon < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      progression.bossesDefeated
    ) ||
    progression.bossesDefeated < 0
  ) {
    return false;
  }

  if (
    !Array.isArray(
      progression.races
    )
  ) {
    return false;
  }

  for (
    const race
    of progression.races
  ) {

    if (
      !race ||
      typeof race !==
        "object"
    ) {
      return false;
    }

    if (
      typeof race.raceId !==
        "string"
    ) {
      return false;
    }

    if (
      race.status !==
        "locked" &&
      race.status !==
        "available" &&
      race.status !==
        "completed"
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        race.completionCount
      ) ||
      race.completionCount < 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        race.winCount
      ) ||
      race.winCount < 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        race.bestPosition
      ) ||
      race.bestPosition < 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        race.bestTime
      ) ||
      race.bestTime < 0
    ) {
      return false;
    }

    if (
      race.bossDefeated !== true &&
      race.bossDefeated !== false
    ) {
      return false;
    }
  }

  // ----------------------------------------------------------
  // Timestamp
  // ----------------------------------------------------------

  if (
    typeof save.updatedAt !==
      "number" ||
    !Number.isFinite(
      save.updatedAt
    ) ||
    save.updatedAt <= 0
  ) {
    return false;
  }

  return true;
}

// ============================================================
// Sanitize Progress
// ============================================================

export function sanitizePlayerProgress(
  progress:
    PlayerProgress
): PlayerProgress {

  return normalizePlayerProgress(
    progress,
    []
  );
}

// ============================================================
// Update Timestamp
// ============================================================

export function touchPlayerSaveData(
  data:
    PlayerSaveData
): PlayerSaveData {

  return {

    ...data,

    updatedAt:
      Date.now()
  };
}

// ============================================================
// Save Data Version Check
// ============================================================

export function isSupportedPlayerSaveVersion(
  version:
    number
): boolean {

  return (
    Number.isFinite(
      version
    ) &&
    Math.floor(
      version
    ) ===
      PLAYER_SAVE_VERSION
  );
}
