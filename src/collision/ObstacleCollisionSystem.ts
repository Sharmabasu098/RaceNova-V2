/**
 * ============================================================
 * RaceNova V2
 * Obstacle Collision System
 * M7.9.5
 * ============================================================
 *
 * Behavior:
 * - Detect obstacle collision
 * - Stop player immediately
 * - Hold player briefly
 * - Recover automatically
 * - Allow the race to continue
 * - Prevent instant repeated collision
 *
 * ============================================================
 */

import * as THREE from "three";

import { PlayerCar } from "../player/PlayerCar";
import { ObstacleManager } from "../obstacles/ObstacleManager";

export interface ObstacleCollisionSystemConfig {
  impactStunDuration?: number;
  recoveryCooldown?: number;
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

  private stunTimer =
    0;

  private recoveryTimer =
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
    // Crash / Recovery State
    // =======================================================

    if (
      this.crashed
    ) {

      this.playerCar.setSpeed(
        0
      );

      // -----------------------------------------------------
      // Impact stun
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // Recovery cooldown
      // -----------------------------------------------------

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

      // -----------------------------------------------------
      // Recovery complete
      // -----------------------------------------------------

      this.crashed =
        false;

      /*
       * Do NOT clear the obstacle latch here.
       *
       * The player may still overlap the obstacle.
       * ObstacleManager will clear its latch when
       * its normal reset/recycle lifecycle requires it.
       */
      return;
    }

    // =======================================================
    // Collision Detection
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
    // Crash
    // =======================================================

    this.crashed =
      true;

    this.stunTimer =
      this.impactStunDuration;

    this.recoveryTimer =
      this.recoveryCooldown;

    /*
     * Immediate hard stop.
     *
     * PlayerCar.stop():
     * - speed -> 0
     * - nitro -> off
     * - nitro effect -> off
     */
    this.playerCar.stop();
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

    this.stunTimer =
      0;

    this.recoveryTimer =
      0;

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
