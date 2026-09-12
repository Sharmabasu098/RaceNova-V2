/**
 * ============================================================
 * RaceNova V2
 * Car Data
 * M8.4.2
 * ============================================================
 *
 * Static definitions for all RaceNova cars.
 *
 * IMPORTANT:
 * - No UI logic
 * - No Three.js dependency
 * - No save/load logic
 * - No gameplay movement logic
 * - No upgrade state
 *
 * Model paths are static asset references only.
 * ============================================================
 */

// ============================================================
// Car ID
// ============================================================

export type CarId =
  | "starter"
  | "sport"
  | "muscle"
  | "super"
  | "hyper";

// ============================================================
// Car Stats
// ============================================================

export interface CarStats {
  maxSpeed: number;
  acceleration: number;
  handling: number;
}

// ============================================================
// Car Definition
// ============================================================

export interface CarDefinition {
  id: CarId;

  name: string;

  description: string;

  unlockCost: number;

  modelPath: string;

  stats: CarStats;
}

// ============================================================
// Car Database
// ============================================================

export const CAR_DATA: readonly CarDefinition[] = [

  // ==========================================================
  // Starter Car
  // ==========================================================

  {
    id: "starter",

    name: "Nova GT",

    description:
      "The standard RaceNova starter car.",

    unlockCost: 0,

    modelPath:
      "/assets/cars/playercar.glb",

    stats: {
      maxSpeed: 128,
      acceleration: 35,
      handling: 7
    }
  },

  // ==========================================================
  // Sport Car
  // ==========================================================

  {
    id: "sport",

    name: "Nova Sport",

    description:
      "A faster and more responsive sports car.",

    unlockCost: 2500,

    modelPath:
      "/assets/cars/sportcar.glb",

    stats: {
      maxSpeed: 145,
      acceleration: 40,
      handling: 8
    }
  },

  // ==========================================================
  // Muscle Car
  // ==========================================================

  {
    id: "muscle",

    name: "Nova Muscle",

    description:
      "Powerful acceleration with balanced handling.",

    unlockCost: 5000,

    modelPath:
      "/assets/cars/musclecar.glb",

    stats: {
      maxSpeed: 155,
      acceleration: 48,
      handling: 7
    }
  },

  // ==========================================================
  // Super Car
  // ==========================================================

  {
    id: "super",

    name: "Nova Super",

    description:
      "A high-performance supercar built for speed.",

    unlockCost: 10000,

    modelPath:
      "/assets/cars/supercar.glb",

    stats: {
      maxSpeed: 175,
      acceleration: 55,
      handling: 9
    }
  },

  // ==========================================================
  // Hyper Car
  // ==========================================================

  {
    id: "hyper",

    name: "Nova Hyper",

    description:
      "The ultimate RaceNova performance machine.",

    unlockCost: 20000,

    modelPath:
      "/assets/cars/hypercar.glb",

    stats: {
      maxSpeed: 195,
      acceleration: 65,
      handling: 10
    }
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
// Starter Car
// ============================================================

export function getStarterCar():
  CarDefinition {

  const starter =
    getCarDefinition(
      "starter"
    );

  /*
   * Starter car is part of the
   * static database, so this should
   * always exist.
   */

  if (starter) {
    return starter;
  }

  /*
   * Defensive fallback.
   */

  return CAR_DATA[0];
}
