/**
 * ============================================================
 * RaceNova V2
 * Boss Race System
 * M6.7
 * ============================================================
 *
 * Responsibilities:
 * - Identify Boss races from RaceDefinitions
 * - Create Boss race profiles
 * - Scale Boss strength using M6.5 DifficultySystem
 * - Provide Boss speed multiplier
 * - Provide Boss reaction multiplier
 * - Provide Boss aggression
 * - Provide Boss overtaking pressure
 * - Provide Boss lane-change pressure
 * - Provide Boss durability/challenge foundation
 *
 * IMPORTANT:
 * - RaceDefinitions remains authoritative
 * - Boss status comes from race.isBoss
 * - No hard-coded Boss level
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No Boss unlock logic
 * - No Boss spawning
 * - No direct RivalAI modification
 *
 * M6.5:
 * DifficultySystem
 *
 * M6.6:
 * Rival Race Progression
 *
 * M6.7:
 * Boss Race System
 *
 * M6.8:
 * Boss Unlock + Boss Difficulty
 * ============================================================
 */

import {
  DifficultySystem
} from "./DifficultySystem";

import {
  type RaceDefinition
} from "./RaceProgressionData";

// ============================================================
// Boss Race Configuration
// ============================================================

export interface BossRaceSystemConfig {

  /**
   * Minimum Boss speed multiplier.
   */
  minSpeedMultiplier?: number;

  /**
   * Maximum Boss speed multiplier.
   */
  maxSpeedMultiplier?: number;

  /**
   * Minimum Boss aggression.
   */
  minAggression?: number;

  /**
   * Maximum Boss aggression.
   */
  maxAggression?: number;

  /**
   * Minimum Boss durability.
   */
  minDurability?: number;

  /**
   * Maximum Boss durability.
   */
  maxDurability?: number;
}

// ============================================================
// Boss Race Profile
// ============================================================

export interface BossRaceProfile {

  /**
   * Race ID.
   */
  raceId: string;

  /**
   * Race level.
   */
  level: number;

  /**
   * Boss race name.
   */
  name: string;

  /**
   * Boss race description.
   */
  description: string;

  /**
   * Boss race flag.
   */
  isBossRace: boolean;

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
   * Boss speed multiplier.
   */
  speedMultiplier: number;

  /**
   * Boss reaction multiplier.
   *
   * Lower value means faster reaction.
   */
  reactionMultiplier: number;

  /**
   * Boss aggression.
   */
  aggression: number;

  /**
   * Boss overtaking pressure.
   */
  overtakingPressure: number;

  /**
   * Boss lane-change pressure.
   */
  laneChangePressure: number;

  /**
   * Boss durability foundation.
   */
  durability: number;

  /**
   * Overall Boss challenge value.
   */
  challenge: number;
}

// ============================================================
// Boss Race System
// ============================================================

export class BossRaceSystem {

  // ==========================================================
  // Difficulty System
  // ==========================================================

  private readonly difficultySystem:
    DifficultySystem;

  // ==========================================================
  // Race Definitions
  // ==========================================================

  private readonly races:
    readonly RaceDefinition[];

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly minSpeedMultiplier:
    number;

  private readonly maxSpeedMultiplier:
    number;

  private readonly minAggression:
    number;

  private readonly maxAggression:
    number;

  private readonly minDurability:
    number;

  private readonly maxDurability:
    number;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    difficultySystem:
      DifficultySystem,

    races:
      readonly RaceDefinition[],

