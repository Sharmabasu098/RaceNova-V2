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

  private readonly getRoadCenterX: (
    worldZ: number
  ) => number;

  private readonly trafficCars: TrafficCar[] = [];

  private spawnTimer = 0;

  private readonly spawnInterval = 1.2;

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

    this.laneWidth =
      config.laneWidth ?? 4;

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          config.laneCount ?? 3
        )
      );

    this.maxTraffic =
      Math.max(
        1,
        Math.floor(
          config.maxTraffic ?? 8
        )
      );

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
      deltaTime <= 0
    ) {
      return;
    }

    // -------------------------------------------------------
    // Spawn timer
    // -------------------------------------------------------

    this.spawnTimer +=
      deltaTime;

    if (
      this.spawnTimer >=
      this.spawnInterval
    ) {
      this.spawnTimer = 0;

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

      trafficCar.update(
        deltaTime
      );
    }

    // -------------------------------------------------------
    // Despawn traffic
    // -------------------------------------------------------

    this.despawnTraffic(
      playerZ
    );
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

    const lane =
      this.getRandomLane();

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

    const speed =
      this.getRandomSpeed();

    const color =
      this.getRandomColor();

    const trafficCar =
      new TrafficCar({
        x: spawnX,
        y: 0,
        z: spawnZ,
        speed,
        color
      });

    trafficCar.addToScene(
      this.scene
    );

    this.trafficCars.push(
      trafficCar
    );
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
       * Player moves toward negative Z.
       *
       * Traffic moves toward positive Z.
       *
       * Therefore traffic cars behind
       * the player have a larger Z value.
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
    ) * this.laneWidth;
  }

  private getRandomLane(): number {
    return Math.floor(
      Math.random() *
      this.laneCount
    );
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

    return this.trafficColors[
      index
    ];
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
  // Clear traffic
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
