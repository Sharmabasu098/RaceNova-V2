/**
 * ============================================================
 * RaceNova V2
 * Boss Unlock System
 * M6.8
 * ============================================================
 *
 * Responsibilities:
 * - Determine whether a Boss race can be unlocked
 * - Validate Boss unlock requirements
 * - Unlock Boss race
 * - Provide Boss difficulty profile
 * - Validate Boss progression state
 *
 * IMPORTANT:
 * - RaceDefinitions remains authoritative
 * - RaceProgressionState remains authoritative
 * - BossRaceSystem remains authoritative for Boss difficulty
 * - No hard-coded Boss level
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No gameplay spawning
 *
 * M6.1:
 * Race Progression Data
 *
 * M6.2:
 * Race Definitions
 *
 * M6.3:
 * Race Unlock System
 *
 * M6.7:
 * Boss Race System
 *
 * M6.8:
 * Boss Unlock + Boss Difficulty
 *
 * M6.9:
 * Progression Save / Reload
 * ============================================================
 */

import {
  type RaceDefinition,
  type RaceProgressionState,
  type RaceProgress,
  getRaceProgress
} from "./RaceProgressionData";

import {
  RACE_DEFINITIONS
} from "./RaceDefinitions";

import {
  RaceUnlockSystem
} from "./RaceUnlockSystem";

import {
  BossRaceSystem,
  type BossRaceProfile
} from "./BossRaceSystem";

// ============================================================
// Boss Unlock Reason
// ============================================================

export type BossUnlockReason =
  | "unlocked"
  | "already_unlocked"
  | "boss_not_found"
  | "previous_race_not_found"
  | "previous_race_not_completed"
  | "invalid_state";

// ============================================================
// Boss Unlock Result
// ============================================================

export interface BossUnlockResult {

  success: boolean;

  bossRaceId: string;

  bossLevel: number;

  previousLevel: number;

  unlockedLevel: number;

  reason: BossUnlockReason;
}

// ============================================================
// Boss Unlock Requirement
// ============================================================

export interface BossUnlockRequirement {

  /**
   * Boss race ID.
   */
  bossRaceId: string;

  /**
   * Boss campaign level.
   */
  bossLevel: number;

  /**
   * Race that must be completed first.
   */
  requiredRaceId: string;

  /**
   * Required race level.
   */
  requiredRaceLevel: number;

  /**
   * Whether the requirement is satisfied.
   */
  requirementMet: boolean;
}

// ============================================================
// Boss Unlock System
// ============================================================

export class BossUnlockSystem {

  // ==========================================================
  // Race Definitions
  // ==========================================================

  private readonly definitions:
    readonly RaceDefinition[];

  // ==========================================================
  // Race Unlock System
  // ==========================================================

  private readonly raceUnlockSystem:
    RaceUnlockSystem;

  // ==========================================================
  // Boss Race System
  // ==========================================================

  private readonly bossRaceSystem:
    BossRaceSystem;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    bossRaceSystem:
      BossRaceSystem,

    definitions:
      readonly RaceDefinition[] =
        RACE_DEFINITIONS,

