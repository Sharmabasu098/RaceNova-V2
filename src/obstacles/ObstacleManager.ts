/**
 * ============================================================
 * RaceNova V2
 * Obstacle Manager
 * M7.9.2 - Improved Road Obstacles
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
 * - Crash latch
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

  private readonly barrierBodyGeometry:
    THREE.BoxGeometry;

  private readonly barrierStripeGeometry:
    THREE.BoxGeometry;

  private readonly barrierLegGeometry:
    THREE.BoxGeometry;

  private readonly barrierFootGeometry:
    THREE.BoxGeometry;

  private readonly blockGeometry:
    THREE.BoxGeometry;

  private readonly blockStripeGeometry:
    THREE.BoxGeometry;

  private readonly drumGeometry:
    THREE.CylinderGeometry;

  private readonly drumBandGeometry:
    THREE.CylinderGeometry;

  private readonly drumTopGeometry:
    THREE.CylinderGeometry;

  // ==========================================================
  // Shared Materials
  // ==========================================================

  private readonly barrierOrangeMaterial:
    THREE.MeshStandardMaterial;

  private readonly barrierWhiteMaterial:
    THREE.MeshStandardMaterial;

  private readonly barrierDarkMaterial:
    THREE.MeshStandardMaterial;

  private readonly blockMaterial:
    THREE.MeshStandardMaterial;

  private readonly blockStripeMaterial:
    THREE.MeshStandardMaterial;

  private readonly drumMaterial:
    THREE.MeshStandardMaterial;

  private readonly drumBandMaterial:
    THREE.MeshStandardMaterial;

  private readonly drumTopMaterial:
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
     * M7.9.2:
     *
     * Keep obstacle quantity low for now.
     * We can increase it later.
     */
    this.obstacleCount =
      Math.max(
        9,
        Math.floor(
          config.obstacleCount ?? 9
        )
      );

    this.spawnDistance =
      Math.max(
        80,
        config.spawnDistance ?? 180
      );

    this.recycleDistance =
      Math.max(
        50,
        config.recycleDistance ?? 70
      );

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
      "ProceduralRoadObstacles";

    this.scene.add(
      this.obstacleGroup
    );

    // ========================================================
    // Materials
    // ========================================================

    this.barrierOrangeMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xf28c28,
        roughness: 0.85,
        metalness: 0.0
      });

    this.barrierWhiteMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xf4f4f4,
        roughness: 0.8,
        metalness: 0.0
      });

    this.barrierDarkMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.95,
        metalness: 0.0
      });

    this.blockMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x5c6268,
        roughness: 0.95,
        metalness: 0.0
      });

    this.blockStripeMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xf2c94c,
        roughness: 0.8,
        metalness: 0.0
      });

    this.drumMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xd94b2b,
        roughness: 0.85,
        metalness: 0.0
      });

    this.drumBandMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xf2c94c,
        roughness: 0.8,
        metalness: 0.0
      });

    this.drumTopMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x8d2f20,
        roughness: 0.9,
        metalness: 0.0
      });

    // ========================================================
    // Barrier Geometry
    // ========================================================

    this.barrierBodyGeometry =
      new THREE.BoxGeometry(
        2.5,
        0.62,
        0.28
      );

    this.barrierStripeGeometry =
      new THREE.BoxGeometry(
        0.34,
        0.64,
        0.30
      );

    this.barrierLegGeometry =
      new THREE.BoxGeometry(
        0.16,
        0.82,
        0.20
      );

    this.barrierFootGeometry =
      new THREE.BoxGeometry(
        0.52,
        0.12,
        0.36
      );

    // ========================================================
    // Block Geometry
    // ========================================================

    this.blockGeometry =
      new THREE.BoxGeometry(
        1.65,
        1.05,
        1.35
      );

    this.blockStripeGeometry =
      new THREE.BoxGeometry(
        1.70,
        0.16,
        1.40
      );

    // ========================================================
    // Drum Geometry
    // ========================================================

    this.drumGeometry =
      new THREE.CylinderGeometry(
        0.48,
        0.52,
        1.05,
        16
      );

    this.drumBandGeometry =
      new THREE.CylinderGeometry(
        0.495,
        0.535,
        0.12,
        16
      );

    this.drumTopGeometry =
      new THREE.CylinderGeometry(
        0.38,
        0.38,
        0.08,
        16
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
          i,
          seed
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
    index: number,
    seed: number
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

      this.createBarrierVisual(
        group,
        seed
      );
    }

    // ========================================================
    // Block
    // ========================================================

    else if (
      type === "block"
    ) {

      this.createBlockVisual(
        group,
        seed
      );
    }

    // ========================================================
    // Drum
    // ========================================================

    else {

      this.createDrumVisual(
        group,
        seed
      );
    }

    group.visible =
      false;

    return group;
  }

  // ==========================================================
  // Barrier Visual
  // ==========================================================

  private createBarrierVisual(
    group: THREE.Group,
    seed: number
  ): void {

    const body =
      new THREE.Mesh(
        this.barrierBodyGeometry,
        this.barrierOrangeMaterial
      );

    body.position.y =
      0.92;

    body.frustumCulled =
      true;

    group.add(
      body
    );

    // ========================================================
    // White hazard stripes
    // ========================================================

    const stripeCount =
      5;

    for (
      let i = 0;
      i < stripeCount;
      i++
    ) {

      const stripe =
        new THREE.Mesh(
          this.barrierStripeGeometry,
          i % 2 === 0
            ? this.barrierWhiteMaterial
            : this.barrierOrangeMaterial
        );

      stripe.position.set(
        -0.82 +
        i *
        0.41,
        0.92,
        0.015
      );

      stripe.rotation.z =
        THREE.MathUtils.degToRad(
          -18
        );

      stripe.frustumCulled =
        true;

      group.add(
        stripe
      );
    }

    // ========================================================
    // Legs
    // ========================================================

    const leftLeg =
      new THREE.Mesh(
        this.barrierLegGeometry,
        this.barrierDarkMaterial
      );

    leftLeg.position.set(
      -0.82,
      0.42,
      0
    );

    leftLeg.frustumCulled =
      true;

    group.add(
      leftLeg
    );

    const rightLeg =
      new THREE.Mesh(
        this.barrierLegGeometry,
        this.barrierDarkMaterial
      );

    rightLeg.position.set(
      0.82,
      0.42,
      0
    );

    rightLeg.frustumCulled =
      true;

    group.add(
      rightLeg
    );

    // ========================================================
    // Feet
    // ========================================================

    const leftFoot =
      new THREE.Mesh(
        this.barrierFootGeometry,
        this.barrierDarkMaterial
      );

    leftFoot.position.set(
      -0.82,
      0.08,
      0
    );

    leftFoot.frustumCulled =
      true;

    group.add(
      leftFoot
    );

    const rightFoot =
      new THREE.Mesh(
        this.barrierFootGeometry,
        this.barrierDarkMaterial
      );

    rightFoot.position.set(
      0.82,
      0.08,
      0
    );

    rightFoot.frustumCulled =
      true;

    group.add(
      rightFoot
    );

    group.rotation.y =
      (
        this.seededRandom(
          seed + 510
        ) -
        0.5
      ) *
      0.08;
  }

  // ==========================================================
  // Block Visual
  // ==========================================================

  private createBlockVisual(
    group: THREE.Group,
    seed: number
  ): void {

    const body =
      new THREE.Mesh(
        this.blockGeometry,
        this.blockMaterial
      );

    body.position.y =
      0.525;

    body.rotation.y =
      (
        this.seededRandom(
          seed + 610
        ) -
        0.5
      ) *
      0.08;

    body.frustumCulled =
      true;

    group.add(
      body
    );

    // ========================================================
    // Lower warning stripe
    // ========================================================

    const stripe =
      new THREE.Mesh(
        this.blockStripeGeometry,
        this.blockStripeMaterial
      );

    stripe.position.y =
      0.40;

    stripe.rotation.z =
      THREE.MathUtils.degToRad(
        -12
      );

    stripe.frustumCulled =
      true;

    group.add(
      stripe
    );

    // ========================================================
    // Top warning plate
    // ========================================================

    const top =
      new THREE.Mesh(
        new THREE.BoxGeometry(
          1.30,
          0.10,
          0.95
        ),
        this.blockStripeMaterial
      );

    top.position.y =
      1.08;

    top.frustumCulled =
      true;

    group.add(
      top
    );
  }

  // ==========================================================
  // Drum Visual
  // ==========================================================

  private createDrumVisual(
    group: THREE.Group,
    seed: number
  ): void {

    const drum =
      new THREE.Mesh(
        this.drumGeometry,
        this.drumMaterial
      );

    drum.position.y =
      0.525;

    drum.frustumCulled =
      true;

    group.add(
      drum
    );

    // ========================================================
    // Upper yellow band
    // ========================================================

    const upperBand =
      new THREE.Mesh(
        this.drumBandGeometry,
        this.drumBandMaterial
      );

    upperBand.position.y =
      0.76;

    upperBand.frustumCulled =
      true;

    group.add(
      upperBand
    );

    // ========================================================
    // Lower yellow band
    // ========================================================

    const lowerBand =
      new THREE.Mesh(
        this.drumBandGeometry,
        this.drumBandMaterial
      );

    lowerBand.position.y =
      0.30;

    lowerBand.frustumCulled =
      true;

    group.add(
      lowerBand
    );

    // ========================================================
    // Top cap
    // ========================================================

    const top =
      new THREE.Mesh(
        this.drumTopGeometry,
        this.drumTopMaterial
      );

    top.position.y =
      1.07;

    top.frustumCulled =
      true;

    group.add(
      top
    );

    group.rotation.y =
      this.seededRandom(
        seed + 710
      ) *
      Math.PI;
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
  // Initial Spawn
  // ==========================================================

  private spawnInitialPool(
    playerZ: number
  ): void {

    /*
     * Start reasonably far ahead.
     *
     * Because obstacle count is now low,
     * keep generous spacing.
     */
    let distance =
      65;

    for (
      let i = 0;
      i < this.obstacles.length;
      i++
    ) {

      const obstacle =
        this.obstacles[i];

      const row =
        Math.floor(
          i /
          this.laneCount
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
        32 +
        this.seededRandom(
          obstacle.seed + 100
        ) *
        24;
    }

    this.spawnCursor =
      this.obstacles.length;
  }

  // ==========================================================
  // Recycle
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
      80;

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
  // Update X
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

    /*
     * Keep obstacle inside the
     * playable road.
     */
    const maximumRoadOffset =
      Math.max(
        0,
        this.roadWidth *
        0.5 -
        this.laneWidth *
        0.5
      );

    const safeLaneX =
      THREE.MathUtils.clamp(
        laneX,
        -maximumRoadOffset,
        maximumRoadOffset
      );

    obstacle.object.position.x =
      roadCenterX +
      safeLaneX;
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
  // Collision
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
       * Conservative collision width.
       *
       * Prevents accidental collision
       * when the player is clearly in
       * another lane.
       */
      const obstacleHalfWidth =
        Math.max(
          0.70,
          this.laneWidth *
          0.30
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
  // Crash State
  // ==========================================================

  public hasCrashed(): boolean {
    return this.crashLatched;
  }

  // ==========================================================
  // Clear Crash
  // ==========================================================

  public clearCrashLatch(): void {
    this.crashLatched =
      false;
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

    this.barrierBodyGeometry.dispose();
    this.barrierStripeGeometry.dispose();
    this.barrierLegGeometry.dispose();
    this.barrierFootGeometry.dispose();

    this.blockGeometry.dispose();
    this.blockStripeGeometry.dispose();

    this.drumGeometry.dispose();
    this.drumBandGeometry.dispose();
    this.drumTopGeometry.dispose();

    this.barrierOrangeMaterial.dispose();
    this.barrierWhiteMaterial.dispose();
    this.barrierDarkMaterial.dispose();

    this.blockMaterial.dispose();
    this.blockStripeMaterial.dispose();

    this.drumMaterial.dispose();
    this.drumBandMaterial.dispose();
    this.drumTopMaterial.dispose();

    this.initialized =
      false;

    this.crashLatched =
      false;

    this.spawnCursor =
      0;
  }
}
   
