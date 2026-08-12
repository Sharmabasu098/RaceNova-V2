import * as THREE from "three";
import {
  TrafficCar,
  TrafficCarConfig
} from "./TrafficCar";

export interface TrafficManagerConfig {
  laneWidth?: number;
  laneCount?: number;

  getRoadCenterX?: (
    worldZ: number
  ) => number;

  maxTraffic?: number;

  spawnDistance?: number;
  despawnDistance?: number;

  minSpeed?: number;
  maxSpeed?: number;

  colors?: number[];
}

export class TrafficManager {
  private readonly scene: THREE.Scene;

  private readonly laneWidth: number;
  private readonly laneCount: number;

  private readonly getRoadCenterX:
    (worldZ: number) => number;

  private readonly maxTraffic: number;

  private readonly spawnDistance: number;
  private readonly despawnDistance: number;

  private readonly minSpeed: number;
  private readonly maxSpeed: number;

  private readonly colors: number[];

  private readonly trafficCars: TrafficCar[] = [];

  private readonly spawnCooldown = 1.2;
  private spawnTimer = 0;

  constructor(
    scene: THREE.Scene,
    config: TrafficManagerConfig = {}
  ) {
    this.scene = scene;

    this.laneWidth =
      config.laneWidth ?? 4;

    this.laneCount = Math.max(
      1,
      Math.floor(
        config.laneCount ?? 3
      )
    );

    this.getRoadCenterX =
      config.getRoadCenterX ??
      (() => 0);

    this.maxTraffic = Math.max(
      1,
      Math.floor(
        config.maxTraffic ?? 8
      )
    );

    this.spawnDistance =
      Math.max(
        40,
        config.spawnDistance ?? 140
      );

    this.despawnDistance =
      Math.max(
        20,
        config.despawnDistance ?? 80
      );

    this.minSpeed =
      Math.max(
        10,
        config.minSpeed ?? 55
      );

    this.maxSpeed =
      Math.max(
        this.minSpeed,
        config.maxSpeed ?? 95
      );

    this.colors =
      config.colors ?? [
        0x2563eb,
        0x16a34a,
        0xf59e0b,
        0x7c3aed,
        0xf43f5e,
        0x64748b
      ];
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

    this.spawnTimer += deltaTime;

    // Update existing traffic
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

      this.updateRoadAlignment(
        trafficCar
      );
    }

    // Remove distant traffic
    this.removeDistantCars(
      playerZ
    );

    // Spawn new traffic
    if (
      this.spawnTimer >=
        this.spawnCooldown &&
      this.trafficCars.length <
        this.maxTraffic
    ) {
      this.spawnTimer = 0;

      this.spawnTraffic(
        playerZ
      );
    }
  }

  // =========================================================
  // Spawn traffic
  // =========================================================

  private spawnTraffic(
    playerZ: number
  ): void {
    const lane =
      this.findAvailableLane(
        playerZ
      );

    if (
      lane === null
    ) {
      return;
    }

    const spawnZ =
      playerZ -
      this.spawnDistance;

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
      this.randomRange(
        this.minSpeed,
        this.maxSpeed
      );

    const color =
      this.colors[
        Math.floor(
          Math.random() *
          this.colors.length
        )
      ];

    const config:
      TrafficCarConfig = {
        x: spawnX,
        y: 0,
        z: spawnZ,
        speed,
        color
      };

    const trafficCar =
      new TrafficCar(
        config
      );

    trafficCar.addToScene(
      this.scene
    );

    this.trafficCars.push(
      trafficCar
    );
  }

  // =========================================================
  // Find available lane
  // =========================================================

  private findAvailableLane(
    playerZ: number
  ): number | null {
    const lanes =
      Array.from(
        {
          length:
            this.laneCount
        },
        (_, index) =>
          index
      );

    // Shuffle lanes
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

      [
        lanes[i],
        lanes[j]
      ] = [
        lanes[j],
        lanes[i]
      ];
    }

    for (
      const lane
      of lanes
    ) {
      if (
        !this.isLaneOccupied(
          lane,
          playerZ
        )
      ) {
        return lane;
      }
    }

    return null;
  }

  // =========================================================
  // Check lane
  // =========================================================

  private isLaneOccupied(
    lane: number,
    playerZ: number
  ): boolean {
    const targetZ =
      playerZ -
      this.spawnDistance;

    const laneX =
      this.getLaneOffset(
        lane
      );

    const minimumDistance =
      18;

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

      const roadCenterX =
        this.getRoadCenterX(
          position.z
        );

      const relativeX =
        position.x -
        roadCenterX;

      if (
        Math.abs(
          relativeX -
          laneX
        ) < 1.5 &&
        Math.abs(
          position.z -
          targetZ
        ) < minimumDistance
      ) {
        return true;
      }
    }

    return false;
  }

  // =========================================================
  // Keep traffic on curved road
  // =========================================================

  private updateRoadAlignment(
    trafficCar: TrafficCar
  ): void {
    const position =
      trafficCar.getPosition();

    const roadCenterX =
      this.getRoadCenterX(
        position.z
      );

    const currentOffset =
      position.x -
      roadCenterX;

    const roadHalfWidth =
      (this.laneWidth *
        this.laneCount) /
      2;

    const safeOffset =
      THREE.MathUtils.clamp(
        currentOffset,
        -roadHalfWidth + 1.1,
        roadHalfWidth - 1.1
      );

    trafficCar.setPosition(
      roadCenterX +
        safeOffset,
      position.y,
      position.z
    );
  }

  // =========================================================
  // Remove distant traffic
  // =========================================================

  private removeDistantCars(
    playerZ: number
  ): void {
    for (
      let i =
        this.trafficCars.length - 1;
      i >= 0;
      i--
    ) {
      const trafficCar =
        this.trafficCars[i];

      const trafficZ =
        trafficCar
          .getPosition()
          .z;

      if (
        trafficZ >
        playerZ +
          this.despawnDistance
      ) {
        trafficCar.removeFromScene(
          this.scene
        );

        trafficCar.setActive(
          false
        );

        trafficCar.dispose();

        this.trafficCars.splice(
          i,
          1
        );
      }
    }
  }

  // =========================================================
  // Lane offset
  // =========================================================

  private getLaneOffset(
    lane: number
  ): number {
    const centerLane =
      (this.laneCount - 1) /
      2;

    return (
      (lane - centerLane) *
      this.laneWidth
    );
  }

  // =========================================================
  // Random speed
  // =========================================================

  private randomRange(
    min: number,
    max: number
  ): number {
    return (
      min +
      Math.random() *
        (max - min)
    );
  }

  // =========================================================
  // Public access
  // =========================================================

  public getTrafficCars():
    readonly TrafficCar[] {
    return this.trafficCars;
  }

  public getTrafficCount():
    number {
    return this.trafficCars.length;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    for (
      const trafficCar
      of this.trafficCars
    ) {
      trafficCar.removeFromScene(
        this.scene
      );

      trafficCar.dispose();
    }

    this.trafficCars.length = 0;
  }
}
