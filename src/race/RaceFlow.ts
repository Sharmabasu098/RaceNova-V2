/**
 * ============================================================
 * RaceNova V2
 * Race Flow
 * M6.4
 * ============================================================
 *
 * Responsibilities:
 * - Race start
 * - Active race state
 * - Race completion
 * - Race failure
 * - Race result
 * - Progression update
 * - Next race unlock
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No difficulty logic
 * - No rival AI logic
 * - No boss gameplay logic
 *
 * M6.1 → Progression Data
 * M6.2 → Race Definitions
 * M6.3 → Race Unlock System
 * M6.4 → Race Lifecycle
 * ============================================================
 */

import {
  type RaceDefinition,
  type RaceProgressionState,
  getRaceProgress
} from "./RaceProgressionData";

import {
  RaceUnlockSystem
} from "./RaceUnlockSystem";

// ============================================================
// Race Phase
// ============================================================

export type RacePhase =
  | "idle"
  | "countdown"
  | "racing"
  | "completed"
  | "failed";

// ============================================================
// Race Result
// ============================================================

export type RaceResultType =
  | "win"
  | "loss"
  | "failed";

// ============================================================
// Race Result Data
// ============================================================

export interface RaceResult {

  raceId: string;

  result:
    RaceResultType;

  position: number;

  totalRacers: number;

  raceTime: number;

  completed: boolean;

  won: boolean;

  nextRaceId:
    string | null;

  nextRaceUnlocked:
    boolean;
}

// ============================================================
// Race Flow State
// ============================================================

export interface RaceFlowState {

  phase:
    RacePhase;

  raceId:
    string | null;

  raceTime:
    number;

  position:
    number;

  totalRacers:
    number;

  result:
    RaceResult | null;
}

// ============================================================
// Race Start Configuration
// ============================================================

export interface RaceStartConfig {

  countdownDuration?: number;

  totalRacers?: number;
}

// ============================================================
// Race Flow
// ============================================================

export class RaceFlow {

  // ==========================================================
  // Systems
  // ==========================================================

  private readonly unlockSystem:
    RaceUnlockSystem;

  private readonly definitions:
    readonly RaceDefinition[];

  // ==========================================================
  // Runtime State
  // ==========================================================

  private phase:
    RacePhase =
      "idle";

  private raceId:
    string | null =
      null;

  private raceTime =
    0;

  private position =
    0;

  private totalRacers =
    1;

  private countdownTimer =
    0;

  private countdownDuration =
    3;

