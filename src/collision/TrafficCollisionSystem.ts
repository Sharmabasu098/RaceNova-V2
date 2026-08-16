import { PlayerCar } from "../player/PlayerCar";
import { TrafficCar } from "../traffic/TrafficCar";

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
      /*
       * Ignore inactive traffic.
       */
      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      /*
       * Ignore traffic cars that were
       * already stopped by a collision.
       */
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
     * IMPORTANT:
     *
     * Do NOT only use setSpeed(0).
     *
     * TrafficCar.update() would otherwise
     * be able to move the car again if another
     * gameplay system changes its speed.
     *
     * stopForCollision() creates a permanent
     * collision-stop state for this active car.
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
