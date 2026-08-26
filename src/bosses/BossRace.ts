/**
 * ============================================================
 * RaceNova V2
 * Boss Race
 * M6.7.3
 * ============================================================
 *
 * Responsibilities:
 * - Control Boss race encounter state
 * - Start Boss race
 * - Track Boss race progress
 * - Detect Boss defeat
 * - Detect Boss race completion
 * - Handle Boss race failure
 * - Provide safe Boss race state
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No UI dependency
 *
 * M6.7.1:
 * BossAI
 *
 * M6.7.2:
 * BossManager
 *
 * M6.7.3:
 * Boss Race
 *
 * M6.8:
 * Boss Unlock + Boss Difficulty
 * ============================================================
 */

import {
  BossManager,
  type BossSpawnResult
} from "./BossManager";

// ============================================================
// Boss Race Status
// ============================================================

export type BossRaceStatus =
  | "idle"
  | "active"
  | "boss_defeated"
  | "completed"
  | "failed";

// ============================================================
// Boss Race Result
// ============================================================

export type BossRaceResult =
  | "none"
  | "player_won"
  | "boss_won"
  | "player_failed";

// ============================================================
// Boss Race Configuration
// ============================================================

export interface BossRaceConfig {

  /**
   * Distance between player and Boss
   * when the encounter starts.
   */
  bossSpawnDistance?: number;

  /**
   * Maximum Boss race duration.
   *
   * 0 = unlimited.
   */
  maxDuration?: number;

  /**
   * Required progress/distance for
   * completing the Boss encounter.
   *
   * 0 = no distance requirement.
   */
  requiredDistance?: number;
}

// ============================================================
// Boss Race State
// ============================================================

export interface BossRaceState {

  /**
   * Current Boss race status.
   */
  status: BossRaceStatus;

  /**
   * Final result.
   */
  result: BossRaceResult;

  /**
   * Boss race ID.
   */
  raceId: string;

  /**
   * Elapsed race time.
   */
  elapsedTime: number;

  /**
   * Distance travelled during
   * Boss encounter.
   */
  distance: number;

  /**
   * Whether Boss has been defeated.
   */
  bossDefeated: boolean;

  /**
   * Whether player has completed
   * the Boss encounter.
   */
  playerCompleted: boolean;
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_BOSS_SPAWN_DISTANCE =
  80;

const DEFAULT_MAX_DURATION =
  0;

const DEFAULT_REQUIRED_DISTANCE =
  0;

// ============================================================
// Boss Race
// ============================================================

export class BossRace {

  // ==========================================================
  // Boss Manager
  // ==========================================================

  private readonly bossManager:
    BossManager;

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly bossSpawnDistance:
    number;

  private readonly maxDuration:
    number;

  private readonly requiredDistance:
    number;

  // ==========================================================
  // State
  // ==========================================================

  private state:
    BossRaceState;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    bossManager:
      BossManager,

    config:
      BossRaceConfig = {}
  ) {

    this.bossManager =
      bossManager;

    this.bossSpawnDistance =
      Math.max(
        10,
        Number.isFinite(
          config.bossSpawnDistance
        )
          ? config.bossSpawnDistance as number
          : DEFAULT_BOSS_SPAWN_DISTANCE
      );

    this.maxDuration =
      Math.max(
        0,
        Number.isFinite(
          config.maxDuration
        )
          ? config.maxDuration as number
          : DEFAULT_MAX_DURATION
      );

    this.requiredDistance =
      Math.max(
        0,
        Number.isFinite(
          config.requiredDistance
        )
          ? config.requiredDistance as number
          : DEFAULT_REQUIRED_DISTANCE
      );

    this.state = {

      status:
        "idle",

      result:
        "none",

      raceId:
        "",

      elapsedTime:
        0,

      distance:
        0,

      bossDefeated:
        false,

      playerCompleted:
        false
    };
  }

  // ==========================================================
  // Start Race
  // ==========================================================

  /**
   * Starts a Boss race.
   *
   * Boss is spawned relative to
   * the player's current Z position.
   */
  public start(
    raceId: string,
    playerZ: number
  ): BossSpawnResult {

    if (
      this.state.status ===
        "active"
    ) {

      return {

        success:
          false,

        lane:
          this.bossManager
            .getCurrentLane(),

        z:
          this.bossManager
            .getZ(),

        reason:
          "already_active"
      };
    }

    if (
      !Number.isFinite(
        playerZ
      )
    ) {

      return {

        success:
          false,

        lane:
          this.bossManager
            .getCurrentLane(),

        z:
          this.bossManager
            .getZ(),

        reason:
          "invalid_position"
      };
    }

    this.resetState();

    const spawnResult =
      this.bossManager.spawn(
        playerZ,
        raceId
      );

    if (
      !spawnResult.success
    ) {
      return spawnResult;
    }

    this.state.status =
      "active";

    this.state.result =
      "none";

    this.state.raceId =
      raceId;

    return spawnResult;
  }

