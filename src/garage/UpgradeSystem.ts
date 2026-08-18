/**
 * ============================================================
 * RaceNova V2
 * Upgrade System
 * M4.6
 * ============================================================
 *
 * Responsibilities:
 * - Manage car upgrade levels
 * - Calculate upgraded car stats
 * - Purchase upgrades using EconomyManager
 * - Validate upgrade limits and costs
 *
 * IMPORTANT:
 * - No UI logic
 * - No Three.js dependency
 * - No localStorage logic
 * - No save/load logic
 * - No garage ownership logic
 *
 * PlayerSaveData will handle persistence later.
 * ============================================================
 */

import { EconomyManager } from "../economy/EconomyManager";

import {
  type CarId,
  type CarStats,
  getCarDefinition
} from "./CarData";

// ============================================================
// Upgrade Type
// ============================================================

export type UpgradeType =
  | "speed"
  | "acceleration"
  | "handling";

// ============================================================
// Upgrade Levels
// ============================================================

export interface CarUpgradeLevels {
  speed: number;

  acceleration: number;

  handling: number;
}

// ============================================================
// Upgrade State
// ============================================================

export interface UpgradeState {
  upgrades: Record<
    CarId,
    CarUpgradeLevels
  >;
}

// ============================================================
// Upgrade Result
// ============================================================

export interface UpgradeResult {
  success: boolean;

  carId: CarId;

  upgradeType: UpgradeType;

  newLevel: number;

  cost: number;

  stats: CarStats;
}

// ============================================================
// Configuration
// ============================================================

export interface UpgradeSystemConfig {
  maxLevel?: number;

  baseCost?: number;

  costMultiplier?: number;

  speedPerLevel?: number;

  accelerationPerLevel?: number;

  handlingPerLevel?: number;
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_MAX_LEVEL = 5;

const DEFAULT_BASE_COST = 1000;

const DEFAULT_COST_MULTIPLIER = 1.5;

const DEFAULT_SPEED_PER_LEVEL = 5;

const DEFAULT_ACCELERATION_PER_LEVEL = 5;

const DEFAULT_HANDLING_PER_LEVEL = 0.5;

// ============================================================
// Upgrade System
// ============================================================

export class UpgradeSystem {

  private readonly economy:
    EconomyManager;

  private readonly maxLevel: number;

  private readonly baseCost: number;

  private readonly costMultiplier: number;

  private readonly speedPerLevel: number;

  private readonly accelerationPerLevel: number;

  private readonly handlingPerLevel: number;

  private readonly upgrades =
    new Map<
      CarId,
      CarUpgradeLevels
    >();

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    economy: EconomyManager,
    config: UpgradeSystemConfig = {}
  ) {

    this.economy =
      economy;

    this.maxLevel =
      Math.max(
        1,
        Math.floor(
          config.maxLevel ??
            DEFAULT_MAX_LEVEL
        )
      );

    this.baseCost =
      Math.max(
        1,
        Math.floor(
          config.baseCost ??
            DEFAULT_BASE_COST
        )
      );

    this.costMultiplier =
      Math.max(
        1,
        config.costMultiplier ??
          DEFAULT_COST_MULTIPLIER
      );

    this.speedPerLevel =
      Math.max(
        0,
        config.speedPerLevel ??
          DEFAULT_SPEED_PER_LEVEL
      );

    this.accelerationPerLevel =
      Math.max(
        0,
        config.accelerationPerLevel ??
          DEFAULT_ACCELERATION_PER_LEVEL
      );

    this.handlingPerLevel =
      Math.max(
        0,
        config.handlingPerLevel ??
          DEFAULT_HANDLING_PER_LEVEL
      );
  }

  // ==========================================================
  // Get Upgrade Levels
  // ==========================================================

  public getUpgradeLevels(
    carId: CarId
  ): CarUpgradeLevels {

    const existing =
      this.upgrades.get(
        carId
      );

    if (existing) {
      return {
        ...existing
      };
    }

    return {
      speed: 0,
      acceleration: 0,
      handling: 0
    };
  }

  // ==========================================================
  // Get Upgrade Level
  // ==========================================================

  public getUpgradeLevel(
    carId: CarId,
    type: UpgradeType
  ): number {

    const levels =
      this.getUpgradeLevels(
        carId
      );

    return levels[type];
  }

  // ==========================================================
  // Get Maximum Level
  // ==========================================================

  public getMaxLevel(): number {
    return this.maxLevel;
  }

  // ==========================================================
  // Check Upgrade Availability
  // ==========================================================

  public canUpgrade(
    carId: CarId,
    type: UpgradeType
  ): boolean {

    const car =
      getCarDefinition(
        carId
      );

    if (!car) {
      return false;
    }

    const level =
      this.getUpgradeLevel(
        carId,
        type
      );

    if (
      level >=
      this.maxLevel
    ) {
      return false;
    }

    const cost =
      this.getUpgradeCost(
        carId,
        type
      );

    return this.economy.canSpend(
      cost
    );
  }

  // ==========================================================
  // Upgrade Cost
  // ==========================================================

