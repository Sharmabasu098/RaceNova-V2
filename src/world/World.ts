import * as THREE from "three";

export interface WorldConfig {
  roadWidth?: number;
  roadSegmentLength?: number;
  roadSegmentCount?: number;
  laneCount?: number;

  // V2.2
  curveStrength?: number;
  curveFrequency?: number;
}

interface RoadSegment {
  group: THREE.Group;
  index: number;
  z: number;
}

export class World {
  private readonly scene: THREE.Scene;

  private readonly roadWidth: number;
  private readonly segmentLength: number;
  private readonly segmentCount: number;
  private readonly laneCount: number;

  /*
   * V2.2:
   *
   * Curve is OFF for the first stable-road test.
   */
  private readonly curveStrength: number;
  private readonly curveFrequency: number;

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

    this.curveStrength =
      config.curveStrength ?? 0;

    this.curveFrequency =
      config.curveFrequency ?? 0.015;

    // =====================================================
    // Root world group
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
  }

  // =========================================================
  // Ground
  // =========================================================

  private createGround(): void {
    /*
     * Large ground area.
     *
     * We keep it much longer than the visible road
     * so the first test does not expose ground edges.
     */
    const groundLength =
      Math.max(
        5000,
        this.segmentLength *
          this.segmentCount *
          4
      );

    const geometry =
      new THREE.PlaneGeometry(
        160,
        groundLength
      );

    const ground =
      new THREE.Mesh(
        geometry,
        this.grassMaterial
      );

    ground.rotation.x =
      -Math.PI / 2;

    ground.position.set(
      0,
      -0.10,
      -groundLength / 2 + 100
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
    /*
     * IMPORTANT:
     *
     * Segment 0 center = 0
     * Segment 1 center = -50
     * Segment 2 center = -100
     * ...
     *
     * Therefore every segment touches the next one exactly.
     */

    for (
      let i = 0;
      i < this.segmentCount;
      i++
    ) {
      const group =
        this.createRoadSegment();

      const z =
        -i *
        this.segmentLength;

      group.position.set(
        0,
        0,
        z
      );

      const segment: RoadSegment = {
        group,
        index: i,
        z
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
  // Create single road segment
  // =========================================================

  private createRoadSegment(): THREE.Group {
    const group =
      new THREE.Group();

    // =====================================================
    // Road
    // =====================================================

    const roadGeometry =
      new THREE.BoxGeometry(
        this.roadWidth,
        0.15,
        this.segmentLength
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
        0.10
    );

    this.createEdgeLine(
      group,
      this.roadWidth / 2 -
        0.10
    );

    // =====================================================
    // Barriers
    // =====================================================

    this.createBarrier(
      group,
      -this.roadWidth / 2 -
        0.60
    );

    this.createBarrier(
      group,
      this.roadWidth / 2 +
        0.60
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
        this.segmentLength
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
        this.segmentLength
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
        0.30
      );

    const postSpacing = 5;

    const postCount =
      Math.floor(
        this.segmentLength /
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
        -this.segmentLength / 2 +
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
  // Curve helper
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
  // V2.2 ROAD RECYCLING
  // =========================================================

  public update(
    playerZ: number
  ): void {
    if (
      !Number.isFinite(playerZ)
    ) {
      return;
    }

    /*
     * Find the front-most road segment.
     *
     * Smaller Z = farther ahead.
     */
    let frontMostZ =
      Infinity;

    for (
      const segment of this.segments
    ) {
      if (
        segment.z <
        frontMostZ
      ) {
        frontMostZ =
          segment.z;
      }
    }

    /*
     * A segment is behind the player
     * when its center has moved sufficiently
     * toward positive Z.
     */
    const recycleDistance =
      this.segmentLength * 1.5;

    for (
      const segment of this.segments
    ) {
      const distanceBehind =
        playerZ -
        segment.z;

      if (
        distanceBehind >
        recycleDistance
      ) {
        /*
         * Move this exact same segment
         * to the front of the road.
         */
        frontMostZ -=
          this.segmentLength;

        segment.z =
          frontMostZ;

        this.applySegmentTransform(
          segment
        );
      }
    }
  }

  // =========================================================
  // Apply segment transform
  // =========================================================

  private applySegmentTransform(
    segment: RoadSegment
  ): void {
    const x =
      this.getCurveX(
        segment.z
      );

    const slope =
      this.getCurveSlope(
        segment.z
      );

    segment.group.position.x =
      x;

    segment.group.position.y =
      0;

    segment.group.position.z =
      segment.z;

    /*
     * Straight road:
     *
     * rotationY = 0
     *
     * Curve mode:
     * rotation follows the road direction.
     */
    segment.group.rotation.x =
      0;

    segment.group.rotation.z =
      0;

    segment.group.rotation.y =
      Math.atan(slope);
  }

  // =========================================================
  // Road center
  // =========================================================

  public getRoadCenterX(
    worldZ: number
  ): number {
    return this.getCurveX(
      worldZ
    );
  }

  // =========================================================
  // Road width
  // =========================================================

  public getRoadWidth(): number {
    return this.roadWidth;
  }

  // =========================================================
  // Lane width
  // =========================================================

  public getLaneWidth(): number {
    return (
      this.roadWidth /
      this.laneCount
    );
  }

  // =========================================================
  // Lane count
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

    this.roadMaterial.dispose();
    this.grassMaterial.dispose();
    this.markingMaterial.dispose();
    this.barrierMaterial.dispose();
  }
}
