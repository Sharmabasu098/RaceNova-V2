import * as THREE from "three";

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
    this.playerCar = playerCar;

    /*
     * Player car width is approximately 2.2.
     * We use a slightly smaller collision box
     * to avoid unfair edge collisions.
     */
    this.collisionWidth =
      config.collisionWidth ?? 1.8;

    /*
     * Car length is approximately 4.2.
     */
    this.collisionDepth =
      config.collisionDepth ?? 3.4;
  }

  // =========================================================
  // Update collision detection
  // =========================================================

  public update(
    trafficCars: readonly TrafficCar[]
  ): void {
    if (this.crashed) {
      return;
    }

    const playerPosition =
      this.playerCar.getPosition();

    for (
      const trafficCar
      of trafficCars
    ) {
      if (!trafficCar.isActive()) {
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
        deltaX <= this.collisionWidth &&
        deltaZ <= this.collisionDepth
      ) {
        this.handleCollision(
          trafficCar
        );

        break;
      }
    }
  }

  // =========================================================
  // Collision response
  // =========================================================

  private handleCollision(
    trafficCar: TrafficCar
  ): void {
    this.crashed = true;

    /*
     * Stop player.
     */
    this.playerCar.setSpeed(0);

    /*
     * Stop traffic car involved
     * in the collision.
     */
    trafficCar.setSpeed(0);
  }

  // =========================================================
  // State
  // =========================================================

  public hasCrashed(): boolean {
    return this.crashed;
  }

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
