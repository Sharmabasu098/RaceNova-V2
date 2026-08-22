/**
 * ============================================================
 * RaceNova V2
 * Rival Race Progression
 * M6.6
 * ============================================================
 *
 * Responsibilities:
 * - Provide rival configuration for each race
 * - Scale rival strength by race level
 * - Consume M6.5 DifficultySystem
 * - Provide rival count
 * - Provide rival speed scaling
 * - Provide rival reaction scaling
 * - Provide overtaking pressure
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - Does NOT rewrite RivalAI
 * - Does NOT spawn rivals
 * - Does NOT directly control gameplay
 *
 * M6.5:
 * DifficultySystem
 *
 * M6.6:
 * Rival Race Progression
 *
 * M6.7:
 * Boss Race System
 * ============================================================
 */

import {
  DifficultySystem
} from "./DifficultySystem";

// ============================================================
// Rival Race Configuration
// ============================================================

export interface RivalRaceProgressionConfig {

  baseRivalCount?: number;

  maxRivalCount?: number;

  rivalsPerLevel?: number;

  minSpeedMultiplier?: number;

  maxSpeedMultiplier?: number;
}

// ============================================================
// Rival Race Profile
// ============================================================

export interface RivalRaceProfile {

  level: number;

  rivalCount: number;

  difficulty: number;

  tier:
    | "easy"
    | "normal"
    | "hard"
    | "expert";

  speedMultiplier: number;

  reactionMultiplier: number;

  aggression: number;

  overtakingPressure: number;

  laneChangePressure: number;
}

// ============================================================
// Rival Race Progression
// ============================================================

export class RivalRaceProgression {

  // ==========================================================
  // Difficulty System
  // ==========================================================

  private readonly difficultySystem:
    DifficultySystem;

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly baseRivalCount:
    number;

  private readonly maxRivalCount:
    number;

  private readonly rivalsPerLevel:
    number;

  private readonly minSpeedMultiplier:
    number;

