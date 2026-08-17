/**
 * ============================================================
 * RaceNova V2
 * Car Data
 * M4.4
 * ============================================================
 *
 * Defines all playable cars and their base statistics.
 *
 * IMPORTANT:
 * - No UI logic
 * - No Three.js dependency
 * - No save/load logic
 * - No garage state logic
 * - No upgrade logic
 *
 * GarageManager uses this file as the authoritative
 * source of car definitions.
 * ============================================================
 */

// ============================================================
// Car ID
// ============================================================

export type CarId =
  | "starter"
  | "speedster"
  | "racer"
  | "supercar";

// ============================================================
// Car Stats
// ============================================================

export interface CarStats {
  /**
   * Maximum normal speed in km/h.
   */
  maxSpeed: number;

  /**
   * Acceleration value used by PlayerCar.
   */
  acceleration: number;

  /**
   * Handling rating.
   *
   * Higher value = better handling.
   *
   * This is a data value for the future
   * handling/upgrade system.
   */
  handling: number;
}

// ============================================================
// Car Definition
// ============================================================

export interface CarDefinition {
  /**
   * Unique car identifier.
   */
  id: CarId;

  /**
   * Display name.
   */
  name: string;

  /**
   * Base car statistics.
   */
  stats: CarStats;

  /**
   * Coin cost required to unlock the car.
   *
   * Starter car always costs 0.
   */
  unlockCost: number;

  /**
   * Whether this car is available
   * as the default starter vehicle.
   */
  starter: boolean;

  /**
   * Future 3D model identifier.
   *
   * M4 does not load any 3D assets.
   */
  modelId: string;
}

// ============================================================
// Car Data
// ============================================================

export const CAR_DATA:
  readonly CarDefinition[] = [

  // ==========================================================
  // Starter Car
  // ==========================================================

  {
    id: "starter",

    name: "Nova GT",

    stats: {
      maxSpeed: 128,
      acceleration: 35,
      handling: 7
    },

    unlockCost: 0,

    starter: true,

    modelId: "starter-car"
  },

  // ==========================================================
  // Speedster
  // ==========================================================

  {
    id: "speedster",

    name: "Nova Speedster",

    stats: {
      maxSpeed: 138,
      acceleration: 38,
      handling: 7.5
    },

    unlockCost: 2500,

    starter: false,

    modelId: "speedster"
  },

  // ==========================================================
  // Racer
  // ==========================================================

  {
    id: "racer",

    name: "Nova Racer",

    stats: {
      maxSpeed: 150,
      acceleration: 42,
      handling: 8
    },

    unlockCost: 7500,

    starter: false,

    modelId: "racer"
  },

  // ==========================================================
  // Supercar
  // ==========================================================

  {
    id: "supercar",

    name: "Nova Super",

    stats: {
      maxSpeed: 165,
      acceleration: 48,
      handling: 8.5
    },

    unlockCost: 15000,

    starter: false,

    modelId: "supercar"
  }
];

// ============================================================
// Get Car Definition
// ============================================================

export function getCarDefinition(
  carId: CarId
): CarDefinition | undefined {
  return CAR_DATA.find(
    (car) =>
      car.id === carId
  );
}

// ============================================================
// Get Starter Car
// ============================================================

export function getStarterCar():
  CarDefinition {
  const starter =
    CAR_DATA.find(
      (car) =>
        car.starter
    );

  /*
   * CAR_DATA always contains a starter
   * car in the M4 configuration.
   *
   * The fallback keeps the function
   * safe if the data is accidentally changed.
   */
  return (
    starter ??
    CAR_DATA[0]
  );
}
