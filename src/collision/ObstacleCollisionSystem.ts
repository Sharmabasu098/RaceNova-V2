/**
 * ============================================================
 * RaceNova V2
 * Obstacle Collision System
 * M8.3.x — Step 1
 * ============================================================
 *
 * Behavior:
 * - Detect obstacle collision
 * - Stop player immediately
 * - Keep player permanently stopped
 * - Hold crash state until engine handles race failure
 *
 * IMPORTANT:
 * - Automatic recovery has been REMOVED.
 * - No stun/recovery timer.
 * - RaceNovaEngine owns the final crash/result flow.
 * - reset() is still available for a fresh race.
 * ============================================================
 */

import * as THREE from "three";

import { PlayerCar } from "../player/PlayerCar";
import { ObstacleManager } from "../obstacles/ObstacleManager";

export interface ObstacleCollisionSystemConfig {
  impactStunDuration?: number;
  recoveryCooldown?: number;
  postCrashGraceDuration?: number;
}

export class ObstacleCollisionSystem {

  private readonly playerCar:
    PlayerCar;

  private readonly obstacleManager:
    ObstacleManager;

  /**
   * Kept for API compatibility.
   * M8.3.x no automatic recovery is performed.
   */
  private readonly impactStunDuration:
    number;

  /**
   * Kept for API compatibility.
   * M8.3.x no automatic recovery is performed.
   */
  private readonly recoveryCooldown:
    number;

  /**
   * Kept for API compatibility.
   * M8.3.x no automatic recovery is performed.
   */
  private readonly postCrashGraceDuration:
    number;

  private crashed =
    false;

  private readonly playerPosition =
    new THREE.Vector3();

  constructor(
    playerCar: PlayerCar,
    obstacleManager: ObstacleManager,
    config: ObstacleCollisionSystemConfig = {}
  ) {

    this.playerCar =
      playerCar;

    this.obstacleManager =
      obstacleManager;

    /*
     * Preserve the existing constructor contract.
     * These values are no longer used for automatic
     * crash recovery.
     */
    this.impactStunDuration =
      Math.max(
        0.1,
        config.impactStunDuration ?? 0.75
      );

    this.recoveryCooldown =
      Math.max(
        0.25,
        config.recoveryCooldown ?? 1.0
      );

    this.postCrashGraceDuration =
      Math.max(
        0.25,
        config.postCrashGraceDuration ?? 0.75
      );
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number
  ): void {

    if (
      deltaTime <= 0 ||
      !Number.isFinite(deltaTime)
    ) {
      return;
    }

    // =======================================================
    // PERMANENT CRASH STATE
    // =======================================================

    if (
      this.crashed
    ) {

      /*
       * The player remains permanently stopped.
       *
       * RaceNovaEngine will later detect this state
       * and perform:
       *
       * Crash
       *   ↓
       * Race Failed
       *   ↓
       * Race Result
       */
      this.playerCar.setSpeed(
        0
      );

      return;
    }

    // =======================================================
    // NORMAL COLLISION CHECK
    // =======================================================

    this.playerPosition.copy(
      this.playerCar.getPosition()
    );

    const collided =
      this.obstacleManager.checkCollision(
        this.playerPosition
      );

    if (
      !collided
    ) {
      return;
    }

    // =======================================================
    // COLLISION DETECTED
    // =======================================================

    this.crashed =
      true;

    /*
     * Stop player immediately.
     */
    this.playerCar.stop();

    /*
     * IMPORTANT:
     *
     * Do NOT clear the crash state.
     * Do NOT start a recovery timer.
     * Do NOT release the player.
     *
     * The engine will handle the final race
     * failure flow in the next M8.3.x step.
     */
  }

  // =========================================================
  // State
  // =========================================================

  public isFrozen():
    boolean {

    return this.crashed;
  }

  public hasCrashed():
    boolean {

    return this.crashed;
  }

  // =========================================================
  // Reset
  // =========================================================

  public reset(): void {

    this.crashed =
      false;

    this.obstacleManager
      .clearCrashLatch();
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {

    this.reset();
  }
}
