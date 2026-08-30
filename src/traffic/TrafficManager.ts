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
   * Safe following distance between
   * traffic cars in the same lane.
   */
  trafficFollowDistance?: number;

  /**
   * Returns the X position of the road
   * center at a specific world Z.
   */
  getRoadCenterX?: (
    worldZ: number
  ) => number;
}

export class TrafficManager {

  private readonly scene:
    THREE.Scene;

  private readonly laneWidth:
    number;

  private readonly laneCount:
    number;

  private readonly maxTraffic:
    number;

  private readonly spawnDistance:
    number;

  private readonly despawnDistance:
    number;

  private readonly minSpeed:
    number;

  private readonly maxSpeed:
    number;

  private readonly minSpawnGap:
    number;

  private readonly spawnInterval:
    number;

  private readonly trafficFollowDistance:
    number;

  private readonly getRoadCenterX:
    (
      worldZ: number
    ) => number;

  // =========================================================
  // Traffic Cars
  // =========================================================

  private readonly trafficCars:
    TrafficCar[] = [];

  // =========================================================
  // Lane Assignment
  // =========================================================

  private readonly trafficLanes =
    new Map<
      TrafficCar,
      number
    >();

  // =========================================================
  // Spawn State
  // =========================================================

  private lastSpawnLane =
    -1;

  private spawnTimer =
    0;

  // =========================================================
  // Traffic GLB Models
  // =========================================================

