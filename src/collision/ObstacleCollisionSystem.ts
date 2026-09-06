/**
 * ============================================================
 * RaceNova V2
 * Obstacle Collision System
 * M7.9.6
 * ============================================================
 *
 * Behavior:
 * - Detect obstacle collision
 * - Stop player immediately
 * - Hold player briefly
 * - Recover automatically
 * - Allow the race to continue
 * - Prevent the same obstacle from re-triggering instantly
 * - Re-enable collision for later obstacles
 *
 * IMPORTANT:
 * - Recovery clears the manager latch only when the car is
 *   released from the crash state.
 * - A short post-crash grace window gives the car time to move
 *   completely away from the obstacle before collision checks
 *   resume.
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

  private readonly impactStunDuration:
    number;

  private readonly recoveryCooldown:
    number;

  private readonly postCrashGraceDuration:
    number;

  private stunTimer =
    0;

  private recoveryTimer =
    0;

  private postCrashGraceTimer =
    0;

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

  /**
   * ==========================================================
   * Update
   * ==========================================================
   */

  public update(
    deltaTime: number
  ): void {

    if (
      deltaTime <= 0 ||
      !Number.isFinite(deltaTime)
    ) {
      return;
    }

    /**
     * --------------------------------------------------------
     * CRASH STATE
     * --------------------------------------------------------
     */

    if (
      this.crashed
    ) {

      /*
       * Keep the player stopped while the crash
       * stun/recovery sequence is active.
       */
      this.playerCar.setSpeed(
        0
      );

      /**
       * Impact stun
       */
      if (
        this.stunTimer > 0
      ) {

        this.stunTimer =
          Math.max(
            0,
            this.stunTimer -
              deltaTime
          );

        return;
      }

      /**
       * Recovery cooldown
       */
      if (
        this.recoveryTimer > 0
      ) {

        this.recoveryTimer =
          Math.max(
            0,
            this.recoveryTimer -
              deltaTime
          );

        return;
      }

      /**
       * ------------------------------------------------------
       * CRASH COMPLETE
       * ------------------------------------------------------
       *
       * Release player from frozen state.
       *
       * IMPORTANT:
       * Clear ObstacleManager crash latch here so future
       * obstacles can trigger collisions again.
       */

      this.crashed =
        false;

      this.obstacleManager
        .clearCrashLatch();

      /**
       * Give the player a short grace period.
       *
       * This prevents the exact same obstacle from causing
       * an immediate second collision if the car is still
       * overlapping it.
       */

      this.postCrashGraceTimer =
        this.postCrashGraceDuration;

      return;
    }

    /**
     * --------------------------------------------------------
     * POST-CRASH GRACE PERIOD
     * --------------------------------------------------------
     *
     * Collision checks are temporarily disabled.
     */

    if (
      this.postCrashGraceTimer > 0
    ) {

      this.postCrashGraceTimer =
        Math.max(
          0,
          this.postCrashGraceTimer -
            deltaTime
        );

      return;
    }

    /**
     * --------------------------------------------------------
     * NORMAL COLLISION CHECK
     * --------------------------------------------------------
     */

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

    /**
     * --------------------------------------------------------
     * COLLISION DETECTED
     * --------------------------------------------------------
     */

    this.crashed =
      true;

    this.stunTimer =
      this.impactStunDuration;

    this.recoveryTimer =
      this.recoveryCooldown;

    this.postCrashGraceTimer =
      0;

    /**
     * Immediately stop player.
     */
    this.playerCar.stop();
  }

  /**
   * ==========================================================
   * State
   * ==========================================================
   */

  public isFrozen():
    boolean {

    return this.crashed;
  }

  public hasCrashed():
    boolean {

    return this.crashed;
  }

  /**
   * ==========================================================
   * Reset
   * ==========================================================
   */

  public reset(): void {

    this.stunTimer =
      0;

    this.recoveryTimer =
      0;

    this.postCrashGraceTimer =
      0;

    this.crashed =
      false;

    this.obstacleManager
      .clearCrashLatch();
  }

  /**
   * ==========================================================
   * Dispose
   * ==========================================================
   */

  public dispose(): void {

    this.reset();
  }
}
