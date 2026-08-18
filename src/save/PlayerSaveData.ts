/**
 * ============================================================
 * RaceNova V2
 * Player Save Data
 * M4.7
 * ============================================================
 *
 * Defines the complete player progress structure.
 *
 * IMPORTANT:
 * - No UI logic
 * - No localStorage logic
 * - No Pi payment logic
 * - No Three.js dependency
 * - No direct save/load storage
 *
 * This file only defines and validates the data structure
 * that the future Save System will persist.
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

// ============================================================
// Save Version
// ============================================================

export const PLAYER_SAVE_VERSION = 1;

// ============================================================
// Player Progress
// ============================================================

export interface PlayerProgress {
  /**
   * Highest race/world unlocked.
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
}

// ============================================================
// Default Player Progress
// ============================================================

export const DEFAULT_PLAYER_PROGRESS:
  PlayerProgress = {
  unlockedLevel: 1,

  racesCompleted: 0,

  racesWon: 0,

  totalDistance: 0
};

// ============================================================
// Complete Player Save Data
// ============================================================

export interface PlayerSaveData {

  /**
   * Save-data schema version.
   *
   * Used for future migrations.
   */
  version: number;

  /**
   * Economy state.
   *
   * Contains coin balance and transaction history.
   */
  economy: EconomyState;

  /**
   * Garage state.
   *
   * Contains owned cars and selected car.
   */
  garage: GarageState;

  /**
   * Upgrade state.
   *
   * Contains upgrade levels for each car.
   */
  upgrades: UpgradeState;

  /**
   * General player progress.
   */
  progress: PlayerProgress;

  /**
   * Timestamp when the save was created/updated.
   */
  updatedAt: number;
}

// ============================================================
// Create Default Save Data
// ============================================================

export function createDefaultPlayerSaveData(
  economy: EconomyState,
  garage: GarageState,
  upgrades: UpgradeState
): PlayerSaveData {

  return {
    version:
      PLAYER_SAVE_VERSION,

    economy: {
      wallet: {
        ...economy.wallet
      },

      transactions:
        economy.transactions.map(
          (transaction) => ({
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
            ([
              carId,
              levels
            ]) => [
              carId,
              {
                ...levels
              }
            ]
          )
        ) as UpgradeState["upgrades"]
    },

    progress: {
      ...DEFAULT_PLAYER_PROGRESS
    },

    updatedAt:
      Date.now()
  };
}

// ============================================================
// Clone Save Data
// ============================================================

export function clonePlayerSaveData(
  data: PlayerSaveData
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
          (transaction) => ({
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
            ([
              carId,
              levels
            ]) => [
              carId,
              {
                ...levels
              }
            ]
          )
        ) as UpgradeState["upgrades"]
    },

    progress: {
      ...data.progress
    },

    updatedAt:
      data.updatedAt
  };
}

// ============================================================
// Validation
// ============================================================

export function isValidPlayerSaveData(
  data: unknown
): data is PlayerSaveData {

  if (
    !data ||
    typeof data !== "object"
  ) {
    return false;
  }

  const save =
    data as Partial<PlayerSaveData>;

  // ----------------------------------------------------------
  // Version
  // ----------------------------------------------------------

  if (
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

  if (
    !Number.isFinite(
      save.progress.unlockedLevel
    ) ||
    save.progress.unlockedLevel < 1
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      save.progress.racesCompleted
    ) ||
    save.progress.racesCompleted < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      save.progress.racesWon
    ) ||
    save.progress.racesWon < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(
      save.progress.totalDistance
    ) ||
    save.progress.totalDistance < 0
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Timestamp
  // ----------------------------------------------------------

  if (
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
  progress: PlayerProgress
): PlayerProgress {

  if (
    !progress ||
    typeof progress !==
      "object"
  ) {
    return {
      ...DEFAULT_PLAYER_PROGRESS
    };
  }

  return {
    unlockedLevel:
      Math.max(
        1,
        Math.floor(
          Number.isFinite(
            progress.unlockedLevel
          )
            ? progress.unlockedLevel
            : 1
        )
      ),

    racesCompleted:
      Math.max(
        0,
        Math.floor(
          Number.isFinite(
            progress.racesCompleted
          )
            ? progress.racesCompleted
            : 0
        )
      ),

    racesWon:
      Math.max(
        0,
        Math.floor(
          Number.isFinite(
            progress.racesWon
          )
            ? progress.racesWon
            : 0
        )
      ),

    totalDistance:
      Math.max(
        0,
        Number.isFinite(
          progress.totalDistance
        )
          ? progress.totalDistance
          : 0
      )
  };
}

// ============================================================
// Update Timestamp
// ============================================================

export function touchPlayerSaveData(
  data: PlayerSaveData
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
  version: number
): boolean {

  return (
    Number.isFinite(
      version
    ) &&
    Math.floor(version) ===
      PLAYER_SAVE_VERSION
  );
}
