/**
 * ============================================================
 * RaceNova V2
 * Boss Manager
 * M6.7.2
 * ============================================================
 *
 * Responsibilities:
 * - Manage the active Boss
 * - Spawn Boss
 * - Update Boss AI
 * - Despawn Boss
 * - Track Boss position
 * - Track Boss active state
 * - Provide Boss state to gameplay systems
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No RaceProgression dependency
 *
 * M6.7.1:
 * BossAI
 *
 * M6.7.2:
 * Boss Manager
 *
 * M6.7.3:
 * Boss Race
 * ============================================================
 */

import {
  BossAI,
  type BossAIConfig,
  type BossAIState
} from "./BossAI";

// ============================================================
// Boss Manager Configuration
// ============================================================

export interface BossManagerConfig {

  /**
   * Default Boss spawn lane.
   *
   * RaceNova:
   * 0 = left
   * 1 = center
   * 2 = right
   */
  spawnLane?: number;

  /**
   * Distance ahead of player
   * where Boss is spawned.
   */
  spawnDistance?: number;

  /**
   * Boss AI configuration.
   */
  ai?: BossAIConfig;
}

// ============================================================
// Boss Spawn Result
// ============================================================

export interface BossSpawnResult {

  success: boolean;

  lane: number;

  z: number;

  reason:
    | "spawned"
    | "already_active"
    | "invalid_position";
}

// ============================================================
// Boss Manager
// ============================================================

export class BossManager {

  // ==========================================================
  // Boss AI
  // ==========================================================

  private readonly bossAI:
    BossAI;

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly spawnLane:
    number;

  private readonly spawnDistance:
    number;

  // ==========================================================
  // Active State
  // ==========================================================

  private active:
    boolean = false;

  // ==========================================================
  // Boss Race ID
  // ==========================================================

