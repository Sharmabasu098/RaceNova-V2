/**
 * ============================================================
 * RaceNova V2
 * Obstacle Collision System
 * M7.9.3
 * ============================================================
 *
 * Responsibilities:
 * - Consume ObstacleManager collision detection
 * - Apply a real crash stop to PlayerCar
 * - Hold player at zero speed during impact
 * - Prevent immediate re-acceleration
 * - Preserve existing ObstacleManager collision latch
 *
 * IMPORTANT:
 * - No audio dependency
 * - No economy dependency
 * - No traffic-system modification
 * ============================================================
 */

import * as THREE from "three";

import { PlayerCar } from "../player/PlayerCar";
import { ObstacleManager } from "../obstacles/ObstacleManager";

export interface ObstacleCollisionSystemConfig {
  /**
   * How long the player remains stopped
   * after hitting an obstacle.
   */
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

    // -------------------------------------------------------
    // Active crash stun
    // -------------------------------------------------------

    if (
      this.stunTimer > 0
    ) {

      this.stunTimer =
        Math.max(
          0,
          this.stunTimer -
            deltaTime
        );

      /*
       * Hard hold at zero.
       *
       * This is the important part:
       * PlayerCar cannot accelerate again
       * while the crash stun is active.
       */
      this.playerCar.setSpeed(
        0
      );

      if (
        this.stunTimer > 0
      ) {
        return;
      }

      // Impact finished.
      this.crashed =
        false;

      return;
    }

    // -------------------------------------------------------
    // Collision detection
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // Crash response
    // -------------------------------------------------------

    this.crashed =
      true;

    this.stunTimer =
      this.impactStunDuration;

    /*
     * Immediate hard stop.
     */
    this.playerCar.stop();
  }

  // =========================================================
  // State
  // =========================================================

  public isFrozen():
    boolean {

    return (
      this.stunTimer > 0
    );
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
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {

    this.reset();
  }
}
