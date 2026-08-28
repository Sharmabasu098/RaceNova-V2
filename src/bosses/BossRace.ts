/**
 * ============================================================
 * RaceNova V2
 * Boss Race
 * M6.7.3
 * ============================================================
 *
 * M6.8:
 * Boss Unlock + Boss Difficulty
 *
 * M6.8.6:
 * Boss Race Finish Logic
 *
 * M6.9:
 * Boss Direction + Overtake Fix
 * ============================================================
 *
 * IMPORTANT:
 *
 * RaceNova forward direction = -Z
 *
 * Player:
 *   z -= speed
 *
 * Boss:
 *   z -= speed
 *
 * Therefore both vehicles travel in the
 * same forward direction.
 *
 * Boss Race flow:
 *
 *   Boss spawns ahead
 *          ↓
 *   Player chases Boss
 *          ↓
 *   Player overtakes Boss
 *          ↓
 *   Boss defeated
 *          ↓
 *   Boss despawns
 *          ↓
 *   Race continues
 *          ↓
 *   1500m reached
 *          ↓
 *   Boss Race completed
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
   * Boss spawn distance.
   *
   * Kept for configuration compatibility.
   *
   * Actual spawning is handled by BossManager.
   */
  bossSpawnDistance?: number;

  /**
   * Maximum Boss race duration.
   *
   * 0 = unlimited.
   */
  maxDuration?: number;

  /**
   * Virtual Boss race finish distance.
   *
   * 0 = unlimited.
   */
  requiredDistance?: number;

  /**
   * Distance by which Player must pass
   * the Boss before the Boss is considered
   * defeated.
   *
   * RaceNova uses -Z as forward direction.
   *
   * Player is ahead when:
   *
   *   playerZ < bossZ
   */
  bossOvertakeDistance?: number;
}

// ============================================================
// Boss Race State
// ============================================================

export interface BossRaceState {

  status:
    BossRaceStatus;

  result:
    BossRaceResult;

  raceId:
    string;

  elapsedTime:
    number;

  distance:
    number;

  bossDefeated:
    boolean;

  playerCompleted:
    boolean;
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_BOSS_SPAWN_DISTANCE =
  80;

const DEFAULT_MAX_DURATION =
  0;

const DEFAULT_REQUIRED_DISTANCE =
  1500;

/**
 * How far ahead Player must be from
 * Boss before Boss is considered passed.
 *
 * This prevents accidental defeat while
 * the cars are visually overlapping.
 */
const DEFAULT_BOSS_OVERTAKE_DISTANCE =
  5;

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

  /**
   * Stored for compatibility/documentation.
   *
   * Actual spawn position is controlled
   * by BossManager.
   */
  private readonly bossSpawnDistance:
    number;

  private readonly maxDuration:
    number;

  private readonly requiredDistance:
    number;

