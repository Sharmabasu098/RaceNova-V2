import * as THREE from "three";

export interface WorldConfig {
  roadWidth?: number;
  roadSegmentLength?: number;
  roadSegmentCount?: number;
  laneCount?: number;

  curveStrength?: number;
  curveFrequency?: number;
}

interface RoadSegment {
  group: THREE.Group;
  index: number;
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
   * Slightly longer than the logical segment distance.
   *
   * Example:
   * logical distance = 50
   * physical road = 54
   *
   * This overlap prevents tiny gaps
   * when the road is curved.
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
      config.roadSegmentLength ?? 50;

    this.segmentCount =
      Math.max(
        12,
        Math.floor(
          config.roadSegmentCount ?? 20
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
     * Gentle curve by default.
     *
     * Lower frequency = longer smoother curves.
     */
    this.curveStrength =
      config.curveStrength ?? 5;

    this.curveFrequency =
      config.curveFrequency ?? 0.025;

    /*
     * Physical segment overlaps the next segment
     * slightly so the road never visually separates.
     */
    this.physicalSegmentLength =
      this.segmentLength * 1.08;

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
     * Initial placement.
     */
    this.update(0);
  }

  // =========================================================
  // Ground
  // =========================================================

  private createGround(): void {
    const groundGeometry =
      new THREE.BoxGeometry(
        140,
        0.2,
        1200
      );

    const ground =
      new THREE.Mesh(
        groundGeometry,
        this.grassMaterial
      );

    ground.position.set(
      0,
      -0.15,
      -450
    );

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
        index: i
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
    // Road edge lines
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

    /*
     * Use logical segment length here.
     * This prevents excessive duplicated markings
     * because of the physical road overlap.
     */
    const count =
      Math.floor(
        this.segmentLength /
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
        0.7,
        1.2
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
  // Smooth road curve
  // =========================================================

  private getCurveX(
    worldZ: number
  ): number {
    /*
     * Smooth sine curve.
     *
     * Example:
     * left → center → right → center
     */
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
    /*
     * Derivative of:
     *
     * sin(z * frequency) * strength
     *
     * = cos(z * frequency)
     *   * frequency
     *   * strength
     */
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
  // Update road
  // =========================================================

  public update(
    playerZ: number
  ): void {
    if (
      !Number.isFinite(playerZ)
    ) {
      return;
    }

    // -----------------------------------------------------
    // Current logical segment
    // -----------------------------------------------------

    const currentSegment =
      Math.floor(
        -playerZ /
          this.segmentLength
      );

    const center =
      Math.floor(
        this.segmentCount / 2
      );

    // -----------------------------------------------------
    // Position all segments
    // -----------------------------------------------------

    for (
      let i = 0;
      i < this.segments.length;
      i++
    ) {
      const segment =
        this.segments[i];

      /*
       * Logical road index around player.
       */
      const logicalIndex =
        currentSegment +
        (i - center);

      /*
       * World Z position.
       */
      const targetZ =
        -logicalIndex *
        this.segmentLength;

      /*
       * Smooth X curve.
       */
      const targetX =
        this.getCurveX(
          targetZ
        );

      segment.group.position.set(
        targetX,
        0,
        targetZ
      );

      /*
       * Rotate road according to tangent.
       *
       * This keeps the road pointing in the
       * direction of the curve.
       */
      const slope =
        this.getCurveSlope(
          targetZ
        );

      segment.group.rotation.y =
        Math.atan(
          slope
        );
    }
  }

  // =========================================================
  // Get road center at Z
  // =========================================================

  public getRoadCenterX(
    worldZ: number
  ): number {
    return this.getCurveX(
      worldZ
    );
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
          for (
            const material of
              object.material
          ) {
            material.dispose();
          }
        } else {
          object.material.dispose();
        }
      }
    );

    this.roadMaterial.dispose();
    this.grassMaterial.dispose();
    this.markingMaterial.dispose();
    this.barrierMaterial.dispose();

    this.scene.remove(
      this.worldGroup
    );

    this.segments.length = 0;
  }
  }
