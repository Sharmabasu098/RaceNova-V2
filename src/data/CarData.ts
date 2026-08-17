/**
 * ============================================================
 * RaceNova V2
 * Car Data
 * M4.4
 * ============================================================
 *
 * Static car definitions for RaceNova.
 *
 * Responsibilities:
 * - Car IDs
 * - Car names
 * - Base stats
 * - Unlock prices
 * - Default car configuration
 *
 * IMPORTANT:
 * - No UI logic
 * - No garage ownership logic
 * - No upgrade logic
 * - No save/load logic
 * - No Three.js dependency
 * ============================================================
 */

// ============================================================
// Car Stats
// ============================================================

export interface CarStats {
  /**
   * Maximum normal speed in km/h.
   */
  maxSpeed: number;

  /**
   * Acceleration strength.
   */
  acceleration: number;

  /**
   * Steering / handling strength.
   *
   * Higher value = more responsive.
   */
  handling: number;

  /**
   * Nitro top speed in km/h.
   */
  nitroSpeed: number;

  /**
   * Nitro duration in seconds.
   */
  nitroDuration: number;
}

// ============================================================
// Car Definition
// ============================================================

export interface CarDefinition {
  /**
   * Unique permanent car identifier.
   */
  id: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Base car statistics.
   */
  baseStats: CarStats;

  /**
   * Coin price required to unlock.
   *
   * Starter car uses 0.
   */
  unlockCost: number;

  /**
   * Whether this car is available
   * as the default starter car.
   */
  starter: boolean;
}

// ============================================================
// RaceNova Car IDs
// ============================================================

export const CAR_IDS = {
  STARTER: "car_starter",
  SPEEDSTER: "car_speedster",
  MUSCLE: "car_muscle",
  HUNTER: "car_hunter",
  PHANTOM: "car_phantom"
} as const;

export type CarId =
  typeof CAR_IDS[keyof typeof CAR_IDS];

// ============================================================
// Car Definitions
// ============================================================

export const CAR_DATA:
  readonly CarDefinition[] = [
  // ----------------------------------------------------------
  // Starter
  // ----------------------------------------------------------

  {
    id: CAR_IDS.STARTER,

    name: "Nova",

    baseStats: {
      maxSpeed: 128,
      acceleration: 35,
      handling: 10,
      nitroSpeed: 165,
      nitroDuration: 3
    },

    unlockCost: 0,

    starter: true
  },

  // ----------------------------------------------------------
  // Speedster
  // ----------------------------------------------------------

  {
    id: CAR_IDS.SPEEDSTER,

    name: "Velocity",

    baseStats: {
      maxSpeed: 145,
      acceleration: 39,
      handling: 10.5,
      nitroSpeed: 180,
      nitroDuration: 3.2
    },

    unlockCost: 2500,

    starter: false
  },

  // ----------------------------------------------------------
  // Muscle
  // ----------------------------------------------------------

  {
    id: CAR_IDS.MUSCLE,

    name: "Titan",

    baseStats: {
      maxSpeed: 138,
      acceleration: 45,
      handling: 8.5,
      nitroSpeed: 175,
      nitroDuration: 3
    },

    unlockCost: 5000,

    starter: false
  },

  // ----------------------------------------------------------
  // Hunter
  // ----------------------------------------------------------

  {
    id: CAR_IDS.HUNTER,

    name: "Hunter",

    baseStats: {
      maxSpeed: 155,
      acceleration: 42,
      handling: 11.5,
      nitroSpeed: 190,
      nitroDuration: 3.4
    },

    unlockCost: 10000,

    starter: false
  },

  // ----------------------------------------------------------
  // Phantom
  // ----------------------------------------------------------

  {
    id: CAR_IDS.PHANTOM,

    name: "Phantom",

    baseStats: {
      maxSpeed: 165,
      acceleration: 48,
      handling: 12,
      nitroSpeed: 200,
      nitroDuration: 4
    },

    unlockCost: 20000,

    starter: false
  }
];

// ============================================================
// Lookup Helpers
// ============================================================

/**
 * Returns a car definition by ID.
 */
export function getCarDefinition(
  carId: CarId
): CarDefinition | undefined {
  return CAR_DATA.find(
    (car) =>
      car.id === carId
  );
}

/**
 * Returns all available car definitions.
 */
export function getAllCars():
  readonly CarDefinition[] {
  return CAR_DATA;
}

/**
 * Returns the default starter car.
 */
export function getStarterCar():
  CarDefinition {
  const starterCar =
    CAR_DATA.find(
      (car) =>
        car.starter
    );

  /*
   * The data table must always contain
   * a starter car.
   */
  if (!starterCar) {
    throw new Error(
      "RaceNova CarData: Starter car is missing."
    );
  }

  return starterCar;
}