  public getUpgradeCost(
    carId: CarId,
    type: UpgradeType
  ): number {

    const car =
      getCarDefinition(
        carId
      );

    if (!car) {
      return 0;
    }

    const level =
      this.getUpgradeLevel(
        carId,
        type
      );

    if (
      level >=
      this.maxLevel
    ) {
      return 0;
    }

    const cost =
      this.baseCost *
      Math.pow(
        this.costMultiplier,
        level
      );

    return Math.floor(
      cost
    );
  }

  // ==========================================================
  // Purchase Upgrade
  // ==========================================================

  public upgrade(
    carId: CarId,
    type: UpgradeType
  ): UpgradeResult {

    const car =
      getCarDefinition(
        carId
      );

    const currentLevels =
      this.getUpgradeLevels(
        carId
      );

    if (!car) {

      return {
        success: false,
        carId,
        upgradeType: type,
        newLevel:
          currentLevels[type],
        cost: 0,
        stats: {
          maxSpeed: 0,
          acceleration: 0,
          handling: 0
        }
      };
    }

    const currentLevel =
      currentLevels[type];

    if (
      currentLevel >=
      this.maxLevel
    ) {

      return {
        success: false,
        carId,
        upgradeType: type,
        newLevel:
          currentLevel,
        cost: 0,
        stats:
          this.getStats(
            carId
          )
      };
    }

    const cost =
      this.getUpgradeCost(
        carId,
        type
      );

    if (
      cost <= 0
    ) {

      return {
        success: false,
        carId,
        upgradeType: type,
        newLevel:
          currentLevel,
        cost: 0,
        stats:
          this.getStats(
            carId
          )
      };
    }

    const paid =
      this.economy.payForUpgrade(
        cost,
        `${car.name} ${type} upgrade`
      );

    if (!paid) {

      return {
        success: false,
        carId,
        upgradeType: type,
        newLevel:
          currentLevel,
        cost,
        stats:
          this.getStats(
            carId
          )
      };
    }

    const newLevel =
      currentLevel + 1;

    const newLevels:
      CarUpgradeLevels = {
      ...currentLevels,
      [type]:
        newLevel
    };

    this.upgrades.set(
      carId,
      newLevels
    );

    return {
      success: true,
      carId,
      upgradeType: type,
      newLevel,
      cost,
      stats:
        this.getStats(
          carId
        )
    };
  }

  // ==========================================================
  // Get Upgraded Stats
  // ==========================================================

  public getStats(
    carId: CarId
  ): CarStats {

    const car =
      getCarDefinition(
        carId
      );

    if (!car) {

      return {
        maxSpeed: 0,
        acceleration: 0,
        handling: 0
      };
    }

    const levels =
      this.getUpgradeLevels(
        carId
      );

    return {

      maxSpeed:
        car.stats.maxSpeed +
        levels.speed *
          this.speedPerLevel,

      acceleration:
        car.stats.acceleration +
        levels.acceleration *
          this.accelerationPerLevel,

      handling:
        car.stats.handling +
        levels.handling *
          this.handlingPerLevel
    };
  }

  // ==========================================================
  // Reset Car Upgrades
  // ==========================================================

  public resetCar(
    carId: CarId
  ): void {

    this.upgrades.delete(
      carId
    );
  }

  // ==========================================================
  // Reset All Upgrades
  // ==========================================================

  public reset(): void {

    this.upgrades.clear();
  }

  // ==========================================================
  // Get State
  // ==========================================================

  public getState():
    UpgradeState {

    const result:
      Record<
        CarId,
        CarUpgradeLevels
      > = {} as Record<
        CarId,
        CarUpgradeLevels
      >;

    for (
      const [
        carId,
        levels
      ]
      of this.upgrades
    ) {

      result[carId] = {
        ...levels
      };
    }

    return {
      upgrades:
        result
    };
  }

  // ==========================================================
  // Load State
  // ==========================================================

  public loadState(
    state: UpgradeState
  ): boolean {

    if (
      !state ||
      !state.upgrades
    ) {
      return false;
    }

    this.upgrades.clear();

    for (
      const carId
      of Object.keys(
        state.upgrades
      ) as CarId[]
    ) {

      if (
        !getCarDefinition(
          carId
        )
      ) {
        continue;
      }

      const levels =
        state.upgrades[
          carId
        ];

      if (!levels) {
        continue;
      }

      this.upgrades.set(
        carId,
        {
          speed:
            this.sanitizeLevel(
              levels.speed
            ),

          acceleration:
            this.sanitizeLevel(
              levels.acceleration
            ),

          handling:
            this.sanitizeLevel(
              levels.handling
            )
        }
      );
    }

    return true;
  }

  // ==========================================================
  // Level Sanitization
  // ==========================================================

  private sanitizeLevel(
    level: number
  ): number {

    if (
      !Number.isFinite(
        level
      )
    ) {
      return 0;
    }

    return Math.min(
      this.maxLevel,
      Math.max(
        0,
        Math.floor(
          level
        )
      )
    );
  }
}
