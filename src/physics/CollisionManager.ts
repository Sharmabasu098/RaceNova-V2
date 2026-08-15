import * as THREE from "three";

import { PlayerCar } from "../player/PlayerCar";
import { TrafficManager } from "../traffic/TrafficManager";

export interface CollisionManagerConfig {
  /**
   * Collision detection width.
   *
   * Slightly smaller than the visual car width
   * to avoid unfair side collisions.
   */
  playerWidth?: number;

  /**
   * Collision detection length.
   */
  playerLength?: number;

  /**
   * Minimum player speed after collision.
   *
   * Prevents the player from becoming completely
   * stuck after a light collision.
   */
  minimumCollisionSpeed?: number;

  /**
   * Speed multiplier applied to the player
   * after a traffic collision.
   *
   * Example:
   * 0.35 = player keeps 35% of current speed.
   */
  collisionSpeedMultiplier?: number;

  /**
   * Cooldown after a collision.
   *
   * Prevents the same traffic car from triggering
   * collision every frame.
   */
  collisionCooldown?: number;

  /**
   * If true, collision is reported only once
   * until the player separates from traffic.
   */
  singleHitPerContact?: boolean;
}

export class CollisionManager {
  private readonly player: PlayerCar;
  private readonly trafficManager: TrafficManager;

  // =========================================================
  // Collision Configuration
  // =========================================================

  private readonly playerWidth: number;
  private readonly playerLength: number;

  private readonly minimumCollisionSpeed: number;

  private readonly collisionSpeedMultiplier: number;

  private readonly collisionCooldown: number;

  private readonly singleHitPerContact: boolean;

  // =========================================================
  // Collision State
  // =========================================================

  private collisionTimer = 0;

  private readonly hitTrafficCars =
    new Set<object>();

  private crashed = false;

  // =========================================================
  // Temporary vectors
  // =========================================================

  private readonly playerPosition =
    new THREE.Vector3();

  private readonly trafficPosition =
    new THREE.Vector3();

  constructor(
    player: PlayerCar,
    trafficManager: TrafficManager,
    config: CollisionManagerConfig = {}
  ) {
    this.player = player;
    this.trafficManager = trafficManager;

    // =====================================================
    // Collision dimensions
    // =====================================================

    this.playerWidth =
      Math.max(
        0.1,
        config.playerWidth ?? 1.9
      );

    this.playerLength =
      Math.max(
        0.1,
        config.playerLength ?? 3.8
      );

    // =====================================================
    // Collision response
    // =====================================================

    this.minimumCollisionSpeed =
      Math.max(
        0,
        config.minimumCollisionSpeed ?? 12
      );

    this.collisionSpeedMultiplier =
      THREE.MathUtils.clamp(
        config.collisionSpeedMultiplier ?? 0.35,
        0,
        1
      );

    this.collisionCooldown =
      Math.max(
        0,
        config.collisionCooldown ?? 0.35
      );

    this.singleHitPerContact =
      config.singleHitPerContact ?? true;
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
    // Collision cooldown
    // -------------------------------------------------------

    if (
      this.collisionTimer > 0
    ) {
      this.collisionTimer =
        Math.max(
          0,
          this.collisionTimer -
            deltaTime
        );
    }

    // -------------------------------------------------------
    // Player position
    // -------------------------------------------------------

    const playerPosition =
      this.player.getPosition();

    this.playerPosition.copy(
      playerPosition
    );

    // -------------------------------------------------------
    // Active traffic
    // -------------------------------------------------------

    const trafficCars =
      this.trafficManager.getTrafficCars();

    /*
     * Track cars currently touching
     * the player.
     */
    const currentlyColliding =
      new Set<object>();

    for (
      const trafficCar
      of trafficCars
    ) {
      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      const trafficCarObject =
        trafficCar as object;

      const trafficPosition =
        trafficCar.getPosition();

      this.trafficPosition.copy(
        trafficPosition
      );

      if (
        !this.isColliding(
          this.playerPosition,
          this.trafficPosition
        )
      ) {
        continue;
      }

      currentlyColliding.add(
        trafficCarObject
      );

      // -----------------------------------------------------
      // Prevent repeated hits
      // -----------------------------------------------------

      if (
        this.singleHitPerContact &&
        this.hitTrafficCars.has(
          trafficCarObject
        )
      ) {
        continue;
      }

      // -----------------------------------------------------
      // Global collision cooldown
      // -----------------------------------------------------

      if (
        this.collisionTimer > 0
      ) {
        continue;
      }

      // -----------------------------------------------------
      // Collision response
      // -----------------------------------------------------

      this.handleTrafficCollision();

      this.hitTrafficCars.add(
        trafficCarObject
      );

      this.collisionTimer =
        this.collisionCooldown;

      /*
       * One collision response per frame/update.
       */
      break;
    }

    // -------------------------------------------------------
    // Clear separated traffic cars
    // -------------------------------------------------------

    if (
      this.singleHitPerContact
    ) {
      for (
        const hitCar
        of this.hitTrafficCars
      ) {
        if (
          !currentlyColliding.has(
            hitCar
          )
        ) {
          this.hitTrafficCars.delete(
            hitCar
          );
        }
      }
    }
  }

