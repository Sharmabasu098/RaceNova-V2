import { PlayerCar } from "../player/PlayerCar";
import { TrafficCar } from "../traffic/TrafficCar";

// ============================================================
// RaceNova V2
// Traffic Collision System
// GLB-safe collision detection
// ============================================================

export interface TrafficCollisionConfig {
  collisionWidth?: number;
  collisionDepth?: number;
}

export class TrafficCollisionSystem {
  private readonly playerCar: PlayerCar;

  private readonly collisionWidth: number;
  private readonly collisionDepth: number;

  private crashed = false;

  constructor(
    playerCar: PlayerCar,
    config: TrafficCollisionConfig = {}
  ) {
    this.playerCar =
      playerCar;

    /*
     * Player car width is approximately 2.2.
     *
     * Slightly smaller collision width
     * prevents unfair edge collisions.
     */
    this.collisionWidth =
      config.collisionWidth ?? 1.8;

    /*
     * Player car length is approximately 4.2.
     */
    this.collisionDepth =
      config.collisionDepth ?? 3.4;
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    trafficCars: readonly TrafficCar[],
    _deltaTime?: number
  ): void {
    if (
      this.crashed
    ) {
      return;
    }

    const playerPosition =
      this.playerCar.getPosition();

    for (
      const trafficCar
      of trafficCars
    ) {
      // -----------------------------------------------------
      // Ignore inactive traffic
      // -----------------------------------------------------

      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      // -----------------------------------------------------
      // GLB Safety Guard
      // -----------------------------------------------------

      /*
       * Do not allow an invisible/unloaded
       * TrafficCar object to act as a
       * collision target.
       *
       * Traffic collision becomes active
       * only after the TrafficCar GLB has
       * successfully loaded.
       */
      if (
        !trafficCar.isModelLoaded()
      ) {
        continue;
      }

      // -----------------------------------------------------
      // Ignore traffic already stopped
      // -----------------------------------------------------

      if (
        trafficCar.isStoppedByCollision()
      ) {
        continue;
      }

      const trafficPosition =
        trafficCar.getPosition();

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

      // -----------------------------------------------------
      // Collision Check
      // -----------------------------------------------------

      if (
        deltaX <=
          this.collisionWidth &&
        deltaZ <=
          this.collisionDepth
      ) {
        this.handleCollision(
          trafficCar
        );

        break;
      }
    }
  }

  // =========================================================
  // Collision Response
  // =========================================================

  private handleCollision(
    trafficCar: TrafficCar
  ): void {
    /*
     * Mark race as crashed.
     */
    this.crashed = true;

    /*
     * Stop player immediately.
     */
    this.playerCar.setSpeed(
      0
    );

    /*
     * Permanently stop the traffic car
     * for its current active lifetime.
     */
    trafficCar.stopForCollision();
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
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.crashed = false;
  }
}
