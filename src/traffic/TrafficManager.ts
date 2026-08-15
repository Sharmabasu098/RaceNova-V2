import * as THREE from "three";

import { TrafficCar } from "./TrafficCar";

export interface TrafficManagerConfig {
  laneWidth?: number;
  laneCount?: number;

  maxTraffic?: number;

  spawnDistance?: number;
  despawnDistance?: number;

  minSpeed?: number;
  maxSpeed?: number;

  /**
   * Minimum distance between traffic cars
   * when spawning.
   */
  minSpawnGap?: number;

  /**
   * Minimum time between spawn attempts.
   */
  spawnInterval?: number;

  getRoadCenterX?: (
    worldZ: number
  ) => number;
}

export class TrafficManager {
  private readonly scene: THREE.Scene;

  private readonly laneWidth: number;
  private readonly laneCount: number;

  private readonly maxTraffic: number;

  private readonly spawnDistance: number;
  private readonly despawnDistance: number;

  private readonly minSpeed: number;
  private readonly maxSpeed: number;

  private readonly minSpawnGap: number;

  private readonly spawnInterval: number;

  private readonly getRoadCenterX: (
    worldZ: number
  ) => number;

  private readonly trafficCars: TrafficCar[] = [];

  private spawnTimer = 0;

  private readonly trafficColors = [
    0x2563eb,
    0x16a34a,
    0xf59e0b,
    0x9333ea,
    0xdc2626,
    0x0891b2,
    0x475569
  ];