  private readonly bossOvertakeDistance:
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
    bossManager: BossManager,
    config: BossRaceConfig = {}
  ) {

    this.bossManager =
      bossManager;

    this.bossSpawnDistance =
      Math.max(
        10,
        Number.isFinite(
          config.bossSpawnDistance
        )
          ? config.bossSpawnDistance!
          : DEFAULT_BOSS_SPAWN_DISTANCE
      );

    this.maxDuration =
      Math.max(
        0,
        Number.isFinite(
          config.maxDuration
        )
          ? config.maxDuration!
          : DEFAULT_MAX_DURATION
      );

    this.requiredDistance =
      Math.max(
        0,
        Number.isFinite(
          config.requiredDistance
        )
          ? config.requiredDistance!
          : DEFAULT_REQUIRED_DISTANCE
      );

    this.bossOvertakeDistance =
      Math.max(
        0.5,
        Number.isFinite(
          config.bossOvertakeDistance
        )
          ? config.bossOvertakeDistance!
          : DEFAULT_BOSS_OVERTAKE_DISTANCE
      );

    /*
     * Prevent unused private configuration
     * warnings in strict TypeScript projects.
     */
    void this.bossSpawnDistance;

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

  public start(
    raceId: string,
    playerZ: number
  ): BossSpawnResult {

    // --------------------------------------------------------
    // Already active
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Invalid player position
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Reset race state
    // --------------------------------------------------------

    this.resetState();

    // --------------------------------------------------------
    // Spawn Boss
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Activate race
    // --------------------------------------------------------

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

  public update(
    deltaTime: number,
    playerX: number,
    playerZ: number,
    playerSpeed: number = 0
  ): void {

    /*
     * IMPORTANT:
     *
     * Boss race remains active AFTER Boss defeat.
     *
     * That is required because the player still
     * has to reach the 1500m virtual finish.
     */
    if (
      this.state.status !==
        "active" &&
      this.state.status !==
        "boss_defeated"
    ) {
      return;
    }

    // --------------------------------------------------------
    // Validate delta time
    // --------------------------------------------------------

    if (
      !Number.isFinite(
        deltaTime
      ) ||
      deltaTime <= 0
    ) {
      return;
    }

    // --------------------------------------------------------
    // Validate player position
    // --------------------------------------------------------

    if (
      !Number.isFinite(
        playerZ
      )
    ) {
      return;
    }

    // --------------------------------------------------------
    // Timer
    // --------------------------------------------------------

    this.state.elapsedTime +=
      deltaTime;

    // --------------------------------------------------------
    // Player Distance
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
    // Boss AI
    // --------------------------------------------------------
    //
    // Only update Boss while Boss is still active.
    //
    // Once Boss is defeated, BossManager has
    // already despawned it.
    // --------------------------------------------------------

    if (
      this.state.status ===
      "active"
    ) {

      this.bossManager.update(
        deltaTime,
        playerX,
        playerZ
      );
    }

    // --------------------------------------------------------
    // Boss Overtake Detection
    // --------------------------------------------------------
    //
    // RaceNova forward direction is -Z.
    //
    // Example:
    //
    // Boss:
    //   z = -100
    //
    // Player:
    //   z = -90
    //
    // Boss is still ahead.
    //
    // Later:
    //
    // Boss:
    //   z = -150
    //
    // Player:
    //   z = -160
    //
    // Player is now ahead.
    //
    // Therefore:
    //
    //   playerZ < bossZ
    //
    // means Player has passed Boss.
    // --------------------------------------------------------

    if (
      this.state.status ===
      "active" &&
      this.bossManager.isActive()
    ) {

      const bossPosition =
        this.bossManager
          .getPosition();

      if (
        bossPosition
      ) {

        const playerAheadOfBoss =
          playerZ <
          (
            bossPosition.z -
            this.bossOvertakeDistance
          );

        if (
          playerAheadOfBoss
        ) {

          this.defeatBoss();

          /*
           * Do NOT return here.
           *
           * The Boss is defeated, but the
           * Boss Race must continue toward
           * the 1500m virtual finish.
           */
        }
      }
    }

    // --------------------------------------------------------
    // Maximum Duration
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
    // Virtual Boss Finish
    // --------------------------------------------------------
    //
    // Boss race has a finite distance even
    // though the road itself is endless.
    //
    // Required distance:
    //
    //   1500m
    //
    // Player must defeat Boss first.
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

  public defeatBoss(): boolean {

    /*
     * Boss can only be defeated while
     * the encounter itself is active.
     */
    if (
      this.state.status !==
      "active"
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Mark Boss defeated
    // --------------------------------------------------------

    this.state.bossDefeated =
      true;

    this.state.status =
      "boss_defeated";

    this.state.result =
      "player_won";

    // --------------------------------------------------------
    // Remove Boss from world logic
    // --------------------------------------------------------

    this.bossManager.despawn();

    return true;
  }

  // ==========================================================
  // Complete Boss Race
  // ==========================================================

  public complete(): boolean {

    /*
     * Completion is allowed:
     *
     * active
     * OR
     * boss_defeated
     */
    if (
      this.state.status !==
        "active" &&
      this.state.status !==
        "boss_defeated"
    ) {

      return false;
    }

    // --------------------------------------------------------
    // Boss must have been defeated
    // --------------------------------------------------------

    if (
      !this.state.bossDefeated
    ) {
      return false;
    }

    // --------------------------------------------------------
    // Mark Player completed
    // --------------------------------------------------------

    this.state.playerCompleted =
      true;

    this.state.status =
      "completed";

    this.state.result =
      "player_won";

    // --------------------------------------------------------
    // Safety despawn
    // --------------------------------------------------------

    this.bossManager.despawn();

    return true;
  }

  // ==========================================================
  // Fail
  // ==========================================================

  public fail(): boolean {

    if (
      this.state.status !==
        "active" &&
      this.state.status !==
        "boss_defeated"
    ) {

      return false;
    }

    /*
     * If Boss was already defeated,
     * a generic failure should not erase
     * the Boss victory state unless the
     * race is actually configured to fail.
     */
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

  public bossWins(): boolean {

    if (
      this.state.status !==
      "active"
    ) {
      return false;
    }

    /*
     * Boss reached the virtual finish
     * before Player defeated it.
     */
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

    /*
     * IMPORTANT:
     *
     * boss_defeated is still considered
     * an active Boss Race encounter because
     * Player must continue toward 1500m.
     */
    return (
      this.state.status ===
        "active" ||
      this.state.status ===
        "boss_defeated"
    );
  }

  // ==========================================================
  // Is Boss Defeated
  // ==========================================================

  public isBossDefeated(): boolean {

    return this.state.bossDefeated;
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
  // Get Required Distance
  // ==========================================================

  public getRequiredDistance(): number {

    return this.requiredDistance;
  }

  // ==========================================================
  // Get Boss Overtake Distance
  // ==========================================================

  public getBossOvertakeDistance(): number {

    return this.bossOvertakeDistance;
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

    this.state.raceId =
      "";

    this.state.elapsedTime =
      0;

    this.state.distance =
      0;

    this.state.bossDefeated =
      false;

    this.state.playerCompleted =
      false;

    this.bossManager.dispose();
  }
}
