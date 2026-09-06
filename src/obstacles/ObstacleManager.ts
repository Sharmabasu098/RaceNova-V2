/**
 * ============================================================
 * RaceNova V2
 * Obstacle Manager
 * M7.9 - Endless Road Obstacles
 * ============================================================
 *
 * Responsibilities:
 * - Procedural road obstacles
 * - Fixed object pool
 * - Three-lane placement
 * - Endless recycling
 * - Curved-road compatible positioning
 * - Safe lane distribution
 * - Player collision detection
 * - Reset support
 *
 * IMPORTANT:
 * - No GLB / GLTF dependency
 * - No World.ts modification
 * - No audio dependency
 * - No economy dependency
 * - No traffic-system modification
 * ============================================================
 */

import * as THREE from "three";

// ============================================================
// Configuration
// ============================================================

export interface ObstacleManagerConfig {
  roadWidth?: number;
  laneWidth?: number;
  laneCount?: number;

  obstacleCount?: number;

  spawnDistance?: number;
  recycleDistance?: number;

  playerCollisionWidth?: number;
  playerCollisionDepth?: number;
}

// ============================================================
// Obstacle Type
// ============================================================

type ObstacleType =
  | "barrier"
  | "block"
  | "drum";

// ============================================================
// Obstacle
// ============================================================

interface Obstacle {
  object: THREE.Group;

  type: ObstacleType;

  lane: number;

  seed: number;

  active: boolean;
}

// ============================================================
// Obstacle Manager
// ============================================================

export class ObstacleManager {

  // ==========================================================
  // Main References
  // ==========================================================

  private readonly scene:
    THREE.Scene;

  private readonly getRoadCenterX:
    (worldZ: number) => number;

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly roadWidth:
    number;

  private readonly laneWidth:
    number;

  private readonly laneCount:
    number;

  private readonly obstacleCount:
    number;

  private readonly spawnDistance:
    number;

  private readonly recycleDistance:
    number;

  private readonly playerCollisionWidth:
    number;

  private readonly playerCollisionDepth:
    number;

  // ==========================================================
  // Scene Group
  // ==========================================================

  private readonly obstacleGroup:
    THREE.Group;

  // ==========================================================
  // Pool
  // ==========================================================

  private readonly obstacles:
    Obstacle[] = [];

  // ==========================================================
  // Shared Geometry
  // ==========================================================

  private readonly barrierGeometry:
    THREE.BoxGeometry;

  private readonly blockGeometry:
    THREE.BoxGeometry;

  private readonly drumGeometry:
    THREE.CylinderGeometry;

  // ==========================================================
  // Shared Materials
  // ==========================================================

  private readonly barrierMaterial:
    THREE.MeshStandardMaterial;

  private readonly blockMaterial:
    THREE.MeshStandardMaterial;

  private readonly drumMaterial:
    THREE.MeshStandardMaterial;

  // ==========================================================
  // State
  // ==========================================================

  private initialized =
    false;

  private lastPlayerZ =
    0;

  private spawnCursor =
    0;