  // =========================================================
  // Collision Detection
  // =========================================================

  private isColliding(
    playerPosition: THREE.Vector3,
    trafficPosition: THREE.Vector3
  ): boolean {
    /*
     * Traffic car dimensions:
     *
     * Width  ≈ 2.2
     * Length ≈ 4.2
     *
     * Player car uses the same base dimensions.
     *
     * We use half-extents and a slightly
     * forgiving collision box.
     */

    const trafficWidth =
      2.2;

    const trafficLength =
      4.2;

    const playerHalfWidth =
      this.playerWidth / 2;

    const playerHalfLength =
      this.playerLength / 2;

    const trafficHalfWidth =
      trafficWidth / 2;

    const trafficHalfLength =
      trafficLength / 2;

    const deltaX =
      Math.abs(
        playerPosition.x -
          trafficPosition.x
      );

    const deltaZ =
      Math.abs(
        playerPosition.z -
          trafficPosition.z
      );

    /*
     * AABB overlap test.
     */
    const overlapX =
      deltaX <
      playerHalfWidth +
        trafficHalfWidth;

    const overlapZ =
      deltaZ <
      playerHalfLength +
        trafficHalfLength;

    return (
      overlapX &&
      overlapZ
    );
  }

  // =========================================================
  // Traffic Collision Response
  // =========================================================

  private handleTrafficCollision(): void {
    const currentSpeed =
      this.player.getSpeed();

    /*
     * Do not create a collision effect
     * when the player is completely stopped.
     */
    if (
      currentSpeed <= 0
    ) {
      return;
    }

    // -------------------------------------------------------
    // Nitro cancellation
    // -------------------------------------------------------

    /*
     * Traffic collision immediately cancels
     * active Nitro.
     */
    if (
      this.player.isNitroActive()
    ) {
      this.player.stop();

      /*
       * Give the player a small residual
       * speed after the crash.
       */
      this.player.setSpeed(
        Math.min(
          this.minimumCollisionSpeed,
          this.player.getMaxSpeed()
        )
      );

      return;
    }

    // -------------------------------------------------------
    // Normal collision slowdown
    // -------------------------------------------------------

    const reducedSpeed =
      Math.max(
        this.minimumCollisionSpeed,
        currentSpeed *
          this.collisionSpeedMultiplier
      );

    this.player.setSpeed(
      Math.min(
        reducedSpeed,
        this.player.getHardSpeedCap()
      )
    );
  }

  // =========================================================
  // Collision State
  // =========================================================

  public isCrashed(): boolean {
    return this.crashed;
  }

  public setCrashed(
    crashed: boolean
  ): void {
    this.crashed =
      crashed;
  }

  // =========================================================
  // Reset
  // =========================================================

  public reset(): void {
    this.collisionTimer = 0;

    this.hitTrafficCars.clear();

    this.crashed = false;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.reset();
  }
}
