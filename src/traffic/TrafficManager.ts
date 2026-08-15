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

  /**
   * Returns the X position of the road
   * center at a specific world Z.
   */
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

  /**
   * All TrafficCar objects.
   *
   * Inactive cars remain here for reuse.
   */
  private readonly trafficCars: TrafficCar[] = [];

  /**
   * Assigned lane for each traffic car.
   */
  private readonly trafficLanes =
    new Map<TrafficCar, number>();

  /**
   * Last lane used for spawning.
   *
   * This helps distribute traffic across
   * the three lanes instead of repeatedly
   * selecting the same lane.
   */
  private lastSpawnLane = -1;

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
    // Spawn / Despawn
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
    // Update traffic
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

      /*
       * TrafficCar owns its speed and
       * forward movement.
       *
       * TrafficManager does NOT modify
       * its speed every frame.
       */
      trafficCar.update(
        deltaTime
      );

      /*
       * Keep the car aligned with its
       * assigned lane as the road curves.
       */
      this.updateTrafficLanePosition(
        trafficCar
      );
    }

    // -------------------------------------------------------
    // Despawn
    // -------------------------------------------------------

    this.despawnTraffic(
      playerZ
    );

    // -------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------

    this.cleanupInactiveTraffic();
  }

  // =========================================================
  // Spawn
  // =========================================================

  private spawnTraffic(
    playerZ: number
  ): void {
    const spawnZ =
      playerZ -
      this.spawnDistance;

    /*
     * Get lanes ordered so that the
     * previously used lane is not preferred.
     */
    const lanes =
      this.createDistributedLanes();

    for (
      const lane of lanes
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
       * Make sure this position is safe.
       */
      if (
        !this.canSpawnAt(
          spawnX,
          spawnZ
        )
      ) {
        continue;
      }

      /*
       * Speed is selected ONCE.
       *
       * It does not increase over time.
       */
      const speed =
        this.getRandomSpeed();

      // -----------------------------------------------------
      // Reuse inactive car
      // -----------------------------------------------------

      const reusableCar =
        this.getInactiveTrafficCar();

      if (reusableCar) {
        reusableCar.setPosition(
          spawnX,
          0,
          spawnZ
        );

        reusableCar.setSpeed(
          speed
        );

        reusableCar.setActive(
          true
        );

        this.trafficLanes.set(
          reusableCar,
          lane
        );

        this.lastSpawnLane =
          lane;

        reusableCar.addToScene(
          this.scene
        );

        return;
      }

      // -----------------------------------------------------
      // Create new traffic car
      // -----------------------------------------------------

      const newTrafficCar =
        new TrafficCar({
          x: spawnX,
          y: 0,
          z: spawnZ,
          speed,
          color:
            this.getRandomColor()
        });

      newTrafficCar.addToScene(
        this.scene
      );

      this.trafficCars.push(
        newTrafficCar
      );

      this.trafficLanes.set(
        newTrafficCar,
        lane
      );

      this.lastSpawnLane =
        lane;

      return;
    }
  }

  // =========================================================
  // Follow Road / Lane
  // =========================================================

  private updateTrafficLanePosition(
    trafficCar: TrafficCar
  ): void {
    const storedLane =
      this.trafficLanes.get(
        trafficCar
      );

    const assignedLane =
      storedLane ??
      Math.floor(
        this.laneCount / 2
      );

    const position =
      trafficCar.getPosition();

    const roadCenterX =
      this.getRoadCenterX(
        position.z
      );

    const laneOffset =
      this.getLaneOffset(
        assignedLane
      );

    /*
     * Only X is corrected.
     *
     * Z remains completely controlled
     * by TrafficCar.update().
     */
    position.x =
      roadCenterX +
      laneOffset;
  }

  // =========================================================
  // Spawn Safety
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
       * Same-lane protection.
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
    if (
      this.trafficCars.length <=
      this.maxTraffic * 3
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

      this.trafficLanes.delete(
        trafficCar
      );

      trafficCar.dispose();
    }

    this.trafficCars.length = 0;

    this.trafficCars.push(
      ...kept
    );
  }

  // =========================================================
  // Find Reusable Car
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
  // Lane Calculation
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
  // Distributed Lane Order
  // =========================================================

  private createDistributedLanes():
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
     * If there is only one lane,
     * there is nothing to distribute.
     */
    if (
      this.laneCount <= 1
    ) {
      return lanes;
    }

    /*
     * Randomize first.
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

    /*
     * Move the previously used lane
     * to the end.
     *
     * This prevents repeated spawning
     * into the same lane when another
     * lane is available.
     */
    if (
      this.lastSpawnLane >= 0
    ) {
      const index =
        lanes.indexOf(
          this.lastSpawnLane
        );

      if (
        index >= 0
      ) {
        const previousLane =
          lanes.splice(
            index,
            1
          )[0];

        lanes.push(
          previousLane
        );
      }
    }

    return lanes;
  }

  // =========================================================
  // Random Speed
  // =========================================================

  private getRandomSpeed(): number {
    /*
     * Speed is generated only once
     * during spawning.
     *
     * TrafficCar does not accelerate.
     */
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
  // Random Color
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
  // Active Traffic
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

    this.trafficLanes.clear();

    this.lastSpawnLane = -1;

    this.spawnTimer = 0;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.clear();
  }
}
