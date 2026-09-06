/**
 * ============================================================
 * RaceNova V2
 * Obstacle Collision System
 * M7.9.4
 * ============================================================
 *
 * Responsibilities:
 * - Detect obstacle collision
 * - Immediately stop PlayerCar
 * - Cancel nitro through PlayerCar.stop()
 * - Keep player permanently stopped after crash
 * - Prevent automatic re-acceleration
 * - Preserve ObstacleManager crash latch
 *
 * IMPORTANT:
 * - Crash remains latched until reset.
 * - No traffic collision modification.
 * - No audio dependency.
 * - No economy dependency.
 * ============================================================
 */

import * as THREE from "three";

import { PlayerCar } from "../player/PlayerCar";
import { ObstacleManager } from "../obstacles/ObstacleManager";

export interface ObstacleCollisionSystemConfig {
  impactStunDuration?: number;
}

export class ObstacleCollisionSystem {

  private readonly playerCar:
    PlayerCar;

  private readonly obstacleManager:
    ObstacleManager;

  private readonly impactStunDuration:
    number;

  private stunTimer =
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
    // Already crashed
    // =======================================================

    if (
      this.crashed
    ) {

      if (
        this.stunTimer > 0
      ) {

        this.stunTimer =
          Math.max(
            0,
            this.stunTimer -
              deltaTime
          );
      }

      /*
       * IMPORTANT:
       *
       * Never allow PlayerCar.update()
       * to rebuild speed after collision.
       *
       * Crash remains latched until reset.
       */
      this.playerCar.setSpeed(
        0
      );

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
    // Crash Response
    // =======================================================

    this.crashed =
      true;

    this.stunTimer =
      this.impactStunDuration;

    /*
     * Immediate hard stop.
     *
     * PlayerCar.stop() also cancels
     * nitro and hides nitro effect.
     */
    this.playerCar.stop();
  }

  // =========================================================
  // State
  // =========================================================

  public isFrozen():
    boolean {

    /*
     * Once obstacle collision happens,
     * player movement remains blocked.
     */
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
