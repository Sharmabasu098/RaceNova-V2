/**
 * ============================================================
 * RaceNova V2
 * Race Unlock System
 * M6.3
 * ============================================================
 *
 * Responsibilities:
 * - Determine which races are unlocked
 * - Unlock next campaign race
 * - Unlock races by level
 * - Check race availability
 * - Keep progression state authoritative
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No economy logic
 * - No race gameplay logic
 *
 * M6.1:
 * RaceProgressionState
 *
 * M6.2:
 * RaceDefinition / RACE_DEFINITIONS
 *
 * M6.4 will handle:
 * Race Start / Completion / Fail Flow
 * ============================================================
 */

import {
  type RaceDefinition,
  type RaceProgressionState,
  type RaceProgress,
  type RaceStatus,
  getRaceProgress
} from "./RaceProgressionData";

import {
  RACE_DEFINITIONS
} from "./RaceDefinitions";

// ============================================================
// Unlock Result
// ============================================================

export interface RaceUnlockResult {

  success: boolean;

  raceId: string;

  previousLevel: number;

  unlockedLevel: number;

  reason:
    | "unlocked"
    | "already_unlocked"
    | "not_found"
    | "requirements_not_met";
}

// ============================================================
// Race Unlock System
// ============================================================

export class RaceUnlockSystem {

  private readonly definitions:
    readonly RaceDefinition[];

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    definitions:
      readonly RaceDefinition[] =
        RACE_DEFINITIONS
  ) {

    this.definitions =
      definitions;
  }

  // ==========================================================
  // Get Definitions
  // ==========================================================

  public getDefinitions():
    readonly RaceDefinition[] {

    return this.definitions;
  }

  // ==========================================================
  // Get Race
  // ==========================================================

  public getRace(
    raceId: string
  ):
    RaceDefinition | undefined {

    return this.definitions.find(
      (race) =>
        race.id === raceId
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
  // Is Race Unlocked
  // ==========================================================

  public isRaceUnlocked(
    state: RaceProgressionState,
    raceId: string
  ): boolean {

    const race =
      this.getRace(
        raceId
      );

    if (!race) {
      return false;
    }

    const progress =
      this.getProgress(
        state,
        raceId
      );

    if (!progress) {
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
  // Is Race Locked
  // ==========================================================

  public isRaceLocked(
    state: RaceProgressionState,
    raceId: string
  ): boolean {

    return !this.isRaceUnlocked(
      state,
      raceId
    );
  }

  // ==========================================================
  // Get Available Races
  // ==========================================================

  public getAvailableRaces(
    state: RaceProgressionState
  ):
    RaceProgress[] {

    return state.races.filter(
      (race) =>
        race.status ===
        "available"
    );
  }

  // ==========================================================
  // Get Completed Races
  // ==========================================================

  public getCompletedRaces(
    state: RaceProgressionState
  ):
    RaceProgress[] {

    return state.races.filter(
      (race) =>
        race.status ===
        "completed"
    );
  }

  // ==========================================================
  // Get Locked Races
  // ==========================================================

  public getLockedRaces(
    state: RaceProgressionState
  ):
    RaceProgress[] {

    return state.races.filter(
      (race) =>
        race.status ===
        "locked"
    );
  }

  // ==========================================================
  // Unlock Race
  // ==========================================================

  public unlockRace(
    state: RaceProgressionState,
    raceId: string
  ): RaceUnlockResult {

    const race =
      this.getRace(
        raceId
      );

    if (!race) {

      return {

        success:
          false,

        raceId,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "not_found"
      };
    }

    const progress =
      this.getProgress(
        state,
        raceId
      );

    if (!progress) {

      return {

        success:
          false,

        raceId,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "not_found"
      };
    }

    // --------------------------------------------------------
    // Already unlocked
    // --------------------------------------------------------

    if (
      progress.status ===
        "available" ||
      progress.status ===
        "completed"
    ) {

      return {

        success:
          false,

        raceId,

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "already_unlocked"
      };
    }

    // --------------------------------------------------------
    // Unlock
    // --------------------------------------------------------

    progress.status =
      "available";

    const previousLevel =
      state.unlockedLevel;

    state.unlockedLevel =
      Math.max(
        state.unlockedLevel,
        race.level
      );

    return {

      success:
        true,

      raceId,

      previousLevel,

      unlockedLevel:
        state.unlockedLevel,

      reason:
        "unlocked"
    };
  }

  // ==========================================================
  // Unlock Next Race
  // ==========================================================

  public unlockNextRace(
    state: RaceProgressionState,
    completedRaceId: string
  ): RaceUnlockResult {

    const completedRace =
      this.getRace(
        completedRaceId
      );

    if (!completedRace) {

      return {

        success:
          false,

        raceId:
          "",

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "not_found"
      };
    }

    const nextRace =
      this.definitions.find(
        (race) =>
          race.level >
            completedRace.level &&
          race.level ===
            completedRace.level + 1
      );

    if (!nextRace) {

      return {

        success:
          false,

        raceId:
          "",

        previousLevel:
          state.unlockedLevel,

        unlockedLevel:
          state.unlockedLevel,

        reason:
          "requirements_not_met"
      };
    }

    return this.unlockRace(
      state,
      nextRace.id
    );
  }

  // ==========================================================
  // Mark Race Available
  // ==========================================================

  public markRaceAvailable(
    state: RaceProgressionState,
    raceId: string
  ): boolean {

    const progress =
      this.getProgress(
        state,
        raceId
      );

    const race =
      this.getRace(
        raceId
      );

    if (
      !progress ||
      !race
    ) {
      return false;
    }

    if (
      progress.status ===
      "completed"
    ) {
      return true;
    }

    progress.status =
      "available";

    state.unlockedLevel =
      Math.max(
        state.unlockedLevel,
        race.level
      );

    return true;
  }

  // ==========================================================
  // Ensure Initial Race
  // ==========================================================

  public ensureInitialRace(
    state: RaceProgressionState
  ): boolean {

    if (
      this.definitions.length ===
      0
    ) {
      return false;
    }

    const firstRace =
      this.definitions[0];

    const progress =
      this.getProgress(
        state,
        firstRace.id
      );

    if (!progress) {
      return false;
    }

    if (
      progress.status ===
        "locked"
    ) {

      progress.status =
        "available";
    }

    state.unlockedLevel =
      Math.max(
        1,
        state.unlockedLevel,
        firstRace.level
      );

    if (
      !state.selectedRaceId
    ) {

      state.selectedRaceId =
        firstRace.id;
    }

    return true;
  }

  // ==========================================================
  // Validate Unlock State
  // ==========================================================

  public validateState(
    state: RaceProgressionState
  ): boolean {

    if (!state) {
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

      const validStatus:
        RaceStatus[] = [
          "locked",
          "available",
          "completed"
        ];

      if (
        !validStatus.includes(
          race.status
        )
      ) {
        return false;
      }
    }

    return true;
  }
}
