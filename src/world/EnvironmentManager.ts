/**
 * ============================================================
 * RaceNova V2
 * Environment Manager
 * M7.7 - Continuous Endless Roadside Environment
 * ============================================================
 *
 * Responsibilities:
 * - Procedural roadside environment
 * - Both-side continuous distribution
 * - Environment visible from race start
 * - Endless fixed-pool recycling
 * - Curved-road compatible placement
 * - No vegetation on the playable road
 * - Smaller natural low-poly trees
 * - Dense grass, flowers, bushes and rocks
 *
 * IMPORTANT:
 * - No GLB / GLTF dependency
 * - No external environment asset
 * - No gameplay collision
 * - No economy dependency
 * - No audio dependency
 * - World.ts remains untouched
 * ============================================================
 */

import * as THREE from "three";

export interface EnvironmentManagerConfig {
  roadWidth?: number;
  sideOffset?: number;
  propCount?: number;
  spacing?: number;
  visibleAhead?: number;
  visibleBehind?: number;
}

interface EnvironmentProp {
  object: THREE.Group;
  side: -1 | 1;
  seed: number;
}

export class EnvironmentManager {
  private readonly scene: THREE.Scene;

  private readonly getRoadCenterX:
    (worldZ: number) => number;

  private readonly roadWidth: number;
  private readonly sideOffset: number;
  private readonly propCount: number;
  private readonly spacing: number;
  private readonly visibleAhead: number;
  private readonly visibleBehind: number;

  private readonly environmentGroup:
    THREE.Group;

  private readonly props:
    EnvironmentProp[] = [];

  private loaded = false;
  private loading = false;
  private lastPlayerZ = 0;

  // =========================================================
  // Shared Geometry
  // =========================================================

  private readonly grassBladeGeometry:
    THREE.ConeGeometry;

  private readonly trunkGeometry:
    THREE.CylinderGeometry;

  private readonly leafGeometry:
    THREE.IcosahedronGeometry;

  private readonly rockGeometry:
    THREE.DodecahedronGeometry;

  private readonly bushGeometry:
    THREE.IcosahedronGeometry;

  private readonly flowerStemGeometry:
    THREE.CylinderGeometry;

  private readonly flowerHeadGeometry:
    THREE.IcosahedronGeometry;

  // =========================================================
  // Shared Materials
  // =========================================================

  private readonly grassMaterial:
    THREE.MeshStandardMaterial;

  private readonly trunkMaterial:
    THREE.MeshStandardMaterial;

  private readonly leafMaterial:
    THREE.MeshStandardMaterial;

  private readonly leafLightMaterial:
    THREE.MeshStandardMaterial;

  private readonly rockMaterial:
    THREE.MeshStandardMaterial;

  private readonly bushMaterial:
    THREE.MeshStandardMaterial;

  private readonly flowerYellowMaterial:
    THREE.MeshStandardMaterial;

  private readonly flowerPinkMaterial:
    THREE.MeshStandardMaterial;