    raceUnlockSystem?:
      RaceUnlockSystem
  ) {

    this.bossRaceSystem =
      bossRaceSystem;

    this.definitions =
      definitions;

    this.raceUnlockSystem =
      raceUnlockSystem ??
      new RaceUnlockSystem(
        definitions
      );
  }

  // ==========================================================
  // Get Definitions
  // ==========================================================

  public getDefinitions():
    readonly RaceDefinition[] {

    return this.definitions;
  }

  // ==========================================================
  // Get Boss Races
  // ==========================================================

  public getBossRaces():
    readonly RaceDefinition[] {

    return this.bossRaceSystem
      .getBossRaces();
  }

  // ==========================================================
  // Get Boss Race
  // ==========================================================

  public getBossRace(
    bossRaceId: string
  ):
    RaceDefinition | undefined {

    return this.bossRaceSystem
      .getBossRace(
        bossRaceId
      );
  }

  // ==========================================================
  // Get Boss Race By Level
  // ==========================================================

  public getBossRaceByLevel(
    level: number
  ):
    RaceDefinition | undefined {

    return this.bossRaceSystem
      .getBossRaceByLevel(
        level
      );
  }

  // ==========================================================
  // Is Boss
  // ==========================================================

  public isBossRace(
    raceId: string
  ): boolean {

    return this.bossRaceSystem
      .isBossRace(
        raceId
      );
  }

  // ==========================================================
  // Get Progress
  // ==========================================================

  public getProgress(
    state: RaceProgressionState,
    raceId: string
  ):
    RaceProgress | undefined {

    return getRaceProgress(
      state,
      raceId
    );
  }

  // ==========================================================
  // Get Boss Progress
  // ==========================================================

  public getBossProgress(
    state: RaceProgressionState,
    bossRaceId: string
  ):
    RaceProgress | undefined {

    if (
      !this.isBossRace(
        bossRaceId
      )
    ) {
      return undefined;
    }

    return this.getProgress(
      state,
      bossRaceId
    );
  }

  // ==========================================================
  // Is Boss Unlocked
  // ==========================================================

  public isBossUnlocked(
    state: RaceProgressionState,
    bossRaceId: string
  ): boolean {

    if (
      !this.validateState(
        state
      )
    ) {
      return false;
    }

    if (
      !this.isBossRace(
        bossRaceId
      )
    ) {
      return false;
    }

    const progress =
      this.getBossProgress(
        state,
        bossRaceId
      );

    if (
      !progress
    ) {
      return false;
    }

    return (
      progress.status ===
        "available" ||
      progress.status ===
        "completed"
    );
  }

  // ==========================================================
  // Get Previous Race
  // ==========================================================
  //
  // Finds the immediately preceding
  // campaign race by level.
  //
  // Boss level itself is NOT hard-coded.
  // ==========================================================

  public getPreviousRace(
    bossRaceId: string
  ):
    RaceDefinition | undefined {

    const bossRace =
      this.getBossRace(
        bossRaceId
      );

    if (
      !bossRace
    ) {
      return undefined;
    }

    let previousRace:
      RaceDefinition | undefined;

    for (
      const race
      of this.definitions
    ) {

      if (
        race.level >=
        bossRace.level
      ) {
        continue;
      }

      if (
        !previousRace ||
        race.level >
        previousRace.level
      ) {

        previousRace =
          race;
      }
    }

    return previousRace;
  }

  // ==========================================================
  // Get Unlock Requirement
  // ==========================================================

  public getUnlockRequirement(
    state: RaceProgressionState,
    bossRaceId: string
  ):
    BossUnlockRequirement | undefined {

    const bossRace =
      this.getBossRace(
        bossRaceId
      );

    if (
      !bossRace
    ) {
      return undefined;
    }

    const previousRace =
      this.getPreviousRace(
        bossRaceId
      );

    if (
      !previousRace
    ) {

      return {

        bossRaceId:
          bossRace.id,

        bossLevel:
          bossRace.level,

        requiredRaceId:
          "",

        requiredRaceLevel:
          0,

        requirementMet:
          false
      };
    }

    const previousProgress =
      this.getProgress(
        state,
        previousRace.id
      );

    const requirementMet =
      previousProgress !==
        undefined &&
      (
        previousProgress.status ===
          "completed" ||
        previousProgress.winCount >
          0
      );

    return {

      bossRaceId:
        bossRace.id,

      bossLevel:
        bossRace.level,

      requiredRaceId:
        previousRace.id,

      requiredRaceLevel:
        previousRace.level,

      requirementMet
    };
  }

  // ==========================================================
  // Can Unlock Boss
  // ==========================================================

  public canUnlockBoss(
    state: RaceProgressionState,
    bossRaceId: string
  ): boolean {

    if (
      !this.validateState(
        state
      )
    ) {
      return false;
    }

    const bossRace =
      this.getBossRace(
        bossRaceId
      );

    if (
      !bossRace
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Already unlocked
    // --------------------------------------------------------

    if (
      this.isBossUnlocked(
        state,
        bossRaceId
      )
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Previous race
    // --------------------------------------------------------

    const previousRace =
      this.getPreviousRace(
        bossRaceId
      );

    if (
      !previousRace
    ) {
      return false;
    }

    const previousProgress =
      this.getProgress(
        state,
        previousRace.id
      );

    if (
      !previousProgress
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Completion requirement
    // --------------------------------------------------------

    return (
      previousProgress.status ===
        "completed" ||
      previousProgress.winCount >
        0
    );
  }

  // ==========================================================
  // Unlock Boss
  // ==========================================================

  public unlockBoss(
    state: RaceProgressionState,
    bossRaceId: string
  ): BossUnlockResult {

    // --------------------------------------------------------
    // Invalid State
    // --------------------------------------------------------

    if (
      !this.validateState(
        state
      )
    ) {

      return {

        success:
          false,

        bossRaceId,

        bossLevel:
          0,

        previousLevel:
          0,

        unlockedLevel:
          0,

        reason:
          "invalid_state"
      };
    }

    // --------------------------------------------------------
    // Find Boss
    // --------------------------------------------------------

    const bossRace =
      this.getBossRace(
        bossRaceId
      );

    if (
      !bossRace
    ) {

      return {

        success:
          false,

        bossRaceId,

        bossLevel:
          0,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "boss_not_found"
      };
    }

    // --------------------------------------------------------
    // Already Unlocked
    // --------------------------------------------------------

    if (
      this.isBossUnlocked(
        state,
        bossRaceId
      )
    ) {

      return {

        success:
          false,

        bossRaceId,

        bossLevel:
          bossRace.level,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "already_unlocked"
      };
    }

    // --------------------------------------------------------
    // Previous Race
    // --------------------------------------------------------

    const previousRace =
      this.getPreviousRace(
        bossRaceId
      );

    if (
      !previousRace
    ) {

      return {

        success:
          false,

        bossRaceId,

        bossLevel:
          bossRace.level,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "previous_race_not_found"
      };
    }

    // --------------------------------------------------------
    // Previous Race Progress
    // --------------------------------------------------------

    const previousProgress =
      this.getProgress(
        state,
        previousRace.id
      );

    if (
      !previousProgress
    ) {

      return {

        success:
          false,

        bossRaceId,

        bossLevel:
          bossRace.level,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "previous_race_not_found"
      };
    }

    // --------------------------------------------------------
    // Completion Requirement
    // --------------------------------------------------------

    const previousRaceCompleted =
      previousProgress.status ===
        "completed" ||
      previousProgress.winCount >
        0;

    if (
      !previousRaceCompleted
    ) {

      return {

        success:
          false,

        bossRaceId,

        bossLevel:
          bossRace.level,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "previous_race_not_completed"
      };
    }

    // --------------------------------------------------------
    // Unlock Boss
    // --------------------------------------------------------

    const previousLevel =
      state.unlockedLevel;

    const unlocked =
      this.raceUnlockSystem
        .markRaceAvailable(
          state,
          bossRace.id
        );

    if (
      !unlocked
    ) {

      return {

        success:
          false,

        bossRaceId,

        bossLevel:
          bossRace.level,

        previousLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "invalid_state"
      };
    }

    // --------------------------------------------------------
    // Ensure Boss Level Is Unlocked
    // --------------------------------------------------------

    state.unlockedLevel =
      Math.max(
        state.unlockedLevel,
        bossRace.level
      );

    // --------------------------------------------------------
    // Select Boss
    // --------------------------------------------------------

    state.selectedRaceId =
      bossRace.id;

    // --------------------------------------------------------
    // Success
    // --------------------------------------------------------

    return {

      success:
        true,

      bossRaceId:
        bossRace.id,

      bossLevel:
        bossRace.level,

      previousLevel,

      unlockedLevel:
        state.unlockedLevel,

      reason:
        "unlocked"
    };
  }

  // ==========================================================
  // Get Boss Difficulty Profile
  // ==========================================================

  public getBossDifficulty(
    bossRaceId: string
  ):
    BossRaceProfile | undefined {

    if (
      !this.isBossRace(
        bossRaceId
      )
    ) {
      return undefined;
    }

    return this.bossRaceSystem
      .getProfileByRaceId(
        bossRaceId
      );
  }

  // ==========================================================
  // Get Boss Difficulty By Level
  // ==========================================================

  public getBossDifficultyByLevel(
    level: number
  ):
    BossRaceProfile | undefined {

    const bossRace =
      this.getBossRaceByLevel(
        level
      );

    if (
      !bossRace
    ) {
      return undefined;
    }

    return this.bossRaceSystem
      .getProfileByLevel(
        level
      );
  }

  // ==========================================================
  // Is Boss Defeated
  // ==========================================================

  public isBossDefeated(
    state: RaceProgressionState,
    bossRaceId: string
  ): boolean {

    const progress =
      this.getBossProgress(
        state,
        bossRaceId
      );

    if (
      !progress
    ) {
      return false;
    }

    return (
      progress.bossDefeated === true
    );
  }

  // ==========================================================
  // Validate Boss State
  // ==========================================================

  public validateState(
    state: RaceProgressionState
  ): boolean {

    if (
      !state ||
      typeof state !==
        "object"
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        state.unlockedLevel
      ) ||
      state.unlockedLevel < 1
    ) {
      return false;
    }

    if (
      !Array.isArray(
        state.races
      )
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Validate race progress
    // --------------------------------------------------------

    for (
      const race
      of state.races
    ) {

      if (
        !race ||
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
        race.bossDefeated !==
          true &&
        race.bossDefeated !==
          false
      ) {
        return false;
      }
    }

    // --------------------------------------------------------
    // Validate boss definitions
    // --------------------------------------------------------

    for (
      const bossRace
      of this.getBossRaces()
    ) {

      const progress =
        this.getBossProgress(
          state,
          bossRace.id
        );

      if (
        !progress
      ) {
        continue;
      }

      if (
        progress.bossDefeated &&
        progress.winCount <= 0
      ) {
        return false;
      }
    }

    return true;
  }

  // ==========================================================
  // Get Configuration Summary
  // ==========================================================

  public getBossSummary(
    state: RaceProgressionState
  ): Array<{
    raceId: string;
    level: number;
    unlocked: boolean;
    defeated: boolean;
    difficulty: number;
  }> {

    const bosses =
      this.getBossRaces();

    return bosses.map(
      (
        boss
      ) => {

        const profile =
          this.getBossDifficulty(
            boss.id
          );

        return {

          raceId:
            boss.id,

          level:
            boss.level,

          unlocked:
            this.isBossUnlocked(
              state,
              boss.id
            ),

          defeated:
            this.isBossDefeated(
              state,
              boss.id
            ),

          difficulty:
            profile
              ? profile.difficulty
              : 0
        };
      }
    );
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {

    /*
     * No mutable internal state.
     *
     * RaceProgressionState is owned by
     * the caller and is intentionally not
     * reset here.
     */
  }
}
