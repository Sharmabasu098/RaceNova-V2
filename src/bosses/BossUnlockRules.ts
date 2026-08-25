/**
 * ============================================================
 * RaceNova V2
 * Boss Unlock Rules
 * M6.8.2
 * ============================================================
 *
 * Responsibilities:
 * - Determine whether a Boss is unlocked
 * - Campaign progression validation
 * - Required race validation
 * - Required wins validation
 * - Previous Boss validation
 * - Boss defeat state validation
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No UI dependency
 *
 * This module only answers:
 *
 * "Is this Boss allowed to start?"
 * ============================================================
 */

// ============================================================
// Boss Unlock Configuration
// ============================================================

export interface BossUnlockConfig {

  /**
   * Boss identifier.
   */
  bossId: string;

  /**
   * Minimum campaign level required.
   */
  requiredLevel: number;

  /**
   * Minimum completed races required.
   */
  requiredRacesCompleted: number;

  /**
   * Minimum race wins required.
   */
  requiredRacesWon: number;

  /**
   * Optional race that must be completed
   * before this Boss becomes available.
   */
  requiredRaceId?: string;

  /**
   * Optional previous Boss that must have
   * been defeated.
   */
  requiredBossId?: string;
}

// ============================================================
// Player Progress Input
// ============================================================

export interface BossUnlockProgress {

  /**
   * Current campaign level.
   */
  unlockedLevel: number;

  /**
   * Total completed races.
   */
  racesCompleted: number;

  /**
   * Total races won.
   */
  racesWon: number;

  /**
   * Bosses defeated count.
   */
  bossesDefeated: number;

  /**
   * Race progression records.
   */
  races?: readonly BossUnlockRaceProgress[];

  /**
   * Defeated Boss IDs.
   *
   * Optional for backward compatibility.
   */
  defeatedBossIds?: readonly string[];
}

// ============================================================
// Race Progress Input
// ============================================================

export interface BossUnlockRaceProgress {

  /**
   * Race identifier.
   */
  raceId: string;

  /**
   * Race status.
   */
  status:
    | "locked"
    | "available"
    | "completed";

  /**
   * Number of race wins.
   */
  winCount: number;
}

// ============================================================
// Unlock Result
// ============================================================

export interface BossUnlockResult {

  /**
   * Final unlock result.
   */
  unlocked: boolean;

  /**
   * Human-readable reason.
   */
  reason:
    | "unlocked"
    | "invalid_boss_id"
    | "invalid_progress"
    | "level_required"
    | "races_required"
    | "wins_required"
    | "race_required"
    | "previous_boss_required";
}

// ============================================================
// Default Rules
// ============================================================

export const DEFAULT_BOSS_UNLOCK_CONFIG:
  BossUnlockConfig = {

    bossId:
      "boss_race_01",

    requiredLevel:
      2,

    requiredRacesCompleted:
      3,

    requiredRacesWon:
      2
  };

// ============================================================
// Boss Unlock Rules
// ============================================================

export class BossUnlockRules {

  // ==========================================================
  // Validate Progress
  // ==========================================================