  // ==========================================================
// Update
// ==========================================================

/**
 * Updates the active Boss race.
 *
 * playerX / playerZ:
 * current player position.
 *
 * playerSpeed:
 * current player speed in km/h.
 */
public update(
  deltaTime: number,
  playerX: number,
  playerZ: number,
  playerSpeed: number = 0
): void {

  if (
    this.state.status !==
      "active"
  ) {
    return;
  }

  if (
    !Number.isFinite(
      deltaTime
    ) ||
    deltaTime <= 0
  ) {
    return;
  }

  // --------------------------------------------------------
  // Update Timer
  // --------------------------------------------------------

  this.state.elapsedTime +=
    deltaTime;

  // --------------------------------------------------------
  // Update Distance
  // --------------------------------------------------------

  if (
    Number.isFinite(
      playerSpeed
    ) &&
    playerSpeed > 0
  ) {

    this.state.distance +=
      (playerSpeed / 3.6) *
      deltaTime;
  }

  // --------------------------------------------------------
  // Update Boss AI
  // --------------------------------------------------------

  this.bossManager.update(
    deltaTime,
    playerX,
    playerZ
  );

  // --------------------------------------------------------
  // Duration Failure
  // --------------------------------------------------------

  if (
    this.maxDuration > 0 &&
    this.state.elapsedTime >=
      this.maxDuration
  ) {

    this.fail();

    return;
  }

  // --------------------------------------------------------
  // M6.8.6 — Boss Race Virtual Finish
  // --------------------------------------------------------
  // Endless road continues indefinitely.
  // Boss encounter has its own virtual finish.
  //
  // Boss must be defeated before the
  // 1500m Boss race can be completed.
  // --------------------------------------------------------

  if (
    this.requiredDistance > 0 &&
    this.state.distance >=
      this.requiredDistance
  ) {

    if (
      this.state.bossDefeated
    ) {

      this.complete();

    } else {

      this.bossWins();
    }

    return;
  }
}

  // ==========================================================
  // Defeat Boss
  // ==========================================================

  /**
   * Marks the Boss as defeated.
   *
   * This does not directly modify
   * RaceProgressionState.
   *
   * M6.8/M6.9 will connect progression
   * and persistence.
   */
  public defeatBoss(): boolean {

    if (
      this.state.status !==
        "active"
    ) {
      return false;
    }

    this.state.bossDefeated =
      true;

    this.state.status =
      "boss_defeated";

    this.state.result =
      "player_won";

    this.bossManager.despawn();

    return true;
  }

  // ==========================================================
  // Complete
  // ==========================================================

  /**
   * Completes the Boss race.
   */
  public complete(): boolean {

    if (
      this.state.status !==
        "active" &&
      this.state.status !==
        "boss_defeated"
    ) {
      return false;
    }

    this.state.playerCompleted =
      true;

    this.state.status =
      "completed";

    if (
      this.state.bossDefeated
    ) {

      this.state.result =
        "player_won";

    } else {

      this.state.result =
        "player_won";
    }

    this.bossManager.despawn();

    return true;
  }

  // ==========================================================
  // Fail
  // ==========================================================

  /**
   * Fails the Boss race.
   */
  public fail(): boolean {

    if (
      this.state.status !==
        "active"
    ) {
      return false;
    }

    this.state.status =
      "failed";

    this.state.result =
      "player_failed";

    this.bossManager.despawn();

    return true;
  }

  // ==========================================================
  // Boss Wins
  // ==========================================================

  /**
   * Marks the Boss as having won
   * the encounter.
   */
  public bossWins(): boolean {

    if (
      this.state.status !==
        "active"
    ) {
      return false;
    }

    this.state.status =
      "failed";

    this.state.result =
      "boss_won";

    this.bossManager.despawn();

    return true;
  }

  // ==========================================================
  // Is Active
  // ==========================================================

  public isActive(): boolean {

    return (
      this.state.status ===
      "active"
    );
  }

  // ==========================================================
  // Is Boss Defeated
  // ==========================================================

  public isBossDefeated(): boolean {

    return (
      this.state.bossDefeated
    );
  }

  // ==========================================================
  // Is Completed
  // ==========================================================

  public isCompleted(): boolean {

    return (
      this.state.status ===
      "completed"
    );
  }

  // ==========================================================
  // Is Failed
  // ==========================================================

  public isFailed(): boolean {

    return (
      this.state.status ===
      "failed"
    );
  }

  // ==========================================================
  // Get Status
  // ==========================================================

  public getStatus():
    BossRaceStatus {

    return this.state.status;
  }

  // ==========================================================
  // Get Result
  // ==========================================================

  public getResult():
    BossRaceResult {

    return this.state.result;
  }

  // ==========================================================
  // Get Race ID
  // ==========================================================

  public getRaceId(): string {

    return this.state.raceId;
  }

  // ==========================================================
  // Get Elapsed Time
  // ==========================================================

  public getElapsedTime(): number {

    return this.state.elapsedTime;
  }

  // ==========================================================
  // Get Distance
  // ==========================================================

  public getDistance(): number {

    return this.state.distance;
  }

  // ==========================================================
  // Get Boss Manager
  // ==========================================================

  public getBossManager():
    BossManager {

    return this.bossManager;
  }

  // ==========================================================
  // Get State
  // ==========================================================

  public getState():
    BossRaceState {

    return {
      ...this.state
    };
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {

    this.state = {

      status:
        "idle",

      result:
        "none",

      raceId:
        "",

      elapsedTime:
        0,

      distance:
        0,

      bossDefeated:
        false,

      playerCompleted:
        false
    };

    this.bossManager.reset();
  }

  // ==========================================================
  // Reset State
  // ==========================================================

  private resetState(): void {

    this.state = {

      status:
        "idle",

      result:
        "none",

      raceId:
        "",

      elapsedTime:
        0,

      distance:
        0,

      bossDefeated:
        false,

      playerCompleted:
        false
    };
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  public dispose(): void {

    this.state.status =
      "idle";

    this.state.result =
      "none";

    this.bossManager.dispose();
  }
}