  private result:
    RaceResult | null =
      null;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    unlockSystem:
      RaceUnlockSystem,
    definitions:
      readonly RaceDefinition[]
  ) {

    this.unlockSystem =
      unlockSystem;

    this.definitions =
      definitions;
  }

  // ==========================================================
  // Start Race
  // ==========================================================

  public startRace(
    state: RaceProgressionState,
    raceId: string,
    config: RaceStartConfig = {}
  ): boolean {

    // --------------------------------------------------------
    // Validate current phase
    // --------------------------------------------------------

    if (
      this.phase !==
      "idle" &&
      this.phase !==
      "completed" &&
      this.phase !==
      "failed"
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Validate race
    // --------------------------------------------------------

    const race =
      this.definitions.find(
        (definition) =>
          definition.id ===
          raceId
      );

    if (!race) {
      return false;
    }

    // --------------------------------------------------------
    // Validate unlock
    // --------------------------------------------------------

    if (
      !this.unlockSystem.isRaceUnlocked(
        state,
        raceId
      )
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Runtime configuration
    // --------------------------------------------------------

    this.countdownDuration =
      Math.max(
        0,
        Number.isFinite(
          config.countdownDuration
        )
          ? config.countdownDuration!
          : 3
      );

    this.totalRacers =
      Math.max(
        1,
        Number.isFinite(
          config.totalRacers
        )
          ? Math.floor(
              config.totalRacers!
            )
          : 4
      );

    // --------------------------------------------------------
    // Reset runtime state
    // --------------------------------------------------------

    this.raceId =
      raceId;

    this.raceTime =
      0;

    this.position =
      this.totalRacers;

    this.result =
      null;

    // --------------------------------------------------------
    // Start countdown
    // --------------------------------------------------------

    if (
      this.countdownDuration >
      0
    ) {

      this.countdownTimer =
        this.countdownDuration;

      this.phase =
        "countdown";

    } else {

      this.phase =
        "racing";
    }

    // --------------------------------------------------------
    // Select current race
    // --------------------------------------------------------

    state.selectedRaceId =
      raceId;

    return true;
  }

  // ==========================================================
  // Update
  // ==========================================================

  public update(
    deltaTime: number
  ): void {

    if (
      deltaTime <= 0 ||
      !Number.isFinite(
        deltaTime
      )
    ) {
      return;
    }

    // --------------------------------------------------------
    // Countdown
    // --------------------------------------------------------

    if (
      this.phase ===
      "countdown"
    ) {

      this.countdownTimer -=
        deltaTime;

      if (
        this.countdownTimer <=
        0
      ) {

        this.countdownTimer =
          0;

        this.phase =
          "racing";
      }

      return;
    }

    // --------------------------------------------------------
    // Racing
    // --------------------------------------------------------

    if (
      this.phase ===
      "racing"
    ) {

      this.raceTime +=
        deltaTime;
    }
  }

  // ==========================================================
  // Complete Race
  // ==========================================================

  public completeRace(
    state: RaceProgressionState,
    position: number
  ): RaceResult | null {

    if (
      this.phase !==
      "racing"
    ) {
      return null;
    }

    if (
      !this.raceId
    ) {
      return null;
    }

    const raceId =
      this.raceId;

    const race =
      this.definitions.find(
        (definition) =>
          definition.id ===
          raceId
      );

    if (!race) {
      return null;
    }

    // --------------------------------------------------------
    // Normalize position
    // --------------------------------------------------------

    const safePosition =
      Math.min(
        this.totalRacers,
        Math.max(
          1,
          Math.floor(
            Number.isFinite(
              position
            )
              ? position
              : this.totalRacers
          )
        )
      );

    this.position =
      safePosition;

    // --------------------------------------------------------
    // Win condition
    // --------------------------------------------------------

    const won =
      safePosition === 1;

    const resultType:
      RaceResultType =
      won
        ? "win"
        : "loss";

    // --------------------------------------------------------
    // Update race progress
    // --------------------------------------------------------

    const progress =
      getRaceProgress(
        state,
        raceId
      );

    if (!progress) {
      return null;
    }

    progress.status =
      "completed";

    progress.completionCount +=
      1;

    if (won) {

      progress.winCount +=
        1;
    }

    // --------------------------------------------------------
    // Best position
    // --------------------------------------------------------

    if (
      progress.bestPosition <=
      0 ||
      safePosition <
        progress.bestPosition
    ) {

      progress.bestPosition =
        safePosition;
    }

    // --------------------------------------------------------
    // Best time
    // --------------------------------------------------------

    if (
      this.raceTime > 0 &&
      (
        progress.bestTime <=
          0 ||
        this.raceTime <
          progress.bestTime
      )
    ) {

      progress.bestTime =
        this.raceTime;
    }

    // --------------------------------------------------------
    // Global counters
    // --------------------------------------------------------

    state.racesCompleted +=
      1;

    if (won) {

      state.racesWon +=
        1;
    }

    // --------------------------------------------------------
    // Unlock next race
    // --------------------------------------------------------

    const unlockResult =
      this.unlockSystem.unlockNextRace(
        state,
        raceId
      );

    const nextRaceId =
      unlockResult.success
        ? unlockResult.raceId
        : null;

    // --------------------------------------------------------
    // Set phase
    // --------------------------------------------------------

    this.phase =
      "completed";

    // --------------------------------------------------------
    // Create result
    // --------------------------------------------------------

    const raceResult:
      RaceResult = {

      raceId,

      result:
        resultType,

      position:
        safePosition,

      totalRacers:
        this.totalRacers,

      raceTime:
        this.raceTime,

      completed:
        true,

      won,

      nextRaceId,

      nextRaceUnlocked:
        unlockResult.success
    };

    this.result =
      raceResult;

    return raceResult;
  }

  // ==========================================================
  // Fail Race
  // ==========================================================

  public failRace(
    state: RaceProgressionState
  ): RaceResult | null {

    if (
      this.phase !==
      "racing"
    ) {
      return null;
    }

    if (
      !this.raceId
    ) {
      return null;
    }

    const raceId =
      this.raceId;

    const progress =
      getRaceProgress(
        state,
        raceId
      );

    if (!progress) {
      return null;
    }

    // --------------------------------------------------------
    // Failure does NOT count as completion.
    // --------------------------------------------------------

    this.phase =
      "failed";

    const raceResult:
      RaceResult = {

      raceId,

      result:
        "failed",

      position:
        this.position,

      totalRacers:
        this.totalRacers,

      raceTime:
        this.raceTime,

      completed:
        false,

      won:
        false,

      nextRaceId:
        null,

      nextRaceUnlocked:
        false
    };

    this.result =
      raceResult;

    return raceResult;
  }

  // ==========================================================
  // Restart Race
  // ==========================================================

  public restartRace(
    state: RaceProgressionState
  ): boolean {

    if (
      !this.raceId
    ) {
      return false;
    }

    const raceId =
      this.raceId;

    return this.startRace(
      state,
      raceId,
      {
        countdownDuration:
          this.countdownDuration,

        totalRacers:
          this.totalRacers
      }
    );
  }

  // ==========================================================
  // Get Phase
  // ==========================================================

  public getPhase():
    RacePhase {

    return this.phase;
  }

  // ==========================================================
  // Is Racing
  // ==========================================================

  public isRacing():
    boolean {

    return (
      this.phase ===
      "racing"
    );
  }

  // ==========================================================
  // Is Countdown
  // ==========================================================

  public isCountdown():
    boolean {

    return (
      this.phase ===
      "countdown"
    );
  }

  // ==========================================================
  // Is Finished
  // ==========================================================

  public isFinished():
    boolean {

    return (
      this.phase ===
        "completed" ||
      this.phase ===
        "failed"
    );
  }

  // ==========================================================
  // Get Current Race ID
  // ==========================================================

  public getCurrentRaceId():
    string | null {

    return this.raceId;
  }

  // ==========================================================
  // Get Race Time
  // ==========================================================

  public getRaceTime():
    number {

    return Math.max(
      0,
      this.raceTime
    );
  }

  // ==========================================================
  // Get Position
  // ==========================================================

  public getPosition():
    number {

    return this.position;
  }

  // ==========================================================
  // Set Position
  // ==========================================================

  public setPosition(
    position: number
  ): void {

    if (
      !Number.isFinite(
        position
      )
    ) {
      return;
    }

    this.position =
      Math.min(
        this.totalRacers,
        Math.max(
          1,
          Math.floor(
            position
          )
        )
      );
  }

  // ==========================================================
  // Get Total Racers
  // ==========================================================

  public getTotalRacers():
    number {

    return this.totalRacers;
  }

  // ==========================================================
  // Get Countdown
  // ==========================================================

  public getCountdownTime():
    number {

    return Math.max(
      0,
      this.countdownTimer
    );
  }

  // ==========================================================
  // Get Result
  // ==========================================================

  public getResult():
    RaceResult | null {

    if (
      !this.result
    ) {
      return null;
    }

    return {
      ...this.result
    };
  }

  // ==========================================================
  // Get State
  // ==========================================================

  public getState():
    RaceFlowState {

    return {

      phase:
        this.phase,

      raceId:
        this.raceId,

      raceTime:
        this.raceTime,

      position:
        this.position,

      totalRacers:
        this.totalRacers,

      result:
        this.result
          ? {
              ...this.result
            }
          : null
    };
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {

    this.phase =
      "idle";

    this.raceId =
      null;

    this.raceTime =
      0;

    this.position =
      0;

    this.totalRacers =
      1;

    this.countdownTimer =
      0;

    this.result =
      null;
  }
}
