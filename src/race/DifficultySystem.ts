/**
 * ============================================================
 * RaceNova V2
 * Difficulty System
 * M6.5
 * ============================================================
 *
 * Responsibilities:
 * - Calculate race difficulty
 * - Scale difficulty by race level
 * - Provide normalized difficulty value
 * - Provide traffic difficulty
 * - Provide rival difficulty
 * - Provide race speed scaling
 * - Provide spawn pressure
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No direct RivalAI dependency
 * - No Boss system dependency
 *
 * M6.5 is a data/calculation layer only.
 *
 * M6.6 will consume rival difficulty.
 * M6.7/M6.8 will consume boss difficulty.
 * ============================================================
 */

// ============================================================
// Difficulty Tier
// ============================================================

export type DifficultyTier =
  | "easy"
  | "normal"
  | "hard"
  | "expert"
  | "boss";

// ============================================================
// Difficulty Configuration
// ============================================================

export interface DifficultyConfig {

  /**
   * First race level.
   */
  baseLevel?: number;

  /**
   * Difficulty added per level.
   */
  difficultyPerLevel?: number;

  /**
   * Minimum difficulty.
   */
  minDifficulty?: number;

  /**
   * Maximum normal difficulty.
   */
  maxDifficulty?: number;
}

// ============================================================
// Difficulty Profile
// ============================================================

export interface DifficultyProfile {

  /**
   * Race level.
   */
  level: number;

  /**
   * Normalized difficulty.
   *
   * 0.0 → easiest
   * 1.0 → hardest normal race
   */
  difficulty: number;

  /**
   * Human-readable tier.
   */
  tier: DifficultyTier;

  /**
   * Traffic speed multiplier.
   */
  trafficSpeedMultiplier: number;

  /**
   * Traffic density multiplier.
   */
  trafficDensityMultiplier: number;

  /**
   * Rival speed multiplier.
   */
  rivalSpeedMultiplier: number;

  /**
   * Rival reaction multiplier.
   *
   * Higher difficulty means
   * rivals react faster.
   */
  rivalReactionMultiplier: number;

  /**
   * Spawn pressure.
   *
   * Higher value means
   * more frequent/denser gameplay.
   */
  spawnPressure: number;
}

// ============================================================
// Difficulty System
// ============================================================

export class DifficultySystem {

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly baseLevel: number;

  private readonly difficultyPerLevel: number;

  private readonly minDifficulty: number;