  private readonly flowerWhiteMaterial:
    THREE.MeshStandardMaterial;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    scene: THREE.Scene,
    getRoadCenterX:
      (worldZ: number) => number,
    config: EnvironmentManagerConfig = {}
  ) {
    this.scene = scene;

    this.getRoadCenterX =
      getRoadCenterX;

    this.roadWidth =
      config.roadWidth ?? 12;

    this.sideOffset =
      Math.max(
        3.0,
        config.sideOffset ?? 3.0
      );

    /*
     * Minimum 48 pooled groups.
     * 24 slots per side.
     */
    this.propCount =
      Math.max(
        48,
        Math.floor(
          config.propCount ?? 48
        )
      );

    /*
     * Keep the roadside dense.
     */
    this.spacing =
      Math.min(
        12,
        Math.max(
          9,
          config.spacing ?? 10
        )
      );

    this.visibleAhead =
      Math.max(
        220,
        config.visibleAhead ?? 280
      );

    this.visibleBehind =
      Math.max(
        70,
        config.visibleBehind ?? 100
      );

    this.environmentGroup =
      new THREE.Group();

    this.environmentGroup.name =
      "ProceduralRoadsideEnvironment";

    this.scene.add(
      this.environmentGroup
    );

    // =======================================================
    // Materials
    // =======================================================

    this.grassMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x3f9b3f,
        roughness: 0.95,
        metalness: 0.0
      });

    this.trunkMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x70482b,
        roughness: 1.0,
        metalness: 0.0
      });

    this.leafMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x23823a,
        roughness: 0.9,
        metalness: 0.0
      });

    this.leafLightMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x3ca34d,
        roughness: 0.9,
        metalness: 0.0
      });

    this.rockMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 1.0,
        metalness: 0.0
      });

    this.bushMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x2f7f35,
        roughness: 0.95,
        metalness: 0.0
      });

    this.flowerYellowMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xf2c94c,
        roughness: 0.85,
        metalness: 0.0
      });

    this.flowerPinkMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xe96b8b,
        roughness: 0.85,
        metalness: 0.0
      });

    this.flowerWhiteMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.85,
        metalness: 0.0
      });

    // =======================================================
    // Geometry
    // =======================================================

    this.grassBladeGeometry =
      new THREE.ConeGeometry(
        0.12,
        0.9,
        4
      );

    this.trunkGeometry =
      new THREE.CylinderGeometry(
        0.18,
        0.28,
        2.8,
        6
      );

    this.leafGeometry =
      new THREE.IcosahedronGeometry(
        1.15,
        1
      );

    this.rockGeometry =
      new THREE.DodecahedronGeometry(
        0.75,
        0
      );

    this.bushGeometry =
      new THREE.IcosahedronGeometry(
        0.75,
        1
      );

    this.flowerStemGeometry =
      new THREE.CylinderGeometry(
        0.035,
        0.045,
        0.5,
        5
      );

    this.flowerHeadGeometry =
      new THREE.IcosahedronGeometry(
        0.16,
        0
      );
  }

  // =========================================================
  // Load
  // =========================================================

  public async load(): Promise<void> {
    if (
      this.loaded ||
      this.loading
    ) {
      return;
    }

    this.loading = true;

    try {
      this.createPropPool();

      this.loaded = true;

      /*
       * Populate immediately.
       * Environment must be visible
       * from the beginning of the race.
       */
      this.update(
        this.lastPlayerZ
      );
    } catch (error) {
      console.error(
        "[EnvironmentManager] Failed to create procedural environment.",
        error
      );
    } finally {
      this.loading = false;
    }
  }

  // =========================================================
  // Create Prop Pool
  // =========================================================

  private createPropPool(): void {
    this.disposeProps();

    for (
      let i = 0;
      i < this.propCount;
      i++
    ) {
      const side: -1 | 1 =
        i % 2 === 0
          ? -1
          : 1;

      const seed =
        this.createSeed(i);

      const prop =
        this.createRoadsideProp(
          seed,
          i,
          side
        );

      this.environmentGroup.add(
        prop
      );

      this.props.push({
        object: prop,
        side,
        seed
      });
    }
  }

  // =========================================================
  // Create Roadside Prop
  // =========================================================

  private createRoadsideProp(
    seed: number,
    index: number,
    side: -1 | 1
  ): THREE.Group {
    const group =
      new THREE.Group();

    group.name =
      `ProceduralRoadsideProp_${index}`;

    /*
     * Every slot gets dense grass.
     */
    this.addGrassCluster(
      group,
      seed,
      side
    );

    const pattern =
      index % 12;

    switch (pattern) {
      case 0:
        this.addTree(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 10,
          side
        );
        break;

      case 1:
        this.addBush(
          group,
          seed,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 20,
          side
        );
        break;

      case 2:
        this.addTree(
          group,
          seed,
          side
        );
        break;

      case 3:
        this.addRock(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 31,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 30,
          side
        );
        break;

      case 4:
        this.addBush(
          group,
          seed,
          side
        );

        this.addBush(
          group,
          seed + 44,
          side
        );
        break;

      case 5:
        this.addTree(
          group,
          seed,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 40,
          side
        );
        break;

      case 6:
        this.addRock(
          group,
          seed,
          side
        );
        break;

      case 7:
        this.addBush(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 50,
          side
        );
        break;

      case 8:
        this.addTree(
          group,
          seed,
          side
        );
        break;

      case 9:
        this.addFlowerCluster(
          group,
          seed,
          side
        );

        this.addBush(
          group,
          seed + 60,
          side
        );
        break;

      case 10:
        this.addRock(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 71,
          side
        );
        break;

      case 11:
        this.addTree(
          group,
          seed,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 70,
          side
        );
        break;

      default:
        break;
    }

    return group;
  }

  // =========================================================
  // Grass
  // =========================================================

  private addGrassCluster(
    group: THREE.Group,
    seed: number,
    side: -1 | 1
  ): void {
    const bladeCount =
      18;

    for (
      let i = 0;
      i < bladeCount;
      i++
    ) {
      const blade =
        new THREE.Mesh(
          this.grassBladeGeometry,
          this.grassMaterial
        );

      /*
       * Always place grass outward
       * from the road.
       */
      const outwardX =
        0.35 +
        this.seededRandom(
          seed + i * 11
        ) *
        5.2;

      const z =
        (
          this.seededRandom(
            seed + i * 17 + 100
          ) -
          0.5
        ) *
        10;

      blade.position.set(
        side * outwardX,
        0.45,
        z
      );

      const scale =
        0.95 +
        this.seededRandom(
          seed + i * 23 + 200
        ) *
        0.55;

      blade.scale.set(
        scale,
        scale,
        scale
      );

      blade.rotation.y =
        this.seededRandom(
          seed + i * 31 + 300
        ) *
        Math.PI;

      blade.frustumCulled =
        true;

      group.add(
        blade
      );
    }
  }

  // =========================================================
  // Tree
  // =========================================================

  private addTree(
    group: THREE.Group,
    seed: number,
    side: -1 | 1
  ): void {
    const tree =
      new THREE.Group();

    /*
     * Smaller tree scale than
     * previous M7.5/M7.6 version.
     */
    const treeScale =
      1.15 +
      this.seededRandom(
        seed + 500
      ) *
      0.5;

    tree.scale.setScalar(
      treeScale
    );

    const trunk =
      new THREE.Mesh(
        this.trunkGeometry,
        this.trunkMaterial
      );

    trunk.position.y =
      1.4;

    tree.add(
      trunk
    );

    const leavesBottom =
      new THREE.Mesh(
        this.leafGeometry,
        this.leafMaterial
      );

    leavesBottom.position.set(
      0,
      2.8,
      0
    );

    leavesBottom.scale.set(
      1.3,
      1.0,
      1.3
    );

    tree.add(
      leavesBottom
    );

    const leavesMiddle =
      new THREE.Mesh(
        this.leafGeometry,
        this.leafLightMaterial
      );

    leavesMiddle.position.set(
      -0.35,
      3.7,
      0.1
    );

    leavesMiddle.scale.set(
      1.0,
      0.9,
      1.0
    );

    tree.add(
      leavesMiddle
    );

    const leavesTop =
      new THREE.Mesh(
        this.leafGeometry,
        this.leafMaterial
      );

    leavesTop.position.set(
      0.2,
      4.5,
      -0.1
    );

    leavesTop.scale.set(
      0.78,
      0.78,
      0.78
    );

    tree.add(
      leavesTop
    );

    tree.position.x =
      side *
      (
        0.8 +
        this.seededRandom(
          seed + 504
        ) *
        2.2
      );

    tree.position.z =
      (
        this.seededRandom(
          seed + 505
        ) -
        0.5
      ) *
      7;

    tree.rotation.y =
      (
        this.seededRandom(
          seed + 506
        ) -
        0.5
      ) *
      0.6;

    tree.rotation.z =
      (
        this.seededRandom(
          seed + 507
        ) -
        0.5
      ) *
      0.08;

    group.add(
      tree
    );
  }

  // =========================================================
  // Bush
  // =========================================================

  private addBush(
    group: THREE.Group,
    seed: number,
    side: -1 | 1
  ): void {
    const bushGroup =
      new THREE.Group();

    const bushCount =
      2;

    for (
      let i = 0;
      i < bushCount;
      i++
    ) {
      const bush =
        new THREE.Mesh(
          this.bushGeometry,
          this.bushMaterial
        );

      const scale =
        0.9 +
        this.seededRandom(
          seed + i * 41 + 1000
        ) *
        0.6;

      bush.scale.set(
        scale * 1.25,
        scale,
        scale * 1.1
      );

      const outwardX =
        0.5 +
        this.seededRandom(
          seed + i * 43 + 1010
        ) *
        3.0;

      bush.position.set(
        side * outwardX,
        0.55,
        (
          this.seededRandom(
            seed + i * 47 + 1020
          ) -
          0.5
        ) *
        6
      );

      bush.rotation.y =
        this.seededRandom(
          seed + i * 53 + 1030
        ) *
        Math.PI;

      bush.frustumCulled =
        true;

      bushGroup.add(
        bush
      );
    }

    group.add(
      bushGroup
    );
  }

  // =========================================================
  // Flowers
  // =========================================================

  private addFlowerCluster(
    group: THREE.Group,
    seed: number,
    side: -1 | 1
  ): void {
    const flowerCount =
      8;

    for (
      let i = 0;
      i < flowerCount;
      i++
    ) {
      const materialIndex =
        Math.floor(
          this.seededRandom(
            seed + i * 61 + 1100
          ) *
          3
        );

      let material:
        THREE.MeshStandardMaterial;

      if (
        materialIndex === 0
      ) {
        material =
          this.flowerYellowMaterial;
      } else if (
        materialIndex === 1
      ) {
        material =
          this.flowerPinkMaterial;
      } else {
        material =
          this.flowerWhiteMaterial;
      }

      const flower =
        new THREE.Group();

      const stem =
        new THREE.Mesh(
          this.flowerStemGeometry,
          this.grassMaterial
        );

      stem.position.y =
        0.25;

      const head =
        new THREE.Mesh(
          this.flowerHeadGeometry,
          material
        );

      head.position.y =
        0.52;

      flower.add(
        stem
      );

      flower.add(
        head
      );

      const outwardX =
        0.4 +
        this.seededRandom(
          seed + i * 67 + 1150
        ) *
        4.0;

      flower.position.x =
        side * outwardX;

      flower.position.z =
        (
          this.seededRandom(
            seed + i * 71 + 1160
          ) -
          0.5
        ) *
        8;

      const scale =
        1.0 +
        this.seededRandom(
          seed + i * 73 + 1170
        ) *
        0.5;

      flower.scale.setScalar(
        scale
      );

      group.add(
        flower
      );
    }
  }

  // =========================================================
  // Rock
  // =========================================================

  private addRock(
    group: THREE.Group,
    seed: number,
    side: -1 | 1
  ): void {
    const rock =
      new THREE.Mesh(
        this.rockGeometry,
        this.rockMaterial
      );

    const scale =
      0.9 +
      this.seededRandom(
        seed + 1200
      ) *
      0.7;

    rock.scale.set(
      scale * 1.35,
      scale * 0.7,
      scale
    );

    rock.position.x =
      side *
      (
        0.7 +
        this.seededRandom(
          seed + 1201
        ) *
        3.8
      );

    rock.position.y =
      0.42;

    rock.position.z =
      (
        this.seededRandom(
          seed + 1202
        ) -
        0.5
      ) *
      8;

    rock.rotation.set(
      (
        this.seededRandom(
          seed + 1203
        ) -
        0.5
      ) *
      0.45,
      this.seededRandom(
        seed + 1204
      ) *
      Math.PI,
      (
        this.seededRandom(
          seed + 1205
        ) -
        0.5
      ) *
      0.35
    );

    rock.frustumCulled =
      true;

    group.add(
      rock
    );
  }

  // =========================================================
  // Update
  // =========================================================

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
      !this.loaded ||
      this.props.length === 0
    ) {
      return;
    }

    for (
      let i = 0;
      i < this.props.length;
      i++
    ) {
      const prop =
        this.props[i];

      const object =
        prop.object;

      /*
       * First-time placement.
       *
       * RaceNova forward direction:
       * decreasing world-Z.
       *
       * Therefore objects are placed
       * ahead of the player at playerZ-distance.
       */
      if (
        !Number.isFinite(
          object.position.z
        ) ||
        object.userData.environmentInitialized !== true
      ) {
        const slot =
          Math.floor(
            i / 2
          );

        const startDistance =
          30 +
          slot *
          this.spacing;

        const variation =
          (
            this.seededRandom(
              prop.seed + 1600
            ) -
            0.5
          ) *
          4;

        this.placeProp(
          prop,
          playerZ -
          startDistance +
          variation
        );

        object.userData.environmentInitialized =
                 true;

        continue;
      }

      /*
       * Recycle objects that have gone
       * behind the player.
       */
      if (
        object.position.z >
        playerZ +
        this.visibleBehind
      ) {
        this.recycleProp(
          prop,
          playerZ
        );
      }

      /*
       * Follow curved road center.
       *
       * Z is NOT changed every frame.
       * Only X follows the road curve.
       */
      this.updatePropX(
        prop
      );
    }
  }

  // =========================================================
  // Update Prop X
  // =========================================================

  private updatePropX(
    prop: EnvironmentProp
  ): void {
    const worldZ =
      prop.object.position.z;

    const centerX =
      this.getRoadCenterX(
        worldZ
      );

    const outwardDistance =
      this.roadWidth / 2 +
      this.sideOffset +
      1.0 +
      this.seededRandom(
        prop.seed + 1700
      ) *
      2.5;

    prop.object.position.x =
      centerX +
      prop.side *
      outwardDistance;

    /*
     * Absolute road safety.
     *
     * Environment can never cross
     * onto the playable road.
     */
    const minimumDistance =
      this.roadWidth / 2 +
      this.sideOffset;

    const distanceFromCenter =
      Math.abs(
        prop.object.position.x -
        centerX
      );

    if (
      distanceFromCenter <
      minimumDistance
    ) {
      prop.object.position.x =
        centerX +
        prop.side *
        minimumDistance;
    }

    prop.object.position.y =
      0;

    prop.object.rotation.x =
      0;

    prop.object.rotation.z =
      0;
  }

  // =========================================================
  // Place Prop
  // =========================================================

  private placeProp(
    prop: EnvironmentProp,
    worldZ: number
  ): void {
    prop.object.position.z =
      worldZ;

    prop.object.rotation.y =
      (
        this.seededRandom(
          prop.seed + 1401
        ) -
        0.5
      ) *
      0.18;

    this.updatePropX(
      prop
    );
  }

  // =========================================================
  // Recycle Prop
  // =========================================================

  private recycleProp(
    prop: EnvironmentProp,
    playerZ: number
  ): void {
    const recycleDistance =
      this.visibleAhead -
      10 +
      this.seededRandom(
        prop.seed + 1500
      ) *
      35;

    this.placeProp(
      prop,
      playerZ -
      recycleDistance
    );
  }

  // =========================================================
  // Seed
  // =========================================================

  private createSeed(
    index: number
  ): number {
    return (
      (
        index *
        1103515245 +
        12345
      ) >>>
      0
    );
  }

  private seededRandom(
    seed: number
  ): number {
    const value =
      Math.sin(
        seed *
        12.9898
      ) *
      43758.5453;

    return (
      value -
      Math.floor(
        value
      )
    );
  }

  // =========================================================
  // Ready
  // =========================================================

  public isReady(): boolean {
    return this.loaded;
  }

  // =========================================================
  // Dispose Props
  // =========================================================

  private disposeProps(): void {
    for (
      const prop of this.props
    ) {
      this.environmentGroup.remove(
        prop.object
      );
    }

    this.props.length =
      0;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.disposeProps();

    this.scene.remove(
      this.environmentGroup
    );

    this.grassBladeGeometry.dispose();
    this.trunkGeometry.dispose();
    this.leafGeometry.dispose();
    this.rockGeometry.dispose();
    this.bushGeometry.dispose();
    this.flowerStemGeometry.dispose();
    this.flowerHeadGeometry.dispose();

    this.grassMaterial.dispose();
    this.trunkMaterial.dispose();
    this.leafMaterial.dispose();
    this.leafLightMaterial.dispose();
    this.rockMaterial.dispose();
    this.bushMaterial.dispose();
    this.flowerYellowMaterial.dispose();
    this.flowerPinkMaterial.dispose();
    this.flowerWhiteMaterial.dispose();

    this.loaded =
      false;

    this.loading =
      false;
  }
}