  private readonly maxSpeedMultiplier:
    number;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    difficultySystem: DifficultySystem,
    config: RivalRaceProgressionConfig = {}
  ) {

    this.difficultySystem =
      difficultySystem;

    this.baseRivalCount =
      Math.max(
        1,
        Math.floor(
          Number.isFinite(
            config.baseRivalCount
          )
            ? config.baseRivalCount!
            : 2
        )
      );

    this.maxRivalCount =
      Math.max(
        this.baseRivalCount,
        Math.floor(
          Number.isFinite(
            config.maxRivalCount
          )
            ? config.maxRivalCount!
            : 6
        )
      );

    this.rivalsPerLevel =
      Math.max(
        0,
        Math.floor(
          Number.isFinite(
            config.rivalsPerLevel
          )
            ? config.rivalsPerLevel!
            : 1
        )
      );

    this.minSpeedMultiplier =
      Math.max(
        0.1,
        Number.isFinite(
          config.minSpeedMultiplier
        )
          ? config.minSpeedMultiplier!
          : 0.90
      );

    this.maxSpeedMultiplier =
      Math.max(
        this.minSpeedMultiplier,
        Number.isFinite(
          config.maxSpeedMultiplier
        )
          ? config.maxSpeedMultiplier!
          : 1.25
      );
  }

  // ==========================================================
  // Rival Count
  // ==========================================================

  public getRivalCount(
    level: number
  ): number {

    if (
      !Number.isFinite(level)
    ) {
      return this.baseRivalCount;
    }

    const safeLevel =
      Math.max(
        1,
        Math.floor(level)
      );

    const additionalRivals =
      Math.max(
        0,
        safeLevel - 1
      ) *
      this.rivalsPerLevel;

    return Math.min(
      this.maxRivalCount,
      this.baseRivalCount +
        additionalRivals
    );
  }

  // ==========================================================
  // Profile
  // ==========================================================

  public getProfile(
    level: number
  ): RivalRaceProfile {

    const safeLevel =
      Number.isFinite(level)
        ? Math.max(
            1,
            Math.floor(level)
          )
        : 1;

    const difficultyProfile =
      this.difficultySystem.getProfile(
        safeLevel
      );

    const difficulty =
      this.clamp(
        difficultyProfile.difficulty,
        0,
        1
      );

    // --------------------------------------------------------
    // Tier
    // --------------------------------------------------------
    //
    // Boss tier is intentionally converted to
    // expert for the normal rival profile.
    //
    // Boss difficulty belongs to M6.7/M6.8.
    // --------------------------------------------------------

    const tier =
      difficultyProfile.tier === "boss"
        ? "expert"
        : difficultyProfile.tier;

    // --------------------------------------------------------
    // Rival Count
    // --------------------------------------------------------

    const rivalCount =
      this.getRivalCount(
        safeLevel
      );

    // --------------------------------------------------------
    // Speed
    // --------------------------------------------------------

    const speedMultiplier =
      this.clamp(
        difficultyProfile
          .rivalSpeedMultiplier,
        this.minSpeedMultiplier,
        this.maxSpeedMultiplier
      );

    // --------------------------------------------------------
    // Reaction
    // --------------------------------------------------------

    const reactionMultiplier =
      this.clamp(
        difficultyProfile
          .rivalReactionMultiplier,
        0.55,
        0.90
      );

    // --------------------------------------------------------
    // Aggression
    // --------------------------------------------------------

    const aggression =
      this.clamp(
        0.15 +
          difficulty * 0.70,
        0,
        1
      );

    // --------------------------------------------------------
    // Overtaking Pressure
    // --------------------------------------------------------

    const overtakingPressure =
      this.clamp(
        0.20 +
          difficulty * 0.65,
        0,
        1
      );

    // --------------------------------------------------------
    // Lane Change Pressure
    // --------------------------------------------------------

    const laneChangePressure =
      this.clamp(
        0.20 +
          difficulty * 0.55,
        0,
        1
      );

    // ========================================================
    // Final Profile
    // ========================================================

    return {

      level:
        safeLevel,

      rivalCount,

      difficulty,

      tier,

      speedMultiplier,

      reactionMultiplier,

      aggression,

      overtakingPressure,

      laneChangePressure
    };
  }

  // ==========================================================
  // Speed Multiplier
  // ==========================================================

  public getSpeedMultiplier(
    level: number
  ): number {

    return this.getProfile(
      level
    ).speedMultiplier;
  }

  // ==========================================================
  // Reaction Multiplier
  // ==========================================================

  public getReactionMultiplier(
    level: number
  ): number {

    return this.getProfile(
      level
    ).reactionMultiplier;
  }

  // ==========================================================
  // Aggression
  // ==========================================================

  public getAggression(
    level: number
  ): number {

    return this.getProfile(
      level
    ).aggression;
  }

  // ==========================================================
  // Overtaking Pressure
  // ==========================================================

  public getOvertakingPressure(
    level: number
  ): number {

    return this.getProfile(
      level
    ).overtakingPressure;
  }

  // ==========================================================
  // Lane Change Pressure
  // ==========================================================

  public getLaneChangePressure(
    level: number
  ): number {

    return this.getProfile(
      level
    ).laneChangePressure;
  }

  // ==========================================================
  // Competitive Check
  // ==========================================================

  public isCompetitive(
    level: number
  ): boolean {

    return (
      this.getProfile(level)
        .aggression >= 0.50
    );
  }

  // ==========================================================
  // High Pressure Check
  // ==========================================================

  public isHighPressure(
    level: number
  ): boolean {

    const profile =
      this.getProfile(level);

    return (
      profile.overtakingPressure >=
        0.60 ||
      profile.laneChangePressure >=
        0.60
    );
  }

  // ==========================================================
  // Configuration
  // ==========================================================

  public getConfig():
    RivalRaceProgressionConfig {

    return {

      baseRivalCount:
        this.baseRivalCount,

      maxRivalCount:
        this.maxRivalCount,

      rivalsPerLevel:
        this.rivalsPerLevel,

      minSpeedMultiplier:
        this.minSpeedMultiplier,

      maxSpeedMultiplier:
        this.maxSpeedMultiplier
    };
  }

  // ==========================================================
  // Clamp
  // ==========================================================

  private clamp(
    value: number,
    min: number,
    max: number
  ): number {

    return Math.min(
      max,
      Math.max(
        min,
        value
      )
    );
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {
    /*
     * M6.6 currently has no mutable
     * runtime progression state.
     */
  }
}