  private readonly maxDifficulty: number;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    config: DifficultyConfig = {}
  ) {

    this.baseLevel =
      Math.max(
        1,
        Math.floor(
          Number.isFinite(
            config.baseLevel
          )
            ? config.baseLevel!
            : 1
        )
      );

    this.difficultyPerLevel =
      Math.max(
        0,
        Number.isFinite(
          config.difficultyPerLevel
        )
          ? config.difficultyPerLevel!
          : 0.08
      );

    this.minDifficulty =
      Math.max(
        0,
        Math.min(
          1,
          Number.isFinite(
            config.minDifficulty
          )
            ? config.minDifficulty!
            : 0
        )
      );

    this.maxDifficulty =
      Math.max(
        this.minDifficulty,
        Math.min(
          1,
          Number.isFinite(
            config.maxDifficulty
          )
            ? config.maxDifficulty!
            : 1
        )
      );
  }

  // ==========================================================
  // Calculate Difficulty
  // ==========================================================

  public getDifficulty(
    level: number
  ): number {

    if (
      !Number.isFinite(
        level
      )
    ) {
      return this.minDifficulty;
    }

    const safeLevel =
      Math.max(
        this.baseLevel,
        Math.floor(
          level
        )
      );

    const levelOffset =
      safeLevel -
      this.baseLevel;

    const difficulty =
      this.minDifficulty +
      levelOffset *
        this.difficultyPerLevel;

    return this.clamp(
      difficulty,
      this.minDifficulty,
      this.maxDifficulty
    );
  }

  // ==========================================================
  // Difficulty Tier
  // ==========================================================

  public getTier(
    difficulty: number
  ): DifficultyTier {

    const value =
      this.clamp(
        difficulty,
        0,
        1
      );

    if (
      value >= 0.85
    ) {
      return "expert";
    }

    if (
      value >= 0.60
    ) {
      return "hard";
    }

    if (
      value >= 0.30
    ) {
      return "normal";
    }

    return "easy";
  }

  // ==========================================================
  // Get Profile
  // ==========================================================

  public getProfile(
    level: number
  ): DifficultyProfile {

    const difficulty =
      this.getDifficulty(
        level
      );

    const tier =
      this.getTier(
        difficulty
      );

    // --------------------------------------------------------
    // Traffic speed
    // --------------------------------------------------------

    const trafficSpeedMultiplier =
      0.90 +
      difficulty *
        0.30;

    // --------------------------------------------------------
    // Traffic density
    // --------------------------------------------------------

    const trafficDensityMultiplier =
      0.85 +
      difficulty *
        0.50;

    // --------------------------------------------------------
    // Rival speed
    // --------------------------------------------------------

    const rivalSpeedMultiplier =
      0.90 +
      difficulty *
        0.25;

    // --------------------------------------------------------
    // Rival reaction
    //
    // Higher difficulty:
    // faster reactions.
    // --------------------------------------------------------

    const rivalReactionMultiplier =
      0.85 -
      difficulty *
        0.25;

    // --------------------------------------------------------
    // Spawn pressure
    // --------------------------------------------------------

    const spawnPressure =
      0.80 +
      difficulty *
        0.60;

    return {

      level,

      difficulty,

      tier,

      trafficSpeedMultiplier,

      trafficDensityMultiplier,

      rivalSpeedMultiplier,

      rivalReactionMultiplier,

      spawnPressure
    };
  }

  // ==========================================================
  // Traffic Speed
  // ==========================================================

  public getTrafficSpeedMultiplier(
    level: number
  ): number {

    return this.getProfile(
      level
    ).trafficSpeedMultiplier;
  }

  // ==========================================================
  // Traffic Density
  // ==========================================================

  public getTrafficDensityMultiplier(
    level: number
  ): number {

    return this.getProfile(
      level
    ).trafficDensityMultiplier;
  }

  // ==========================================================
  // Rival Speed
  // ==========================================================

  public getRivalSpeedMultiplier(
    level: number
  ): number {

    return this.getProfile(
      level
    ).rivalSpeedMultiplier;
  }

  // ==========================================================
  // Rival Reaction
  // ==========================================================

  public getRivalReactionMultiplier(
    level: number
  ): number {

    return this.getProfile(
      level
    ).rivalReactionMultiplier;
  }

  // ==========================================================
  // Spawn Pressure
  // ==========================================================

  public getSpawnPressure(
    level: number
  ): number {

    return this.getProfile(
      level
    ).spawnPressure;
  }

  // ==========================================================
  // Boss Difficulty
  // ==========================================================
  //
  // M6.8 will use this as a foundation.
  //
  // Bosses are intentionally harder
  // than the normal race at the same level.
  // ==========================================================

  public getBossDifficulty(
    level: number
  ): number {

    const normalDifficulty =
      this.getDifficulty(
        level
      );

    return this.clamp(
      normalDifficulty +
        0.20,
      0,
      1
    );
  }

  // ==========================================================
  // Boss Profile
  // ==========================================================

  public getBossProfile(
    level: number
  ): DifficultyProfile {

    const difficulty =
      this.getBossDifficulty(
        level
      );

    return {

      level,

      difficulty,

      tier:
        "boss",

      trafficSpeedMultiplier:
        0.95 +
        difficulty *
          0.35,

      trafficDensityMultiplier:
        0.90 +
        difficulty *
          0.60,

      rivalSpeedMultiplier:
        1.00 +
        difficulty *
          0.30,

      rivalReactionMultiplier:
        0.75 -
        difficulty *
          0.15,

      spawnPressure:
        0.90 +
        difficulty *
          0.70
    };
  }

  // ==========================================================
  // Get Config
  // ==========================================================

  public getConfig():
    DifficultyConfig {

    return {

      baseLevel:
        this.baseLevel,

      difficultyPerLevel:
        this.difficultyPerLevel,

      minDifficulty:
        this.minDifficulty,

      maxDifficulty:
        this.maxDifficulty
    };
  }

  // ==========================================================
  // Is Hard
  // ==========================================================

  public isHard(
    level: number
  ): boolean {

    return (
      this.getDifficulty(
        level
      ) >= 0.60
    );
  }

  // ==========================================================
  // Is Expert
  // ==========================================================

  public isExpert(
    level: number
  ): boolean {

    return (
      this.getDifficulty(
        level
      ) >= 0.85
    );
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
     * DifficultySystem is configuration-driven
     * and has no mutable runtime progression.
     *
     * Kept intentionally for future engine
     * lifecycle consistency.
     */
  }
}