  constructor(
    scene: THREE.Scene,
    config: TrafficManagerConfig = {}
  ) {
    this.scene = scene;

    // =====================================================
    // Lane configuration
    // =====================================================

    this.laneWidth =
      Math.max(
        0.1,
        config.laneWidth ?? 4
      );

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          config.laneCount ?? 3
        )
      );

    // =====================================================
    // Traffic limits
    // =====================================================

    this.maxTraffic =
      Math.max(
        1,
        Math.floor(
          config.maxTraffic ?? 8
        )
      );

    // =====================================================
    // Spawn / despawn
    // =====================================================

    this.spawnDistance =
      Math.max(
        20,
        config.spawnDistance ?? 140
      );

    this.despawnDistance =
      Math.max(
        20,
        config.despawnDistance ?? 80
      );

    // =====================================================
    // Traffic speed
    // =====================================================

    this.minSpeed =
      Math.max(
        0,
        config.minSpeed ?? 55
      );

    this.maxSpeed =
      Math.max(
        this.minSpeed,
        config.maxSpeed ?? 95
      );

    // =====================================================
    // Spawn safety
    // =====================================================

    this.minSpawnGap =
      Math.max(
        5,
        config.minSpawnGap ?? 18
      );

    this.spawnInterval =
      Math.max(
        0.1,
        config.spawnInterval ?? 1.2
      );

    // =====================================================
    // Road center
    // =====================================================

    this.getRoadCenterX =
      config.getRoadCenterX ??
      (() => 0);
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number,
    playerZ: number
  ): void {
    if (
      deltaTime <= 0 ||
      !Number.isFinite(playerZ)
    ) {
      return;
    }

    // -------------------------------------------------------
    // Spawn timer
    // -------------------------------------------------------

    this.spawnTimer += deltaTime;

    if (
      this.spawnTimer >=
      this.spawnInterval
    ) {
      /*
       * Preserve leftover time instead of
       * simply resetting to zero.
       *
       * This makes spawning more stable
       * across different frame rates.
       */
      this.spawnTimer -=
        this.spawnInterval;

      if (
        this.getActiveTrafficCount() <
        this.maxTraffic
      ) {
        this.spawnTraffic(
          playerZ
        );
      }
    }

    // -------------------------------------------------------
    // Update active traffic
    // -------------------------------------------------------

    for (
      const trafficCar
      of this.trafficCars
    ) {
      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      trafficCar.update(
        deltaTime
      );
    }

    // -------------------------------------------------------
    // Despawn
    // -------------------------------------------------------

    this.despawnTraffic(
      playerZ
    );

    // -------------------------------------------------------
    // Cleanup inactive cars
    // -------------------------------------------------------

    this.cleanupInactiveTraffic();
  }

  // =========================================================
  // Spawn
  // =========================================================

  private spawnTraffic(
    playerZ: number
  ): void {
    /*
     * Traffic travels toward positive Z.
     *
     * Player travels toward negative Z.
     *
     * Therefore traffic is spawned
     * ahead of the player at negative Z.
     */
    const spawnZ =
      playerZ -
      this.spawnDistance;

    /*
     * Try several random lanes.
     *
     * This prevents a blocked lane from
     * stopping traffic spawning completely.
     */
    const lanes =
      this.createShuffledLanes();

    for (
      const lane
      of lanes
    ) {
      const roadCenterX =
        this.getRoadCenterX(
          spawnZ
        );

      const laneOffset =
        this.getLaneOffset(
          lane
        );

      const spawnX =
        roadCenterX +
        laneOffset;

      /*
       * Do not spawn a traffic car if
       * another active car is too close
       * in the same lane/position.
       */
      if (
        !this.canSpawnAt(
          spawnX,
          spawnZ
        )
      ) {
        continue;
      }

      const speed =
        this.getRandomSpeed();

      const color =
        this.getRandomColor();

      const trafficCar =
        this.getInactiveTrafficCar();

      if (trafficCar) {
        /*
         * Reuse an inactive TrafficCar.
         */
        trafficCar.setPosition(
          spawnX,
          0,
          spawnZ
        );

        trafficCar.setSpeed(
          speed
        );

        trafficCar.setActive(
          true
        );

        /*
         * Re-add to scene because despawned
         * cars may have been removed.
         */
        trafficCar.addToScene(
          this.scene
        );

        this.trafficCars.push(
          trafficCar
        );

        return;
      }

      /*
       * No reusable car available.
       * Create a new one.
       */
      const newTrafficCar =
        new TrafficCar({
          x: spawnX,
          y: 0,
          z: spawnZ,
          speed,
          color
        });

      newTrafficCar.addToScene(
        this.scene
      );

      this.trafficCars.push(
        newTrafficCar
      );

      return;
    }
  }

  // =========================================================
  // Spawn safety
  // =========================================================

  private canSpawnAt(
    x: number,
    z: number
  ): boolean {
    for (
      const trafficCar
      of this.trafficCars
    ) {
      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      const position =
        trafficCar.getPosition();

      const deltaX =
        Math.abs(
          position.x -
          x
        );

      const deltaZ =
        Math.abs(
          position.z -
          z
        );

      /*
       * Same-lane / nearby protection.
       *
       * Traffic cars are approximately
       * 4.2 units long, so this prevents
       * visually overlapping spawns.
       */
      if (
        deltaX <
          this.laneWidth * 0.75 &&
        deltaZ <
          this.minSpawnGap
      ) {
        return false;
      }
    }

    return true;
  }

  // =========================================================
  // Despawn
  // =========================================================

  private despawnTraffic(
    playerZ: number
  ): void {
    for (
      const trafficCar
      of this.trafficCars
    ) {
      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      const trafficZ =
        trafficCar.getPosition().z;

      /*
       * Traffic moves toward positive Z.
       *
       * Once it has passed sufficiently
       * behind the player, deactivate it.
       */
      if (
        trafficZ >
        playerZ +
        this.despawnDistance
      ) {
        trafficCar.setActive(
          false
        );

        trafficCar.removeFromScene(
          this.scene
        );
      }
    }
  }

  // =========================================================
  // Cleanup
  // =========================================================

  private cleanupInactiveTraffic(): void {
    /*
     * Keep inactive cars available for reuse.
     *
     * This avoids constantly allocating
     * new TrafficCar objects.
     *
     * The array is compacted only when it
     * becomes unnecessarily large.
     */
    const inactiveCount =
      this.trafficCars.filter(
        (car) =>
          !car.isActive()
      ).length;

    if (
      this.trafficCars.length <=
      this.maxTraffic * 3
    ) {
      return;
    }

    if (
      inactiveCount <= 0
    ) {
      return;
    }

    const kept:
      TrafficCar[] = [];

    for (
      const trafficCar
      of this.trafficCars
    ) {
      if (
        trafficCar.isActive()
      ) {
        kept.push(
          trafficCar
        );
        continue;
      }

      /*
       * Dispose excess inactive cars.
       */
      trafficCar.dispose();
    }

    this.trafficCars.length = 0;

    this.trafficCars.push(
      ...kept
    );
  }

  // =========================================================
  // Find reusable car
  // =========================================================

  private getInactiveTrafficCar():
    TrafficCar | null {
    for (
      const trafficCar
      of this.trafficCars
    ) {
      if (
        !trafficCar.isActive()
      ) {
        return trafficCar;
      }
    }

    return null;
  }

  // =========================================================
  // Lane calculation
  // =========================================================

  private getLaneOffset(
    lane: number
  ): number {
    const centerLane =
      (this.laneCount - 1) /
      2;

    return (
      lane -
      centerLane
    ) *
    this.laneWidth;
  }

  // =========================================================
  // Shuffled lanes
  // =========================================================

  private createShuffledLanes():
    number[] {
    const lanes: number[] = [];

    for (
      let i = 0;
      i < this.laneCount;
      i++
    ) {
      lanes.push(i);
    }

    /*
     * Fisher-Yates shuffle.
     */
    for (
      let i = lanes.length - 1;
      i > 0;
      i--
    ) {
      const j =
        Math.floor(
          Math.random() *
          (i + 1)
        );

      const temp =
        lanes[i];

      lanes[i] =
        lanes[j];

      lanes[j] =
        temp;
    }

    return lanes;
  }

  // =========================================================
  // Random speed
  // =========================================================

  private getRandomSpeed(): number {
    return (
      this.minSpeed +
      Math.random() *
      (
        this.maxSpeed -
        this.minSpeed
      )
    );
  }

  // =========================================================
  // Random color
  // =========================================================

  private getRandomColor(): number {
    const index =
      Math.floor(
        Math.random() *
        this.trafficColors.length
      );

    return (
      this.trafficColors[
        index
      ]
    );
  }

  // =========================================================
  // Active traffic
  // =========================================================

  public getTrafficCars():
    readonly TrafficCar[] {
    return this.trafficCars.filter(
      (trafficCar) =>
        trafficCar.isActive()
    );
  }

  public getActiveTrafficCount():
    number {
    let count = 0;

    for (
      const trafficCar
      of this.trafficCars
    ) {
      if (
        trafficCar.isActive()
      ) {
        count++;
      }
    }

    return count;
  }

  // =========================================================
  // Clear
  // =========================================================

  public clear(): void {
    for (
      const trafficCar
      of this.trafficCars
    ) {
      trafficCar.setActive(
        false
      );

      trafficCar.removeFromScene(
        this.scene
      );

      trafficCar.dispose();
    }

    this.trafficCars.length = 0;

    this.spawnTimer = 0;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.clear();
  }
}