  private crashLatched =
    false;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    scene: THREE.Scene,
    getRoadCenterX:
      (worldZ: number) => number,
    config: ObstacleManagerConfig = {}
  ) {

    this.scene =
      scene;

    this.getRoadCenterX =
      getRoadCenterX;

    // ========================================================
    // Configuration
    // ========================================================

    this.roadWidth =
      Math.max(
        1,
        config.roadWidth ?? 12
      );

    this.laneWidth =
      Math.max(
        1,
        config.laneWidth ?? 4
      );

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          config.laneCount ?? 3
        )
      );

    /*
     * Fixed pool.
     *
     * Keep this moderate for mobile.
     */
    this.obstacleCount =
      Math.max(
        12,
        Math.floor(
          config.obstacleCount ?? 18
        )
      );

    /*
     * Obstacles begin ahead
     * of the player.
     */
    this.spawnDistance =
      Math.max(
        80,
        config.spawnDistance ?? 180
      );

    /*
     * Once an obstacle is far behind,
     * it gets recycled.
     */
    this.recycleDistance =
      Math.max(
        50,
        config.recycleDistance ?? 70
      );

    /*
     * Collision dimensions are deliberately
     * smaller than the complete road lane.
     */
    this.playerCollisionWidth =
      Math.max(
        0.5,
        config.playerCollisionWidth ?? 1.45
      );

    this.playerCollisionDepth =
      Math.max(
        0.5,
        config.playerCollisionDepth ?? 2.4
      );

    // ========================================================
    // Group
    // ========================================================

    this.obstacleGroup =
      new THREE.Group();

    this.obstacleGroup.name =
      "ProceduralObstacleEnvironment";

    this.scene.add(
      this.obstacleGroup
    );

    // ========================================================
    // Materials
    // ========================================================

    this.barrierMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xd87928,
        roughness: 0.9,
        metalness: 0.0
      });

    this.blockMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x666666,
        roughness: 1.0,
        metalness: 0.0
      });

    this.drumMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xc94a2d,
        roughness: 0.9,
        metalness: 0.0
      });

    // ========================================================
    // Geometry
    // ========================================================

    this.barrierGeometry =
      new THREE.BoxGeometry(
        2.2,
        0.9,
        0.75
      );

    this.blockGeometry =
      new THREE.BoxGeometry(
        1.7,
        1.2,
        1.5
      );

    this.drumGeometry =
      new THREE.CylinderGeometry(
        0.48,
        0.48,
        1.0,
        12
      );
  }

  // ==========================================================
  // Initialize
  // ==========================================================

  public initialize(): void {

    if (
      this.initialized
    ) {
      return;
    }

    this.createPool();

    this.initialized =
      true;

    this.reset(
      this.lastPlayerZ
    );
  }

  // ==========================================================
  // Create Pool
  // ==========================================================

  private createPool(): void {

    this.clearPool();

    for (
      let i = 0;
      i < this.obstacleCount;
      i++
    ) {

      const seed =
        this.createSeed(i);

      const type =
        this.getObstacleType(
          seed
        );

      const obstacleObject =
        this.createObstacle(
          type,
          i
        );

      const obstacle: Obstacle = {
        object:
          obstacleObject,

        type,

        lane:
          i %
          this.laneCount,

        seed,

        active:
          false
      };

      this.obstacles.push(
        obstacle
      );

      this.obstacleGroup.add(
        obstacleObject
      );
    }
  }

  // ==========================================================
  // Create Obstacle
  // ==========================================================

  private createObstacle(
    type: ObstacleType,
    index: number
  ): THREE.Group {

    const group =
      new THREE.Group();

    group.name =
      `Obstacle_${type}_${index}`;

    // ========================================================
    // Barrier
    // ========================================================

    if (
      type === "barrier"
    ) {

      const mesh =
        new THREE.Mesh(
          this.barrierGeometry,
          this.barrierMaterial
        );

      mesh.position.y =
        0.45;

      mesh.rotation.y =
        Math.PI * 0.5;

      mesh.frustumCulled =
        true;

      group.add(
        mesh
      );
    }

    // ========================================================
    // Block
    // ========================================================

    else if (
      type === "block"
    ) {

      const mesh =
        new THREE.Mesh(
          this.blockGeometry,
          this.blockMaterial
        );

      mesh.position.y =
        0.6;

      mesh.frustumCulled =
        true;

      group.add(
        mesh
      );
    }

    // ========================================================
    // Drum
    // ========================================================

    else {

      const mesh =
        new THREE.Mesh(
          this.drumGeometry,
          this.drumMaterial
        );

      mesh.position.y =
        0.5;

      mesh.rotation.z =
        0;

      mesh.frustumCulled =
        true;

      group.add(
        mesh
      );
    }

    group.visible =
      false;

    return group;
  }

  // ==========================================================
  // Update
  // ==========================================================

  public update(
    playerZ: number
  ): void {

    if (
      !Number.isFinite(
        playerZ
      )
    ) {
      return;
    }

    this.lastPlayerZ =
      playerZ;

    if (
      !this.initialized
    ) {
      this.initialize();
    }

    for (
      let i = 0;
      i < this.obstacles.length;
      i++
    ) {

      const obstacle =
        this.obstacles[i];

      if (
        !obstacle.active
      ) {
        continue;
      }

      /*
       * RaceNova forward direction:
       * decreasing world-Z.
       */
      if (
        obstacle.object.position.z >
        playerZ +
        this.recycleDistance
      ) {

        this.recycleObstacle(
          obstacle,
          playerZ
        );
      }

      this.updateObstacleX(
        obstacle
      );
    }
  }

  // ==========================================================
  // Spawn Initial Pool
  // ==========================================================

  private spawnInitialPool(
    playerZ: number
  ): void {

    let distance =
      55;

    for (
      let i = 0;
      i < this.obstacles.length;
      i++
    ) {

      const obstacle =
        this.obstacles[i];

      /*
       * Keep at least one lane open
       * between nearby obstacle rows.
       */
      const row =
        Math.floor(
          i / this.laneCount
        );

      const lane =
        this.getSafeLane(
          row,
          obstacle.seed
        );

      obstacle.lane =
        lane;

      obstacle.active =
        true;

      obstacle.object.visible =
        true;

      obstacle.object.position.z =
        playerZ -
        distance;

      this.updateObstacleX(
        obstacle
      );

      distance +=
        24 +
        this.seededRandom(
          obstacle.seed + 100
        ) *
        18;
    }

    this.spawnCursor =
      this.obstacles.length;
  }

  // ==========================================================
  // Recycle Obstacle
  // ==========================================================

  private recycleObstacle(
    obstacle: Obstacle,
    playerZ: number
  ): void {

    const distance =
      this.spawnDistance +
      this.seededRandom(
        obstacle.seed + 200
      ) *
      100;

    obstacle.lane =
      this.getNextLane(
        obstacle
      );

    obstacle.object.position.z =
      playerZ -
      distance;

    obstacle.object.visible =
      true;

    obstacle.active =
      true;

    this.updateObstacleX(
      obstacle
    );
  }

  // ==========================================================
  // Update Obstacle X
  // ==========================================================

  private updateObstacleX(
    obstacle: Obstacle
  ): void {

    const worldZ =
      obstacle.object.position.z;

    if (
      !Number.isFinite(
        worldZ
      )
    ) {
      return;
    }

    const roadCenterX =
      this.getRoadCenterX(
        worldZ
      );

    if (
      !Number.isFinite(
        roadCenterX
      )
    ) {
      return;
    }

    const laneX =
      this.getLaneX(
        obstacle.lane
      );

    obstacle.object.position.x =
      roadCenterX +
      laneX;
  }

  // ==========================================================
  // Lane X
  // ==========================================================

  private getLaneX(
    lane: number
  ): number {

    const centerLane =
      (
        this.laneCount -
        1
      ) *
      0.5;

    return (
      lane -
      centerLane
    ) *
    this.laneWidth;
  }

  // ==========================================================
  // Safe Lane
  // ==========================================================

  private getSafeLane(
    row: number,
    seed: number
  ): number {

    /*
     * Deterministic lane selection.
     *
     * Never intentionally blocks all
     * three lanes in one row.
     */
    const value =
      Math.floor(
        this.seededRandom(
          seed +
          row *
          17 +
          300
        ) *
        this.laneCount
      );

    return THREE.MathUtils.clamp(
      value,
      0,
      this.laneCount - 1
    );
  }

  // ==========================================================
  // Next Lane
  // ==========================================================

  private getNextLane(
    obstacle: Obstacle
  ): number {

    const next =
      Math.floor(
        this.seededRandom(
          obstacle.seed +
          this.spawnCursor *
          31 +
          400
        ) *
        this.laneCount
      );

    this.spawnCursor++;

    return THREE.MathUtils.clamp(
      next,
      0,
      this.laneCount - 1
    );
  }

  // ==========================================================
  // Collision Check
  // ==========================================================

  public checkCollision(
    playerPosition:
      THREE.Vector3
  ): boolean {

    if (
      !this.initialized
    ) {
      return false;
    }

    if (
      this.crashLatched
    ) {
      return false;
    }

    if (
      !playerPosition ||
      !Number.isFinite(
        playerPosition.x
      ) ||
      !Number.isFinite(
        playerPosition.z
      )
    ) {
      return false;
    }

    for (
      let i = 0;
      i < this.obstacles.length;
      i++
    ) {

      const obstacle =
        this.obstacles[i];

      if (
        !obstacle.active ||
        !obstacle.object.visible
      ) {
        continue;
      }

      const obstacleX =
        obstacle.object.position.x;

      const obstacleZ =
        obstacle.object.position.z;

      const deltaX =
        Math.abs(
          playerPosition.x -
          obstacleX
        );

      const deltaZ =
        Math.abs(
          playerPosition.z -
          obstacleZ
        );

      /*
       * Obstacle half-width is based
       * on lane width but kept conservative.
       */
      const obstacleHalfWidth =
        Math.max(
          0.65,
          this.laneWidth *
          0.32
        );

      const collisionWidth =
        obstacleHalfWidth +
        this.playerCollisionWidth;

      const collisionDepth =
        1.0 +
        this.playerCollisionDepth;

      if (
        deltaX <=
        collisionWidth &&
        deltaZ <=
        collisionDepth
      ) {

        this.crashLatched =
          true;

        return true;
      }
    }

    return false;
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(
    playerZ: number = 0
  ): void {

    if (
      !Number.isFinite(
        playerZ
      )
    ) {
      playerZ =
        0;
    }

    this.lastPlayerZ =
      playerZ;

    this.crashLatched =
      false;

    if (
      !this.initialized
    ) {
      return;
    }

    this.spawnInitialPool(
      playerZ
    );
  }

  // ==========================================================
  // Clear Crash Latch
  // ==========================================================

  public clearCrashLatch(): void {
    this.crashLatched =
      false;
  }

  // ==========================================================
  // Ready
  // ==========================================================

  public isReady(): boolean {
    return this.initialized;
  }

  // ==========================================================
  // Active Count
  // ==========================================================

  public getActiveCount(): number {

    let count =
      0;

    for (
      const obstacle of
      this.obstacles
    ) {

      if (
        obstacle.active
      ) {
        count++;
      }
    }

    return count;
  }

  // ==========================================================
  // Seed
  // ==========================================================

  private createSeed(
    index: number
  ): number {

    let value =
      (
        index + 1
      ) *
      1103515245;

    value =
      (
        value +
        12345
      ) &
      0x7fffffff;

    return value;
  }

  // ==========================================================
  // Seeded Random
  // ==========================================================

  private seededRandom(
    seed: number
  ): number {

    let value =
      Math.sin(
        seed *
        12.9898
      ) *
      43758.5453;

    value =
      value -
      Math.floor(
        value
      );

    if (
      !Number.isFinite(
        value
      )
    ) {
      return 0.5;
    }

    return value;
  }

  // ==========================================================
  // Obstacle Type
  // ==========================================================

  private getObstacleType(
    seed: number
  ): ObstacleType {

    const value =
      this.seededRandom(
        seed + 500
      );

    if (
      value <
      0.34
    ) {
      return "barrier";
    }

    if (
      value <
      0.67
    ) {
      return "block";
    }

    return "drum";
  }

  // ==========================================================
  // Clear Pool
  // ==========================================================

  private clearPool(): void {

    for (
      const obstacle of
      this.obstacles
    ) {

      this.obstacleGroup.remove(
        obstacle.object
      );
    }

    this.obstacles.length =
      0;
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  public dispose(): void {

    this.clearPool();

    this.scene.remove(
      this.obstacleGroup
    );

    this.barrierGeometry.dispose();
    this.blockGeometry.dispose();
    this.drumGeometry.dispose();

    this.barrierMaterial.dispose();
    this.blockMaterial.dispose();
    this.drumMaterial.dispose();

    this.initialized =
      false;

    this.crashLatched =
      false;

    this.spawnCursor =
      0;
  }
}
