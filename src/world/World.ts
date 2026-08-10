import * as THREE from "three";

export interface WorldConfig {
  roadWidth?: number;
  roadSegmentLength?: number;
  roadSegmentCount?: number;
  laneCount?: number;

  // V2.1
  curveStrength?: number;
  curveFrequency?: number;
}

interface RoadSegment {
  group: THREE.Group;
  index: number;
  logicalIndex: number;
}

export class World {
  private readonly scene: THREE.Scene;

  private readonly roadWidth: number;
  private readonly segmentLength: number;
  private readonly segmentCount: number;
  private readonly laneCount: number;

  private readonly curveStrength: number;
  private readonly curveFrequency: number;

  /*
   * Very small overlap.
   *
   * This prevents visible hairline gaps
   * between neighbouring road pieces.
   */
  private readonly physicalSegmentLength: number;

  private readonly segments: RoadSegment[] = [];

  private readonly worldGroup: THREE.Group;

  private readonly roadMaterial: THREE.MeshStandardMaterial;
  private readonly grassMaterial: THREE.MeshStandardMaterial;
  private readonly markingMaterial: THREE.MeshStandardMaterial;
  private readonly barrierMaterial: THREE.MeshStandardMaterial;

  constructor(
    scene: THREE.Scene,
    config: WorldConfig = {}
  ) {
    this.scene = scene;

    // =====================================================
    // Configuration
    // =====================================================

    this.roadWidth =
      config.roadWidth ?? 12;

    this.segmentLength =
      Math.max(
        20,
        config.roadSegmentLength ?? 50
      );

    this.segmentCount =
      Math.max(
        16,
        Math.floor(
          config.roadSegmentCount ?? 24
        )
      );

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          config.laneCount ?? 3
        )
      );

    /*
     * V2.1:
     *
     * Curve is disabled by default.
     *
     * This gives us a completely stable
     * continuous highway first.
     *
     * Later we can safely introduce curves.
     */
    this.curveStrength =
      config.curveStrength ?? 0;

    this.curveFrequency =
      config.curveFrequency ?? 0.015;

    /*
     * Slight overlap prevents tiny visual gaps.
     */
    this.physicalSegmentLength =
      this.segmentLength + 0.20;

    // =====================================================
    // World group
    // =====================================================

    this.worldGroup =
      new THREE.Group();

    this.scene.add(
      this.worldGroup
    );

    // =====================================================
    // Materials
    // =====================================================

    this.roadMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x303030,
        roughness: 0.92,
        metalness: 0.02
      });

    this.grassMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x4f8f3f,
        roughness: 1
      });

    this.markingMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7
      });

    this.barrierMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xd8d8d8,
        roughness: 0.75,
        metalness: 0.1
      });

    // =====================================================
    // Create world
    // =====================================================

    this.createGround();

    this.createRoadSegments();

    /*
     * Initial deterministic placement.
     */
    this.update(0);
  }

  // =========================================================
  // Ground
  // =========================================================

  private createGround(): void {
    const groundLength =
      this.segmentLength *
      (this.segmentCount + 8);

    const groundGeometry =
      new THREE.BoxGeometry(
        140,
        0.20,
        groundLength
      );

    const ground =
      new THREE.Mesh(
        groundGeometry,
        this.grassMaterial
      );

    ground.position.set(
      0,
      -0.15,
      -(
        groundLength / 2
      ) + 25
    );

    ground.receiveShadow = true;

    this.worldGroup.add(
      ground
    );
  }

  // =========================================================
  // Create road segments
  // =========================================================

  private createRoadSegments(): void {
    for (
      let i = 0;
      i < this.segmentCount;
      i++
    ) {
      const group =
        this.createRoadSegment();

      const segment: RoadSegment = {
        group,
        index: i,
        logicalIndex: 0
      };

      this.segments.push(
        segment
      );

      this.worldGroup.add(
        group
      );
    }
  }

  // =========================================================
  // Create one road segment
  // =========================================================

  private createRoadSegment(): THREE.Group {
    const group =
      new THREE.Group();

    // =====================================================
    // Main road
    // =====================================================

    const roadGeometry =
      new THREE.BoxGeometry(
        this.roadWidth,
        0.15,
        this.physicalSegmentLength
      );

    const road =
      new THREE.Mesh(
        roadGeometry,
        this.roadMaterial
      );

    road.position.y = 0;

    road.receiveShadow = true;

    group.add(
      road
    );

    // =====================================================
    // Lane width
    // =====================================================

    const laneWidth =
      this.roadWidth /
      this.laneCount;

    // =====================================================
    // Lane markings
    // =====================================================

    for (
      let lane = 1;
      lane < this.laneCount;
      lane++
    ) {
      const x =
        -this.roadWidth / 2 +
        lane * laneWidth;

      this.createLaneMarkings(
        group,
        x
      );
    }

    // =====================================================
    // Edge lines
    // =====================================================

    this.createEdgeLine(
      group,
      -this.roadWidth / 2 +
        0.12
    );

    this.createEdgeLine(
      group,
      this.roadWidth / 2 -
        0.12
    );

    // =====================================================
    // Road barriers
    // =====================================================

    this.createBarrier(
      group,
      -this.roadWidth / 2 -
        0.55
    );

    this.createBarrier(
      group,
      this.roadWidth / 2 +
        0.55
    );

    return group;
  }

  // =========================================================
  // Lane markings
  // =========================================================

  private createLaneMarkings(
    group: THREE.Group,
    x: number
  ): void {
    const dashLength = 5;
    const gapLength = 5;

    const usableLength =
      this.segmentLength;

    const count =
      Math.floor(
        usableLength /
          (dashLength + gapLength)
      );

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const z =
        -this.segmentLength / 2 +
        2.5 +
        i *
          (dashLength + gapLength);

      const geometry =
        new THREE.BoxGeometry(
          0.12,
          0.035,
          dashLength
        );

      const marking =
        new THREE.Mesh(
          geometry,
          this.markingMaterial
        );

      marking.position.set(
        x,
        0.105,
        z
      );

      group.add(
        marking
      );
    }
  }

  // =========================================================
  // Edge line
  // =========================================================

  private createEdgeLine(
    group: THREE.Group,
    x: number
  ): void {
    const geometry =
      new THREE.BoxGeometry(
        0.18,
        0.04,
        this.physicalSegmentLength
      );

    const line =
      new THREE.Mesh(
        geometry,
        this.markingMaterial
      );

    line.position.set(
      x,
      0.105,
      0
    );

    group.add(
      line
    );
  }

  // =========================================================
  // Barrier
  // =========================================================

  private createBarrier(
    group: THREE.Group,
    x: number
  ): void {
    // -----------------------------------------------------
    // Rail
    // -----------------------------------------------------

    const railGeometry =
      new THREE.BoxGeometry(
        0.25,
        0.25,
        this.physicalSegmentLength
      );

    const rail =
      new THREE.Mesh(
        railGeometry,
        this.barrierMaterial
      );

    rail.position.set(
      x,
      0.55,
      0
    );

    group.add(
      rail
    );

    // -----------------------------------------------------
    // Posts
    // -----------------------------------------------------

    const postGeometry =
      new THREE.BoxGeometry(
        0.35,
        0.70,
        1.20
      );

    const postSpacing = 5;

    const postCount =
      Math.ceil(
        this.physicalSegmentLength /
          postSpacing
      );

    for (
      let i = 0;
      i <= postCount;
      i++
    ) {
      const post =
        new THREE.Mesh(
          postGeometry,
          this.barrierMaterial
        );

      const z =
        -this.physicalSegmentLength / 2 +
        i * postSpacing;

      post.position.set(
        x,
        0.35,
        z
      );

      group.add(
        post
      );
    }
  }

  // =========================================================
  // Smooth curve X
  // =========================================================

  private getCurveX(
    worldZ: number
  ): number {
    if (
      this.curveStrength === 0
    ) {
      return 0;
    }

    return (
      Math.sin(
        worldZ *
          this.curveFrequency
      ) *
      this.curveStrength
    );
  }

  // =========================================================
  // Curve slope
  // =========================================================

  private getCurveSlope(
    worldZ: number
  ): number {
    if (
      this.curveStrength === 0
    ) {
      return 0;
    }

    return (
      Math.cos(
        worldZ *
          this.curveFrequency
      ) *
      this.curveFrequency *
      this.curveStrength
    );
  }

  // =========================================================
  // World update
  // =========================================================

  public update(
    playerZ: number
  ): void {
    if (
      !Number.isFinite(playerZ)
    ) {
      return;
    }

    // =====================================================
    // Determine player road segment
    // =====================================================

    const currentSegment =
      Math.floor(
        -playerZ /
          this.segmentLength
      );

    /*
     * Keep an equal number of segments
     * in front and behind the player.
     */
    const center =
      Math.floor(
        this.segmentCount / 2
      );

    // =====================================================
    // Position segments
    // =====================================================

    for (
      let i = 0;
      i < this.segments.length;
      i++
    ) {
      const segment =
        this.segments[i];

      /*
       * Logical segment number.
       *
       * This is the important part of V2.1.
       *
       * Every road piece is always exactly
       * one segmentLength away from its neighbour.
       */
      const logicalIndex =
        currentSegment +
        (i - center);

      segment.logicalIndex =
        logicalIndex;

      // ---------------------------------------------------
      // Z position
      // ---------------------------------------------------

      const targetZ =
        -logicalIndex *
        this.segmentLength;

      // ---------------------------------------------------
      // X position
      // ---------------------------------------------------

      const targetX =
        this.getCurveX(
          targetZ
        );

      // ---------------------------------------------------
      // Rotation
      // ---------------------------------------------------

      const slope =
        this.getCurveSlope(
          targetZ
        );

      const targetRotationY =
        Math.atan(
          slope
        );

      /*
       * V2.1 uses deterministic transforms.
       *
       * No per-frame interpolation.
       * No accumulating movement.
       * No random offsets.
       */
      segment.group.position.x =
        targetX;

      segment.group.position.y =
        0;

      segment.group.position.z =
        targetZ;

      segment.group.rotation.x =
        0;

      segment.group.rotation.z =
        0;

      segment.group.rotation.y =
        targetRotationY;
    }
  }

  // =========================================================
  // Get road center
  // =========================================================

  public getRoadCenterX(
    worldZ: number
  ): number {
    return this.getCurveX(
      worldZ
    );
  }

  // =========================================================
  // Get road width
  // =========================================================

  public getRoadWidth(): number {
    return this.roadWidth;
  }

  // =========================================================
  // Get lane width
  // =========================================================

  public getLaneWidth(): number {
    return (
      this.roadWidth /
      this.laneCount
    );
  }

  // =========================================================
  // Get lane count
  // =========================================================

  public getLaneCount(): number {
    return this.laneCount;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.worldGroup.traverse(
      (object) => {
        if (
          !(object instanceof THREE.Mesh)
        ) {
          return;
        }

        object.geometry.dispose();

        if (
          Array.isArray(
            object.material
          )
        ) {
          object.material.forEach(
            (material) => {
              material.dispose();
            }
          );
        } else {
          object.material.dispose();
        }
      }
    );

    this.scene.remove(
      this.worldGroup
    );

    this.segments.length = 0;
  }
      }