  private bossRaceId:
    string = "";

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    config:
      BossManagerConfig = {}
  ) {

    this.spawnLane =
      Number.isFinite(
        config.spawnLane
      )
        ? Math.max(
            0,
            Math.floor(
              config.spawnLane as number
            )
          )
        : 1;

    this.spawnDistance =
      Number.isFinite(
        config.spawnDistance
      )
        ? Math.max(
            10,
            config.spawnDistance as number
          )
        : 80;

    this.bossAI =
      new BossAI(
        this.spawnLane,
        -this.spawnDistance,
        config.ai
      );
  }

  // ==========================================================
  // Spawn Boss
  // ==========================================================

  /**
   * Spawns the Boss relative to the player.
   */
  public spawn(
    playerZ: number,
    bossRaceId: string = ""
  ): BossSpawnResult {

    if (
      this.active
    ) {

      return {

        success:
          false,

        lane:
          this.bossAI
            .getCurrentLane(),

        z:
          this.bossAI
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
          this.bossAI
            .getCurrentLane(),

        z:
          this.bossAI
            .getZ(),

        reason:
          "invalid_position"
      };
    }

    const spawnZ =
      playerZ -
      this.spawnDistance;

    this.bossRaceId =
      bossRaceId;

    this.bossAI.reset(
      this.spawnLane,
      spawnZ
    );

    this.active =
      true;

    return {

      success:
        true,

      lane:
        this.bossAI
          .getCurrentLane(),

      z:
        this.bossAI
          .getZ(),

      reason:
        "spawned"
    };
  }

  // ==========================================================
  // Spawn At Position
  // ==========================================================

  /**
   * Spawns Boss at an explicit
   * world position.
   */
  public spawnAt(
    lane: number,
    z: number,
    bossRaceId: string = ""
  ): BossSpawnResult {

    if (
      this.active
    ) {

      return {

        success:
          false,

        lane:
          this.bossAI
            .getCurrentLane(),

        z:
          this.bossAI
            .getZ(),

        reason:
          "already_active"
      };
    }

    if (
      !Number.isFinite(z)
    ) {

      return {

        success:
          false,

        lane:
          this.bossAI
            .getCurrentLane(),

        z:
          this.bossAI
            .getZ(),

        reason:
          "invalid_position"
      };
    }

    this.bossRaceId =
      bossRaceId;

    this.bossAI.reset(
      lane,
      z
    );

    this.active =
      true;

    return {

      success:
        true,

      lane:
        this.bossAI
          .getCurrentLane(),

      z:
        this.bossAI
          .getZ(),

      reason:
        "spawned"
    };
  }

  // ==========================================================
  // Update
  // ==========================================================

  /**
   * Updates the active Boss.
   *
   * Player position is optional so the
   * manager remains safe before gameplay
   * integration.
   */
  public update(
    deltaTime: number,
    playerX?: number,
    playerZ?: number
  ): void {

    if (
      !this.active
    ) {
      return;
    }

    this.bossAI.update(
      deltaTime,
      playerX,
      playerZ
    );
  }

  // ==========================================================
  // Despawn
  // ==========================================================

  /**
   * Removes the active Boss from gameplay.
   */
  public despawn(): void {

    this.active =
      false;

    this.bossRaceId =
      "";

    this.bossAI.reset(
      this.spawnLane,
      -this.spawnDistance
    );
  }

  // ==========================================================
  // Is Active
  // ==========================================================

  public isActive(): boolean {

    return this.active;
  }

  // ==========================================================
  // Get Boss AI
  // ==========================================================

  public getAI():
    BossAI {

    return this.bossAI;
  }

  // ==========================================================
  // Get Boss State
  // ==========================================================

  public getState():
    BossAIState | null {

    if (
      !this.active
    ) {
      return null;
    }

    return this.bossAI.getState();
  }

  // ==========================================================
  // Get Boss Race ID
  // ==========================================================

  public getBossRaceId(): string {

    return this.bossRaceId;
  }

  // ==========================================================
  // Get Position
  // ==========================================================

  public getPosition(): {
    x: number;
    z: number;
  } | null {

    if (
      !this.active
    ) {
      return null;
    }

    return {

      x:
        this.bossAI.getX(),

      z:
        this.bossAI.getZ()
    };
  }

  // ==========================================================
  // Get X
  // ==========================================================

  public getX(): number {

    return this.bossAI.getX();
  }

  // ==========================================================
  // Get Z
  // ==========================================================

  public getZ(): number {

    return this.bossAI.getZ();
  }

  // ==========================================================
  // Get Speed
  // ==========================================================

  public getSpeed(): number {

    return this.bossAI.getSpeed();
  }

  // ==========================================================
  // Get Current Lane
  // ==========================================================

  public getCurrentLane(): number {

    return this.bossAI
      .getCurrentLane();
  }

  // ==========================================================
  // Get Target Lane
  // ==========================================================

  public getTargetLane(): number {

    return this.bossAI
      .getTargetLane();
  }

  // ==========================================================
  // Is Pursuing
  // ==========================================================

  public isPursuing(): boolean {

    return this.bossAI
      .isPursuing();
  }

  // ==========================================================
  // Force Lane
  // ==========================================================

  public forceLane(
    lane: number
  ): void {

    if (
      !this.active
    ) {
      return;
    }

    this.bossAI.forceLane(
      lane
    );
  }

  // ==========================================================
  // Set Target Lane
  // ==========================================================

  public setTargetLane(
    lane: number
  ): boolean {

    if (
      !this.active
    ) {
      return false;
    }

    return this.bossAI
      .setTargetLane(
        lane
      );
  }

  // ==========================================================
  // Set Speed
  // ==========================================================

  public setSpeed(
    speed: number
  ): void {

    if (
      !this.active
    ) {
      return;
    }

    this.bossAI.setSpeed(
      speed
    );
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {

    this.active =
      false;

    this.bossRaceId =
      "";

    this.bossAI.reset(
      this.spawnLane,
      -this.spawnDistance
    );
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  public dispose(): void {

    this.active =
      false;

    this.bossRaceId =
      "";

    this.bossAI.dispose();
  }
}
