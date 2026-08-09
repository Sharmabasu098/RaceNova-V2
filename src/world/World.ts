import * as THREE from "three";

export interface WorldConfig {
  roadWidth?: number;
  roadSegmentLength?: number;
  roadSegmentCount?: number;
  laneCount?: number;

  // Curve settings
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

    this.roadWidth =
      config.roadWidth ?? 12;

    this.segmentLength =
      config.roadSegmentLength ?? 50;

    this.segmentCount =
      Math.max(
        8,
        Math.floor(
          config.roadSegmentCount ?? 16
        )
      );

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          config.laneCount ?? 3
        )
      );

    // ------------------------------------------------
    // Curve
    // ------------------------------------------------

    this.curveStrength =
      config.curveStrength ?? 8;

    this.curveFrequency =
      config.curveFrequency ?? 0.055;

    // ------------------------------------------------
    // World group
    // ------------------------------------------------

    this.worldGroup =
      new THREE.Group();

    this.scene.add(
      this.worldGroup
    );

    // ------------------------------------------------
    // Materials
    // ------------------------------------------------

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

    this.createGround();
    this.createRoadSegments();
  }

  // =========================================================
  // Ground
  // =========================================================

  private createGround(): void {
    const geometry =
      new THREE.BoxGeometry(
        120,
        0.2,
        900
      );

    const ground =
      new THREE.Mesh(
        geometry,
        this.grassMaterial
      );

    ground.position.set(
      0,
      -0.15,
      -300
    );

    this.worldGroup.add(
      ground
    );
  }

  // =========================================================
  // Road segments
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

    this.update(0);
  }

  // =========================================================
  // Single road segment
  // =========================================================

  private createRoadSegment(): THREE.Group {
    const group =
      new THREE.Group();

    // ------------------------------------------------
    // Road
    // ------------------------------------------------

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

    group.add(road);

    // ------------------------------------------------
    // Lane markings
    // ------------------------------------------------

    const laneWidth =
      this.roadWidth /
      this.laneCount;

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

    // ------------------------------------------------
    // Edge lines
    // ------------------------------------------------

    this.createEdgeLine(
      group,
      -this.roadWidth / 2 + 0.12
    );

    this.createEdgeLine(
      group,
      this.roadWidth / 2 - 0.12
    );

    // ------------------------------------------------
    // Barriers
    // ------------------------------------------------

    this.createBarrier(
      group,
      -this.roadWidth / 2 - 0.55
    );

    this.createBarrier(
      group,
      this.roadWidth / 2 + 0.55
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
    const gap = 5;

    const count =
      Math.floor(
        this.segmentLength /
          (dashLength + gap)
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
          (dashLength + gap);

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
        0.1,
        z
      );

      group.add(marking);
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
      0.1,
      0
    );

    group.add(line);
  }

  // =========================================================
  // Barrier
  // =========================================================

  private createBarrier(
    group: THREE.Group,
    x: number
  ): void {
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

    group.add(rail);

    const postGeometry =
      new THREE.BoxGeometry(
        0.35,
        0.7,
        1.2
      );

    const postCount =
      Math.floor(
        this.segmentLength / 5
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

      post.position.set(
        x,
        0.35,
        -this.segmentLength / 2 +
          i * 5
      );

      group.add(post);
    }
  }

  // =========================================================
  // Curve calculation
  // =========================================================

  private getCurveX(
    worldZ: number
  ): number {
    return (
      Math.sin(
        worldZ *
          this.curveFrequency
      ) *
      this.curveStrength
    );
  }

  // =========================================================
  // Road update + recycling
  // =========================================================

  public update(
    playerZ: number
  ): void {
    if (
      !Number.isFinite(playerZ)
    ) {
      return;
    }

    const currentSegment =
      Math.floor(
        -playerZ /
          this.segmentLength
      );

    const center =
      Math.floor(
        this.segmentCount / 2
      );

    for (
      let i = 0;
      i < this.segments.length;
      i++
    ) {
      const segment =
        this.segments[i];

      const logicalIndex =
        currentSegment +
        (i - center);

      const targetZ =
        -logicalIndex *
        this.segmentLength;

      // ----------------------------------------------
      // Position
      // ----------------------------------------------

      segment.group.position.z =
        targetZ;

      // ----------------------------------------------
      // Curve
      // ----------------------------------------------

      const curveX =
        this.getCurveX(
          targetZ
        );

      segment.group.position.x =
        curveX;

      // ----------------------------------------------
      // Road rotation
      // ----------------------------------------------

      const nextX =
        this.getCurveX(
          targetZ -
            this.segmentLength
        );

      const slope =
        (nextX - curveX) /
        this.segmentLength;

      segment.group.rotation.y =
        Math.atan(slope);
    }
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