  private isValidProgress(
    progress: BossUnlockProgress
  ): boolean {

    if (
      !progress ||
      typeof progress !== "object"
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        progress.unlockedLevel
      ) ||
      progress.unlockedLevel < 1
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        progress.racesCompleted
      ) ||
      progress.racesCompleted < 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        progress.racesWon
      ) ||
      progress.racesWon < 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        progress.bossesDefeated
      ) ||
      progress.bossesDefeated < 0
    ) {
      return false;
    }

    return true;
  }

  // ==========================================================
  // Validate Config
  // ==========================================================

  private isValidConfig(
    config: BossUnlockConfig
  ): boolean {

    if (
      !config ||
      typeof config !== "object"
    ) {
      return false;
    }

    if (
      typeof config.bossId !== "string" ||
      config.bossId.trim().length === 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        config.requiredLevel
      ) ||
      config.requiredLevel < 1
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        config.requiredRacesCompleted
      ) ||
      config.requiredRacesCompleted < 0
    ) {
      return false;
    }

    if (
      !Number.isFinite(
        config.requiredRacesWon
      ) ||
      config.requiredRacesWon < 0
    ) {
      return false;
    }

    if (
      config.requiredRaceId !== undefined &&
      typeof config.requiredRaceId !== "string"
    ) {
      return false;
    }

    if (
      config.requiredBossId !== undefined &&
      typeof config.requiredBossId !== "string"
    ) {
      return false;
    }

    return true;
  }

  // ==========================================================
  // Check Race Requirement
  // ==========================================================

  private hasRequiredRaceCompleted(
    progress: BossUnlockProgress,
    requiredRaceId: string
  ): boolean {

    if (
      !progress.races ||
      !Array.isArray(progress.races)
    ) {
      return false;
    }

    const race =
      progress.races.find(
        (entry) =>
          entry &&
          entry.raceId ===
            requiredRaceId
      );

    if (
      !race
    ) {
      return false;
    }

    return (
      race.status ===
        "completed"
    );
  }

  // ==========================================================
  // Check Previous Boss
  // ==========================================================

  private hasRequiredBossDefeated(
    progress: BossUnlockProgress,
    requiredBossId: string
  ): boolean {

    /*
     * Newer progression can provide exact
     * Boss IDs.
     */
    if (
      Array.isArray(
        progress.defeatedBossIds
      )
    ) {

      return progress
        .defeatedBossIds
        .includes(
          requiredBossId
        );
    }

    /*
     * Backward-compatible fallback:
     *
     * If an exact Boss ID list does not exist,
     * a positive Boss defeat count confirms that
     * at least one previous Boss was defeated.
     */
    return (
      progress.bossesDefeated > 0
    );
  }

  // ==========================================================
  // Check Unlock
  // ==========================================================

  public static check(
    progress: BossUnlockProgress,
    config:
      BossUnlockConfig =
        DEFAULT_BOSS_UNLOCK_CONFIG
  ): BossUnlockResult {

    // --------------------------------------------------------
    // Config validation
    // --------------------------------------------------------

    if (
      !BossUnlockRules
        .prototype
        .isValidConfig.call(
          {},
          config
        )
    ) {
      return {

        unlocked:
          false,

        reason:
          "invalid_boss_id"
      };
    }

    // --------------------------------------------------------
    // Progress validation
    // --------------------------------------------------------

    if (
      !BossUnlockRules
        .prototype
        .isValidProgress.call(
          {},
          progress
        )
    ) {
      return {

        unlocked:
          false,

        reason:
          "invalid_progress"
      };
    }

    // --------------------------------------------------------
    // Campaign Level
    // --------------------------------------------------------

    if (
      progress.unlockedLevel <
      config.requiredLevel
    ) {

      return {

        unlocked:
          false,

        reason:
          "level_required"
      };
    }

    // --------------------------------------------------------
    // Completed Races
    // --------------------------------------------------------

    if (
      progress.racesCompleted <
      config.requiredRacesCompleted
    ) {

      return {

        unlocked:
          false,

        reason:
          "races_required"
      };
    }

    // --------------------------------------------------------
    // Race Wins
    // --------------------------------------------------------

    if (
      progress.racesWon <
      config.requiredRacesWon
    ) {

      return {

        unlocked:
          false,

        reason:
          "wins_required"
      };
    }

    // --------------------------------------------------------
    // Required Race
    // --------------------------------------------------------

    if (
      config.requiredRaceId !==
      undefined
    ) {

      if (
        !BossUnlockRules
          .prototype
          .hasRequiredRaceCompleted.call(
            {},
            progress,
            config.requiredRaceId
          )
      ) {

        return {

          unlocked:
            false,

          reason:
            "race_required"
        };
      }
    }

    // --------------------------------------------------------
    // Previous Boss
    // --------------------------------------------------------

    if (
      config.requiredBossId !==
      undefined
    ) {

      if (
        !BossUnlockRules
          .prototype
          .hasRequiredBossDefeated.call(
            {},
            progress,
            config.requiredBossId
          )
      ) {

        return {

          unlocked:
            false,

          reason:
            "previous_boss_required"
        };
      }
    }

    // --------------------------------------------------------
    // All Requirements Passed
    // --------------------------------------------------------

    return {

      unlocked:
        true,

      reason:
        "unlocked"
    };
  }

  // ==========================================================
  // Simple Boolean Check
  // ==========================================================

  public static isUnlocked(
    progress: BossUnlockProgress,
    config:
      BossUnlockConfig =
        DEFAULT_BOSS_UNLOCK_CONFIG
  ): boolean {

    return (
      BossUnlockRules.check(
        progress,
        config
      ).unlocked
    );
  }
}
