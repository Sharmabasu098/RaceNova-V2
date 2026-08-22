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
 * - Does NOT control gameplay directly
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

  /**
   * Minimum number of rivals.
   */
  baseRivalCount?: number;

  /**
   * Maximum number of rivals.
   */
  maxRivalCount?: number;

  /**
   * Additional rival count per race level.
   */
  rivalsPerLevel?: number;

  /**
   * Minimum rival speed multiplier.
   */
  minSpeedMultiplier?: number;

  /**
   * Maximum rival speed multiplier.
   */
  maxSpeedMultiplier?: number;
}

// ============================================================
// Rival Race Profile
// ============================================================

export interface RivalRaceProfile {

  /**
   * Race level.
   */
  level: number;

  /**
   * Number of rivals for the race.
   */
  rivalCount: number;

  /**
   * Difficulty value from M6.5.
   */
  difficulty: number;

  /**
   * Difficulty tier.
   */
  tier:
    | "easy"
    | "normal"
    | "hard"
    | "expert";

  /**
   * Rival speed multiplier.
   */
  speedMultiplier: number;

  /**
   * Rival reaction multiplier.
   *
   * Lower value means faster reaction.
   */
  reactionMultiplier: number;

  /**
   * Rival aggression.
   *
   * 0 → passive
   * 1 → highly aggressive
   */
  aggression: number;

  /**
   * Overtaking pressure.
   *
   * Higher value means rivals
   * attempt overtakes more often.
   */
  overtakingPressure: number;

  /**
   * Lane-change pressure.
   */
  laneChangePressure: number;
}

// ============================================================
// Rival Race Progression
// ============================================================

export class RivalRaceProgression {

  // ==========================================================
  // Difficulty
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
    difficultySystem:
      DifficultySystem,

    config:
      RivalRaceProgressionConfig = {}
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
  // Get Rival Count
  // ==========================================================

  public getRivalCount(
    level: number
  ): number {

    if (
      !Number.isFinite(
        level
      )
    ) {
      return this.baseRivalCount;
    }

    const safeLevel =
      Math.max(
        1,
        Math.floor(
          level
        )
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
  // Get Profile
  // ==========================================================

  public getProfile(
    level: number
  ): RivalRaceProfile {

    const difficultyProfile =
      this.difficultySystem.getProfile(
        level
      );

    const difficulty =
      difficultyProfile.difficulty;

    // --------------------------------------------------------
    // Rival Count
    // --------------------------------------------------------

    const rivalCount =
      this.getRivalCount(
        level
      );

    // --------------------------------------------------------
    // Speed
    //
    // Uses M6.5 difficulty but remains
    // bounded for gameplay stability.
    // --------------------------------------------------------

    const rawSpeedMultiplier =
      difficultyProfile
        .rivalSpeedMultiplier;

    const speedMultiplier =
      this.clamp(
        rawSpeedMultiplier,
        this.minSpeedMultiplier,
        this.maxSpeedMultiplier
      );

    // --------------------------------------------------------
    // Reaction
    //
    // M6.5 already decreases reaction
    // time as difficulty increases.
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
          difficulty *
            0.70,
        0,
        1
      );

    // --------------------------------------------------------
    // Overtaking Pressure
    // --------------------------------------------------------

    const overtakingPressure =
      this.clamp(
        0.20 +
          difficulty *
            0.65,
        0,
        1
      );

    // --------------------------------------------------------
    // Lane Change Pressure
    // --------------------------------------------------------

    const laneChangePressure =
      this.clamp(
        0.20 +
          difficulty *
            0.55,
        0,
        1
      );

    return {

  level,

  rivalCount,

  difficulty,

  tier:
    difficultyProfile.tier === "boss"
      ? "expert"
      : difficultyProfile.tier,

  speedMultiplier,

  reactionMultiplier,

  aggression,

  overtakingPressure,

  laneChangePressure
};

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
  // Is Competitive
  // ==========================================================

  public isCompetitive(
    level: number
  ): boolean {

    return (
      this.getProfile(
        level
      ).aggression >=
      0.50
    );
  }

  // ==========================================================
  // Is High Pressure
  // ==========================================================

  public isHighPressure(
    level: number
  ): boolean {

    const profile =
      this.getProfile(
        level
      );

    return (
      profile.overtakingPressure >=
        0.60 ||
      profile.laneChangePressure >=
        0.60
    );
  }

  // ==========================================================
  // Get Configuration
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
     * No mutable runtime state.
     *
     * Configuration remains immutable
     * for the lifetime of the system.
     */
  }
}
