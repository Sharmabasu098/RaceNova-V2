import * as THREE from "three";

import { PlayerCar } from "../player/PlayerCar";
import { TrafficCar } from "../traffic/TrafficCar";

export interface TrafficCollisionConfig {
  /**
   * Half-width of the player's collision box.
   *
   * Player visual width ≈ 2.2.
   * Default 1.8 gives a slightly forgiving collision area.
   */
  collisionWidth?: number;

  /**
   * Half-depth of the player's collision box.
   *
   * Player visual length ≈ 4.2.
   * Default 3.4 gives a slightly forgiving collision area.
   */
  collisionDepth?: number;

  /**
   * Minimum time between collision events.
   *
   * Prevents multiple collision triggers
   * during the same physical contact.
   */
  collisionCooldown?: number;

  /**
   * Whether Nitro should immediately cancel
   * when the player hits traffic.
   */
  cancelNitroOnCollision?: boolean;

  /**
   * Whether the traffic car should stop
   * after collision.
   *
   * Default false.
   *
   * Traffic should continue moving after
   * hitting the player.
   */
  stopTrafficOnCollision?: boolean;
}

export class TrafficCollisionSystem {
  private readonly playerCar: PlayerCar;

  private readonly collisionWidth: number;
  private readonly collisionDepth: number;

  private readonly collisionCooldown: number;
  private readonly cancelNitroOnCollision: boolean;
  private readonly stopTrafficOnCollision: boolean;

  // =========================================================
  // Collision State
  // =========================================================

  private crashed = false;

  private collisionTimer = 0;

  /**
   * Traffic cars that are currently touching
   * the player.
   *
   * This prevents the same car from generating
   * repeated collision events while overlapping.
   */
  private readonly touchingTrafficCars =
    new Set<TrafficCar>();

  // =========================================================
  // Temporary vectors
  // =========================================================

  private readonly playerPosition =
    new THREE.Vector3();

  private readonly trafficPosition =
    new THREE.Vector3();

  constructor(
    playerCar: PlayerCar,
    config: TrafficCollisionConfig = {}
  ) {
    this.playerCar = playerCar;

    // =====================================================
    // Collision dimensions
    // =====================================================

    this.collisionWidth =
      Math.max(
        0.1,
        config.collisionWidth ?? 1.8
      );

    this.collisionDepth =
      Math.max(
        0.1,
        config.collisionDepth ?? 3.4
      );

    // =====================================================
    // Collision behaviour
    // =====================================================

    this.collisionCooldown =
      Math.max(
        0,
        config.collisionCooldown ?? 0.35
      );

    this.cancelNitroOnCollision =
      config.cancelNitroOnCollision ?? true;

    /*
     * IMPORTANT:
     *
     * Traffic should NOT freeze when it hits
     * the player.
     *
     * The traffic car continues its normal
     * forward movement.
     */
    this.stopTrafficOnCollision =
      config.stopTrafficOnCollision ?? false;
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    trafficCars: readonly TrafficCar[],
    deltaTime = 1 / 60
  ): void {
    if (
      !Number.isFinite(deltaTime) ||
      deltaTime <= 0
    ) {
      return;
    }

    // -------------------------------------------------------
    // Cooldown
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

    this.playerPosition.copy(
      this.playerCar.getPosition()
    );

    // -------------------------------------------------------
    // Track current contacts
    // -------------------------------------------------------

    const currentlyTouching =
      new Set<TrafficCar>();

    // -------------------------------------------------------
    // Collision detection
    // -------------------------------------------------------

    for (
      const trafficCar
      of trafficCars
    ) {
      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      this.trafficPosition.copy(
        trafficCar.getPosition()
      );

      const colliding =
        this.isColliding(
          this.playerPosition,
          this.trafficPosition
        );

      if (!colliding) {
        continue;
      }

      currentlyTouching.add(
        trafficCar
      );

      // -----------------------------------------------------
      // Already touching
      // -----------------------------------------------------

      if (
        this.touchingTrafficCars.has(
          trafficCar
        )
      ) {
        continue;
      }

      /*
       * Remember this car as currently
       * touching the player.
       */
      this.touchingTrafficCars.add(
        trafficCar
      );

      // -----------------------------------------------------
      // Already crashed
      // -----------------------------------------------------

      if (
        this.crashed
      ) {
        continue;
      }

      // -----------------------------------------------------
      // Collision cooldown
      // -----------------------------------------------------

      if (
        this.collisionTimer > 0
      ) {
        continue;
      }

      // -----------------------------------------------------
      // Handle collision
      // -----------------------------------------------------

      this.handleCollision(
        trafficCar
      );

      /*
       * Only one collision response
       * per update.
       */
      break;
    }

    // -------------------------------------------------------
    // Remove cars that separated
    // -------------------------------------------------------

    for (
      const trafficCar
      of this.touchingTrafficCars
    ) {
      if (
        !currentlyTouching.has(
          trafficCar
        )
      ) {
        this.touchingTrafficCars.delete(
          trafficCar
        );
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
     * TrafficCar visual dimensions:
     *
     * Width  ≈ 2.2
     * Length ≈ 4.2
     *
     * The values below are PLAYER half-extents.
     */

    const trafficWidth =
      2.2;

    const trafficDepth =
      4.2;

    const playerHalfWidth =
      this.collisionWidth;

    const playerHalfDepth =
      this.collisionDepth;

    const trafficHalfWidth =
      trafficWidth / 2;

    const trafficHalfDepth =
      trafficDepth / 2;

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
     * AABB collision.
     */
    const overlapX =
      deltaX <=
      playerHalfWidth +
        trafficHalfWidth;

    const overlapZ =
      deltaZ <=
      playerHalfDepth +
        trafficHalfDepth;

    return (
      overlapX &&
      overlapZ
    );
  }

  // =========================================================
  // Collision Response
  // =========================================================

  private handleCollision(
    trafficCar: TrafficCar
  ): void {
    /*
     * Enter crashed state.
     */
    this.crashed = true;

    /*
     * Start collision cooldown.
     */
    this.collisionTimer =
      this.collisionCooldown;

    // -------------------------------------------------------
    // Nitro
    // -------------------------------------------------------

    /*
     * PlayerCar.stop() correctly cancels
     * Nitro and resets its Nitro timer.
     */
    if (
      this.cancelNitroOnCollision &&
      this.playerCar.isNitroActive()
    ) {
      this.playerCar.stop();
    } else {
      /*
       * Normal crash:
       * stop player movement.
       */
      this.playerCar.setSpeed(
        0
      );
    }

    // -------------------------------------------------------
    // Traffic response
    // -------------------------------------------------------

    if (
      this.stopTrafficOnCollision
    ) {
      trafficCar.setSpeed(
        0
      );
    }

    /*
     * By default traffic continues moving.
     */
  }

  // =========================================================
  // State
  // =========================================================

  public hasCrashed(): boolean {
    return this.crashed;
  }

  // =========================================================
  // Reset
  // =========================================================

  public reset(): void {
    this.crashed = false;

    this.collisionTimer = 0;

    this.touchingTrafficCars.clear();
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.reset();
  }
}