    config:
      BossRaceSystemConfig = {}
  ) {

    this.difficultySystem =
      difficultySystem;

    this.races =
      races;

    // --------------------------------------------------------
    // Speed Configuration
    // --------------------------------------------------------

    this.minSpeedMultiplier =
      Math.max(
        0.1,
        Number.isFinite(
          config.minSpeedMultiplier
        )
          ? config.minSpeedMultiplier!
          : 1.05
      );

    this.maxSpeedMultiplier =
      Math.max(
        this.minSpeedMultiplier,
        Number.isFinite(
          config.maxSpeedMultiplier
        )
          ? config.maxSpeedMultiplier!
          : 1.40
      );

    // --------------------------------------------------------
    // Aggression Configuration
    // --------------------------------------------------------

    this.minAggression =
      this.clamp(
        Number.isFinite(
          config.minAggression
        )
          ? config.minAggression!
          : 0.65,
        0,
        1
      );

    this.maxAggression =
      this.clamp(
        Number.isFinite(
          config.maxAggression
        )
          ? config.maxAggression!
          : 1.0,
        this.minAggression,
        1
      );

    // --------------------------------------------------------
    // Durability Configuration
    // --------------------------------------------------------

    this.minDurability =
      Math.max(
        1,
        Number.isFinite(
          config.minDurability
        )
          ? config.minDurability!
          : 1
      );

    this.maxDurability =
      Math.max(
        this.minDurability,
        Number.isFinite(
          config.maxDurability
        )
          ? config.maxDurability!
          : 2.5
      );
  }

  // ==========================================================
  // Get All Boss Races
  // ==========================================================

  public getBossRaces():
    readonly RaceDefinition[] {

    return this.races.filter(
      (
        race
      ) =>
        race.isBoss === true
    );
  }

  // ==========================================================
  // Get Boss Race By ID
  // ==========================================================

  public getBossRace(
    raceId: string
  ):
    RaceDefinition | undefined {

    if (
      typeof raceId !==
      "string"
    ) {
      return undefined;
    }

    return this.races.find(
      (
        race
      ) =>
        race.id === raceId &&
        race.isBoss === true
    );
  }

  // ==========================================================
  // Get Boss Race By Level
  // ==========================================================

  public getBossRaceByLevel(
    level: number
  ):
    RaceDefinition | undefined {

    if (
      !Number.isFinite(level)
    ) {
      return undefined;
    }

    const safeLevel =
      Math.max(
        1,
        Math.floor(level)
      );

    return this.races.find(
      (
        race
      ) =>
        race.level === safeLevel &&
        race.isBoss === true
    );
  }

  // ==========================================================
  // Is Boss Race
  // ==========================================================

  public isBossRace(
    raceId: string
  ): boolean {

    return (
      this.getBossRace(
        raceId
      ) !== undefined
    );
  }

  // ==========================================================
  // Is Boss Level
  // ==========================================================

  public isBossLevel(
    level: number
  ): boolean {

    return (
      this.getBossRaceByLevel(
        level
      ) !== undefined
    );
  }

  // ==========================================================
  // Get Boss Profile By Race ID
  // ==========================================================

  public getProfileByRaceId(
    raceId: string
  ):
    BossRaceProfile | undefined {

    const race =
      this.getBossRace(
        raceId
      );

    if (
      !race
    ) {
      return undefined;
    }

    return this.createProfile(
      race
    );
  }

  // ==========================================================
  // Get Boss Profile By Level
  // ==========================================================

  public getProfileByLevel(
    level: number
  ):
    BossRaceProfile | undefined {

    const race =
      this.getBossRaceByLevel(
        level
      );

    if (
      !race
    ) {
      return undefined;
    }

    return this.createProfile(
      race
    );
  }

  // ==========================================================
  // Create Boss Profile
  // ==========================================================

  private createProfile(
    race: RaceDefinition
  ): BossRaceProfile {

    // --------------------------------------------------------
    // Safe Race Data
    // --------------------------------------------------------
    //
    // RaceDefinition may expose optional
    // name/description fields.
    //
    // BossRaceProfile requires strict strings.
    // Therefore normalize them here.
    // --------------------------------------------------------

    const raceId =
      typeof race.id === "string"
        ? race.id
        : "";

    const level =
      Number.isFinite(race.level)
        ? Math.max(
            1,
            Math.floor(race.level)
          )
        : 1;

    const name =
      typeof race.name === "string"
        ? race.name
        : `Boss Race ${level}`;

    const description =
      typeof race.description === "string"
        ? race.description
        : "Face a powerful RaceNova boss.";

    // --------------------------------------------------------
    // Difficulty Profile
    // --------------------------------------------------------

    const difficultyProfile =
      this.difficultySystem.getProfile(
        level
      );

    // --------------------------------------------------------
    // Difficulty
    // --------------------------------------------------------

    const difficulty =
      this.clamp(
        Number.isFinite(
          difficultyProfile.difficulty
        )
          ? difficultyProfile.difficulty
          : 0,
        0,
        1
      );

    // --------------------------------------------------------
    // Difficulty Tier
    // --------------------------------------------------------
    //
    // M6.5 uses the normal difficulty tiers.
    //
    // BossRaceProfile deliberately does NOT
    // introduce a new "boss" tier.
    //
    // Unknown/unsupported values safely
    // fall back to "expert".
    // --------------------------------------------------------

    const rawTier =
      difficultyProfile.tier;

    const tier:
      BossRaceProfile["tier"] =
        rawTier === "easy"
          ? "easy"
          : rawTier === "normal"
            ? "normal"
            : rawTier === "hard"
              ? "hard"
              : "expert";

    // --------------------------------------------------------
    // Rival Speed
    // --------------------------------------------------------

    const baseRivalSpeed =
      Number.isFinite(
        difficultyProfile
          .rivalSpeedMultiplier
      )
        ? difficultyProfile
            .rivalSpeedMultiplier
        : 1;

    const speedMultiplier =
      this.clamp(
        baseRivalSpeed +
          0.15 +
          difficulty * 0.15,
        this.minSpeedMultiplier,
        this.maxSpeedMultiplier
      );

    // --------------------------------------------------------
    // Rival Reaction
    // --------------------------------------------------------

    const baseReaction =
      Number.isFinite(
        difficultyProfile
          .rivalReactionMultiplier
      )
        ? difficultyProfile
            .rivalReactionMultiplier
        : 0.75;

    const reactionMultiplier =
      this.clamp(
        baseReaction -
          0.08 -
          difficulty * 0.07,
        0.40,
        0.82
      );

    // --------------------------------------------------------
    // Boss Aggression
    // --------------------------------------------------------

    const aggression =
      this.clamp(
        this.minAggression +
          difficulty *
            (
              this.maxAggression -
              this.minAggression
            ),
        this.minAggression,
        this.maxAggression
      );

    // --------------------------------------------------------
    // Overtaking Pressure
    // --------------------------------------------------------

    const overtakingPressure =
      this.clamp(
        0.65 +
          difficulty * 0.35,
        0,
        1
      );

    // --------------------------------------------------------
    // Lane Change Pressure
    // --------------------------------------------------------

    const laneChangePressure =
      this.clamp(
        0.60 +
          difficulty * 0.40,
        0,
        1
      );

    // --------------------------------------------------------
    // Boss Durability
    // --------------------------------------------------------

    const durability =
      this.clamp(
        this.minDurability +
          difficulty *
            (
              this.maxDurability -
              this.minDurability
            ),
        this.minDurability,
        this.maxDurability
      );

    // --------------------------------------------------------
    // Boss Challenge
    // --------------------------------------------------------

    const normalizedSpeed =
      this.maxSpeedMultiplier > 0
        ? speedMultiplier /
          this.maxSpeedMultiplier
        : 0;

    const challenge =
      this.clamp(
        (
          difficulty +
          normalizedSpeed +
          aggression +
          overtakingPressure +
          laneChangePressure
        ) / 5,
        0,
        1
      );

    // --------------------------------------------------------
    // Final Boss Profile
    // --------------------------------------------------------

    return {

      raceId,

      level,

      name,

      description,

      isBossRace:
        true,

      difficulty,

      tier,

      speedMultiplier,

      reactionMultiplier,

      aggression,

      overtakingPressure,

      laneChangePressure,

      durability,

      challenge
    };
  }

  // ==========================================================
  // Speed Multiplier
  // ==========================================================

  public getSpeedMultiplier(
    raceId: string
  ): number {

    const profile =
      this.getProfileByRaceId(
        raceId
      );

    return profile
      ? profile.speedMultiplier
      : 0;
  }

  // ==========================================================
  // Reaction Multiplier
  // ==========================================================

  public getReactionMultiplier(
    raceId: string
  ): number {

    const profile =
      this.getProfileByRaceId(
        raceId
      );

    return profile
      ? profile.reactionMultiplier
      : 0;
  }

  // ==========================================================
  // Aggression
  // ==========================================================

  public getAggression(
    raceId: string
  ): number {

    const profile =
      this.getProfileByRaceId(
        raceId
      );

    return profile
      ? profile.aggression
      : 0;
  }

  // ==========================================================
  // Overtaking Pressure
  // ==========================================================

  public getOvertakingPressure(
    raceId: string
  ): number {

    const profile =
      this.getProfileByRaceId(
        raceId
      );

    return profile
      ? profile.overtakingPressure
      : 0;
  }

  // ==========================================================
  // Lane Change Pressure
  // ==========================================================

  public getLaneChangePressure(
    raceId: string
  ): number {

    const profile =
      this.getProfileByRaceId(
        raceId
      );

    return profile
      ? profile.laneChangePressure
      : 0;
  }

  // ==========================================================
  // Durability
  // ==========================================================

  public getDurability(
    raceId: string
  ): number {

    const profile =
      this.getProfileByRaceId(
        raceId
      );

    return profile
      ? profile.durability
      : 0;
  }

  // ==========================================================
  // Challenge
  // ==========================================================

  public getChallenge(
    raceId: string
  ): number {

    const profile =
      this.getProfileByRaceId(
        raceId
      );

    return profile
      ? profile.challenge
      : 0;
  }

  // ==========================================================
  // Get Configuration
  // ==========================================================

  public getConfig():
    BossRaceSystemConfig {

    return {

      minSpeedMultiplier:
        this.minSpeedMultiplier,

      maxSpeedMultiplier:
        this.maxSpeedMultiplier,

      minAggression:
        this.minAggression,

      maxAggression:
        this.maxAggression,

      minDurability:
        this.minDurability,

      maxDurability:
        this.maxDurability
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
     * M6.7 is configuration/profile based.
     *
     * There is no mutable runtime state
     * to reset.
     */
  }
}