  private readonly trafficModelPaths:
    string[] = [
      "/RaceNova-V2/assets/cars/trafficpolicecar.glb",

      "/RaceNova-V2/assets/cars/trafficsuv.glb",

      "/RaceNova-V2/assets/cars/traffictaxi.glb"
    ];

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    scene: THREE.Scene,
    config: TrafficManagerConfig = {}
  ) {

    this.scene =
      scene;

    // =======================================================
    // Lane Configuration
    // =======================================================

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

    // =======================================================
    // Traffic Limits
    // =======================================================

    this.maxTraffic =
      Math.max(
        1,
        Math.floor(
          config.maxTraffic ?? 8
        )
      );

    // =======================================================
    // Spawn / Despawn
    // =======================================================

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

    // =======================================================
    // Traffic Speed
    // =======================================================

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

    // =======================================================
    // Spawn Safety
    // =======================================================

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

    // =======================================================
    // Traffic Interaction
    // =======================================================

    this.trafficFollowDistance =
      Math.max(
        5,
        config.trafficFollowDistance ?? 12
      );

    // =======================================================
    // Road Center
    // =======================================================

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
      !Number.isFinite(
        playerZ
      )
    ) {
      return;
    }

    // =======================================================
    // Spawn
    // =======================================================

    this.spawnTimer +=
      deltaTime;

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

    // =======================================================
    // Update Traffic Movement
    // =======================================================

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

    // =======================================================
    // Traffic Interaction
    // =======================================================

    this.updateTrafficInteraction();

    // =======================================================
    // Lane Following
    // =======================================================

    for (
      const trafficCar
      of this.trafficCars
    ) {

      if (
        !trafficCar.isActive()
      ) {
        continue;
      }

      this.updateTrafficLanePosition(
        trafficCar
      );
    }

    // =======================================================
    // Despawn
    // =======================================================

    this.despawnTraffic(
      playerZ
    );

    // =======================================================
    // Cleanup
    // =======================================================

    this.cleanupInactiveTraffic();
  }

  // =========================================================
  // Spawn Traffic
  // =========================================================

  private spawnTraffic(
    playerZ: number
  ): void {

    const spawnZ =
      playerZ -
      this.spawnDistance;

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

      if (
        !this.canSpawnAt(
          spawnX,
          spawnZ
        )
      ) {
        continue;
      }

      // -----------------------------------------------------
      // Select speed
      // -----------------------------------------------------

      const speed =
        this.getRandomSpeed();

      // -----------------------------------------------------
      // Select GLB
      // -----------------------------------------------------

      const modelPath =
        this.getRandomTrafficModel();

      // -----------------------------------------------------
      // Reuse inactive car
      // -----------------------------------------------------

      const reusableCar =
        this.getInactiveTrafficCar();

      if (
        reusableCar
      ) {

        reusableCar.resetCollisionStop();

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
      // Create new GLB traffic car
      // -----------------------------------------------------

      const newTrafficCar =
        new TrafficCar({

          x:
            spawnX,

          y:
            0,

          z:
            spawnZ,

          speed:
            speed,

          modelPath:
            modelPath
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
  // Random Traffic GLB
  // =========================================================

  private getRandomTrafficModel():
    string {

    const index =
      Math.floor(
        Math.random() *
        this.trafficModelPaths.length
      );

    return (
      this.trafficModelPaths[
        index
      ]
    );
  }

  // =========================================================
  // Traffic Interaction
  // =========================================================

  private updateTrafficInteraction():
    void {

    const activeCars =
      this.trafficCars.filter(
        (car) =>
          car.isActive()
      );

    for (
      const follower
      of activeCars
    ) {

      const followerLane =
        this.trafficLanes.get(
          follower
        );

      if (
        followerLane ===
        undefined
      ) {
        continue;
      }

      const followerPosition =
        follower.getPosition();

      let closestLeader:
        TrafficCar | null =
        null;

      let closestDistance =
        Number.POSITIVE_INFINITY;

      for (
        const leader
        of activeCars
      ) {

        if (
          leader ===
          follower
        ) {
          continue;
        }

        const leaderLane =
          this.trafficLanes.get(
            leader
          );

        if (
          leaderLane !==
          followerLane
        ) {
          continue;
        }

        const leaderPosition =
          leader.getPosition();

        /*
         * Traffic moves toward +Z.
         *
         * Therefore the leader has
         * a larger Z value.
         */

        const forwardDistance =
          leaderPosition.z -
          followerPosition.z;

        if (
          forwardDistance <= 0
        ) {
          continue;
        }

        if (
          forwardDistance <
          closestDistance
        ) {

          closestDistance =
            forwardDistance;

          closestLeader =
            leader;
        }
      }

      if (
        closestLeader ===
        null
      ) {
        continue;
      }

      // -----------------------------------------------------
      // Follow Distance
      // -----------------------------------------------------

      if (
        closestDistance <
        this.trafficFollowDistance
      ) {

        const leaderSpeed =
          closestLeader.getSpeed();

        const safeSpeed =
          Math.min(
            follower.getSpeed(),
            leaderSpeed
          );

        follower.setSpeed(
          safeSpeed
        );

        // ---------------------------------------------------
        // Prevent overlap
        // ---------------------------------------------------

        const desiredZ =
          closestLeader
            .getPosition()
            .z -
          this.trafficFollowDistance;

        if (
          followerPosition.z >
          desiredZ
        ) {

          followerPosition.z =
            desiredZ;
        }
      }
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
        trafficCar
          .getPosition()
          .z;

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

  private cleanupInactiveTraffic():
    void {

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

    this.trafficCars.length =
      0;

    this.trafficCars.push(
      ...kept
    );
  }

  // =========================================================
  // Reusable Car
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

    const lanes:
      number[] = [];

    for (
      let i = 0;
      i < this.laneCount;
      i++
    ) {

      lanes.push(
        i
      );
    }

    if (
      this.laneCount <= 1
    ) {

      return lanes;
    }

    // -------------------------------------------------------
    // Fisher-Yates shuffle
    // -------------------------------------------------------

    for (
      let i =
        lanes.length - 1;

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

    // -------------------------------------------------------
    // Avoid repeating previous lane
    // -------------------------------------------------------

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

  private getRandomSpeed():
    number {

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

    let count =
      0;

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

  public clear():
    void {

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

    this.trafficCars.length =
      0;

    this.trafficLanes.clear();

    this.lastSpawnLane =
      -1;

    this.spawnTimer =
      0;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose():
    void {

    this.clear();
  }
}
