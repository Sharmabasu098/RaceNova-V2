/**
 * ============================================================
 * RaceNova V2
 * Environment Manager
 * M7.8 - Dense Endless Field Environment
 * ============================================================
 *
 * Responsibilities:
 * - Procedural roadside environment
 * - Wide continuous field distribution
 * - Both-side dense environment
 * - More trees
 * - Dense grass
 * - Flowers
 * - Bush groups
 * - Rock groups
 * - Environment visible from race start
 * - Endless fixed-pool recycling
 * - Curved-road compatible placement
 * - No vegetation on playable road
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
    this.scene =
      scene;

    this.getRoadCenterX =
      getRoadCenterX;

    this.roadWidth =
      Math.max(
        1,
        config.roadWidth ?? 12
      );

    this.sideOffset =
      Math.max(
        3.0,
        config.sideOffset ?? 3.0
      );

    /*
     * M7.8
     *
     * More pooled groups.
     * 36 slots per side.
     */
    this.propCount =
      Math.max(
        72,
        Math.floor(
          config.propCount ?? 72
        )
      );

    /*
     * M7.8
     *
     * Smaller spacing gives a
     * more continuous environment.
     */
    this.spacing =
      Math.min(
        10,
        Math.max(
          7,
          config.spacing ?? 8
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
      "ProceduralDenseFieldEnvironment";

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

    this.loading =
      true;

    try {
      this.createPropPool();

      this.loaded =
        true;

      this.update(
        this.lastPlayerZ
      );
    } catch (error) {
      console.error(
        "[EnvironmentManager] Failed to create procedural environment.",
        error
      );
    } finally {
      this.loading =
        false;
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
      `ProceduralDenseFieldProp_${index}`;

    /*
     * Every pooled group receives
     * a wide grass field cluster.
     */
    this.addGrassCluster(
      group,
      seed,
      side
    );

    /*
     * 24-pattern distribution.
     *
     * Trees intentionally appear more
     * frequently than M7.7.
     */
    const pattern =
      index % 24;

    switch (pattern) {
      case 0:
      case 1:
      case 2:
      case 3:
        this.addTree(
          group,
          seed,
          side
        );
        break;

      case 4:
        this.addTree(
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

      case 5:
        this.addTree(
          group,
          seed,
          side
        );

        this.addBush(
          group,
          seed + 30,
          side
        );
        break;

      case 6:
        this.addTree(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 40,
          side
        );
        break;

      case 7:
        this.addBush(
          group,
          seed,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 50,
          side
        );
        break;

      case 8:
        this.addBush(
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

      case 9:
        this.addFlowerCluster(
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

      case 10:
        this.addRock(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 80,
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
          seed + 90,
          side
        );

        this.addBush(
          group,
          seed + 100,
          side
        );
        break;

      case 12:
        this.addTree(
          group,
          seed,
          side
        );

        this.addTree(
          group,
          seed + 110,
          side
        );
        break;

      case 13:
        this.addTree(
          group,
          seed,
          side
        );

        this.addBush(
          group,
          seed + 120,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 130,
          side
        );
        break;

      case 14:
        this.addBush(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 140,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 150,
          side
        );
        break;

      case 15:
        this.addTree(
          group,
          seed,
          side
        );
        break;

      case 16:
        this.addTree(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 160,
          side
        );
        break;

      case 17:
        this.addFlowerCluster(
          group,
          seed,
          side
        );

        this.addBush(
          group,
          seed + 170,
          side
        );
        break;

      case 18:
        this.addTree(
          group,
          seed,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 180,
          side
        );
        break;

      case 19:
        this.addBush(
          group,
          seed,
          side
        );

        this.addBush(
          group,
          seed + 190,
          side
        );

        this.addRock(
          group,
          seed + 200,
          side
        );
        break;

      case 20:
        this.addTree(
          group,
          seed,
          side
        );

        this.addTree(
          group,
          seed + 210,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 220,
          side
        );
        break;

      case 21:
        this.addRock(
          group,
          seed,
          side
        );

        this.addRock(
          group,
          seed + 230,
          side
        );

        this.addFlowerCluster(
          group,
          seed + 240,
          side
        );
        break;

      case 22:
        this.addTree(
          group,
          seed,
          side
        );

        this.addBush(
          group,
          seed + 250,
          side
        );
        break;

      case 23:
        this.addTree(
          group,
          seed,
          side
        );

        this.addTree(
          group,
          seed + 260,
          side
        );

        this.addBush(
          group,
          seed + 270,
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
    /*
     * M7.8
     *
     * More blades per pooled group.
     */
    const bladeCount =
      30;

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
       * Wide field distribution.
       *
       * The road-safe clamp in placeProp()
       * keeps the whole group outside the road.
       */
      const outwardX =
        0.35 +
        this.seededRandom(
          seed + i * 11
        ) *
        14.0;

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
     * LOCKED TREE SIZE.
     *
     * Do not reduce this scale.
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

    /*
     * Trees are distributed wider into the field.
     */
    tree.position.x =
      side *
      (
        1.0 +
        this.seededRandom(
          seed + 504
        ) *
        10.0
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

    /*
     * M7.8 bush cluster.
     */
    const bushCount =
      3;

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
        0.8 +
        this.seededRandom(
          seed + i * 43 + 1010
        ) *
        10.0;

      bush.position.set(
        side * outwardX,
        0.55,
        (
          this.seededRandom(
            seed + i * 47 + 1020
          ) -
          0.5
        ) *
        8
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
    /*
     * M7.8
     */
    const flowerCount =
      12;

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
        0.5 +
        this.seededRandom(
          seed + i * 67 + 1150
        ) *
        12.0;

      flower.position.x =
        side * outwardX;

            flower.position.z =
        (
          this.seededRandom(
            seed + i * 71 + 1160
          ) -
          0.5
        ) *
        9;

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
        0.8 +
        this.seededRandom(
          seed + 1201
        ) *
        11.0
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
      9;

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
       */
      if (
        object.userData.environmentInitialized !==
        true
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
      }

      /*
       * Endless recycling.
       *
       * When a prop moves behind the
       * visible range, recycle it ahead.
       */
      if (
        object.position.z >
        playerZ +
        this.visibleBehind
      ) {
        const recycleDistance =
          this.visibleAhead +
          this.seededRandom(
            prop.seed + 1700
          ) *
          80;

        this.placeProp(
          prop,
          playerZ -
          recycleDistance
        );
      }

      /*
       * Keep the prop's X position aligned
       * with the curved road.
       */
      this.updatePropX(
        prop
      );
    }
  }

  // =========================================================
  // Place Prop
  // =========================================================

  private placeProp(
    prop: EnvironmentProp,
    worldZ: number
  ): void {
    const object =
      prop.object;

    object.position.z =
      worldZ;

    this.updatePropX(
      prop
    );
  }

  // =========================================================
  // Update Prop X
  // =========================================================

  private updatePropX(
    prop: EnvironmentProp
  ): void {
    const object =
      prop.object;

    const worldZ =
      object.position.z;

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

    /*
     * Keep complete environment group
     * safely outside the playable road.
     *
     * Group-local child positions are
     * distributed outward into the field.
     */
    const safeRoadHalfWidth =
      this.roadWidth *
      0.5 +
      this.sideOffset;

    const fieldOffset =
      safeRoadHalfWidth +
      0.5 +
      this.seededRandom(
        prop.seed + 1800
      ) *
      2.5;

    object.position.x =
      roadCenterX +
      prop.side *
      fieldOffset;
  }

  // =========================================================
  // Ready
  // =========================================================

  public isReady(): boolean {
    return this.loaded;
  }

  // =========================================================
  // Seed
  // =========================================================

  private createSeed(
    index: number
  ): number {
    /*
     * Deterministic integer seed.
     */
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
  
