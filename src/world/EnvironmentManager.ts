/**
 * ============================================================
 * RaceNova V2
 * Environment Manager
 * M7.5 - Dense Endless Roadside Environment
 * ============================================================
 *
 * Responsibilities:
 * - Procedural roadside environment
 * - Endless roadside recycling
 * - Large low-poly trees
 * - Brown tree trunks
 * - Green foliage
 * - Dense grass
 * - Bushes
 * - Colourful flowers
 * - Low-poly rocks
 * - Natural randomized distribution
 * - Mobile-friendly fixed object pool
 * - Curved-road compatible placement
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

    /*
     * Always keep environment outside
     * the playable road.
     */
    this.sideOffset =
      Math.max(
        3.0,
        config.sideOffset ?? 3.0
      );

    /*
     * Fixed object pool.
     *
     * More slots give us a fuller
     * roadside without creating objects
     * continuously during gameplay.
     */
    this.propCount =
      Math.max(
        32,
        Math.floor(
          config.propCount ?? 48
        )
      );

    /*
     * Dense longitudinal distribution.
     */
    this.spacing =
      Math.min(
        12,
        Math.max(
          8,
          config.spacing ?? 10
        )
      );

    this.visibleAhead =
      Math.max(
        180,
        config.visibleAhead ?? 280
      );

    this.visibleBehind =
      Math.max(
        70,
        config.visibleBehind ?? 110
      );

    // =======================================================
    // Environment Group
    // =======================================================

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
      /*
       * Completely procedural.
       *
       * No external GLB is loaded.
       */
      this.createPropPool();

      this.loaded = true;

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
          i
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
    index: number
  ): THREE.Group {
    const group =
      new THREE.Group();

    group.name =
      `ProceduralRoadsideProp_${index}`;

    /*
     * Every slot gets grass.
     *
     * This fills empty areas between
     * larger roadside objects.
     */
    this.addGrassCluster(
      group,
      seed
    );

    /*
     * Natural mixed distribution.
     *
     * Different slots contain different
     * combinations instead of repeating
     * the same object.
     */

    const pattern =
      index % 12;

    switch (pattern) {
      case 0:
        this.addTree(
          group,
          seed
        );

        this.addRock(
          group,
          seed + 10
        );

        break;

      case 1:
        this.addBush(
          group,
          seed
        );

        this.addFlowerCluster(
          group,
          seed + 20
        );

        break;

      case 2:
        this.addTree(
          group,
          seed
        );

        break;

      case 3:
        this.addRock(
          group,
          seed
        );

        this.addFlowerCluster(
          group,
          seed + 30
        );

        break;

      case 4:
        this.addBush(
          group,
          seed
        );

        break;

      case 5:
        this.addTree(
          group,
          seed
        );

        this.addFlowerCluster(
          group,
          seed + 40
        );

        break;

      case 6:
        this.addRock(
          group,
          seed
        );

        break;

      case 7:
        this.addBush(
          group,
          seed
        );

        this.addRock(
          group,
          seed + 50
        );

        break;

      case 8:
        this.addTree(
          group,
          seed
        );

        break;

      case 9:
        this.addFlowerCluster(
          group,
          seed
        );

        this.addBush(
          group,
          seed + 60
        );

        break;

      case 10:
        this.addRock(
          group,
          seed
        );

        break;

      case 11:
        this.addTree(
          group,
          seed
        );

        this.addFlowerCluster(
          group,
          seed + 70
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
    seed: number
  ): void {
    /*
     * Dense grass.
     *
     * Multiple blades overlap across
     * the longitudinal slot so the
     * roadside does not look like
     * isolated cut pieces.
     */
    const bladeCount = 14;

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

      const x =
        (
          this.seededRandom(
            seed +
            i * 11
          ) -
          0.5
        ) *
        7.5;

      const z =
        (
          this.seededRandom(
            seed +
            i * 17 +
            100
          ) -
          0.5
        ) *
        13;

      blade.position.set(
        x,
        0.45,
        z
      );

      const scale =
        0.75 +
        this.seededRandom(
          seed +
          i * 23 +
          200
        ) *
        0.7;

      blade.scale.set(
        scale,
        scale,
        scale
      );

      blade.rotation.y =
        this.seededRandom(
          seed +
          i * 31 +
          300
        ) *
        Math.PI;

      blade.castShadow =
        false;

      blade.receiveShadow =
        false;

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
    seed: number
  ): void {
    const tree =
      new THREE.Group();

    /*
     * Large but still believable
     * roadside tree.
     */
    const treeScale =
      1.45 +
      this.seededRandom(
        seed + 500
      ) *
      0.9;

    tree.scale.setScalar(
      treeScale
    );

    // -------------------------------------------------------
    // Trunk
    // -------------------------------------------------------

    const trunk =
      new THREE.Mesh(
        this.trunkGeometry,
        this.trunkMaterial
      );

    trunk.position.y =
      1.4;

    trunk.rotation.y =
      (
        this.seededRandom(
          seed + 501
        ) -
        0.5
      ) *
      0.2;

    trunk.castShadow =
      false;

    trunk.receiveShadow =
      false;

    tree.add(
      trunk
    );

    // -------------------------------------------------------
    // Lower foliage
    // -------------------------------------------------------

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

    leavesBottom.castShadow =
      false;

    leavesBottom.receiveShadow =
      false;

    tree.add(
      leavesBottom
    );

    // -------------------------------------------------------
    // Middle foliage
    // -------------------------------------------------------

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

    leavesMiddle.castShadow =
      false;

    leavesMiddle.receiveShadow =
      false;

    tree.add(
      leavesMiddle
    );

    // -------------------------------------------------------
    // Top foliage
    // -------------------------------------------------------

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

    leavesTop.castShadow =
      false;

    leavesTop.receiveShadow =
      false;

    tree.add(
      leavesTop
    );

    // -------------------------------------------------------
    // Natural variation
    // -------------------------------------------------------

    tree.position.x =
      (
        this.seededRandom(
          seed + 504
        ) -
        0.5
      ) *
      4.5;

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
    seed: number
  ): void {
    const bushGroup =
      new THREE.Group();

    const bushCount = 2;

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
        0.65 +
        this.seededRandom(
          seed +
          i * 41 +
          1000
        ) *
        0.55;

      bush.scale.set(
        scale * 1.25,
        scale,
        scale * 1.1
      );

      bush.position.set(
        (
          this.seededRandom(
            seed +
            i * 43 +
            1010
          ) -
          0.5
        ) *
        3.5,
        0.55,
        (
          this.seededRandom(
            seed +
            i * 47 +
            1020
          ) -
          0.5
        ) *
        6
      );

      bush.rotation.y =
        this.seededRandom(
          seed +
          i * 53 +
          1030
        ) *
        Math.PI;

      bush.castShadow =
        false;

      bush.receiveShadow =
        false;

      bush.frustumCulled =
        true;

      bushGroup.add(
        bush
      );
    }

    bushGroup.position.y =
      0;

    group.add(
      bushGroup
    );
  }

  // =========================================================
  // Flowers
  // =========================================================

  private addFlowerCluster(
    group: THREE.Group,
    seed: number
  ): void {
    const flowerCount = 5;

    for (
      let i = 0;
      i < flowerCount;
      i++
    ) {
      const materialIndex =
        Math.floor(
          this.seededRandom(
            seed +
            i * 61 +
            1100
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
          new THREE.IcosahedronGeometry(
            0.14,
            0
          ),
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

      flower.position.x =
        (
          this.seededRandom(
            seed +
            i * 67 +
            1150
          ) -
          0.5
        ) *
        5;

      flower.position.z =
        (
          this.seededRandom(
            seed +
            i * 71 +
            1160
          ) -
          0.5
        ) *
        9;

      const scale =
        0.8 +
        this.seededRandom(
          seed +
          i * 73 +
          1170
        ) *
        0.55;

      flower.scale.setScalar(
        scale
      );

      flower.rotation.y =
        this.seededRandom(
          seed +
          i * 79 +
          1180
        ) *
        Math.PI;

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
    seed: number
  ): void {
    const rock =
      new THREE.Mesh(
        this.rockGeometry,
        this.rockMaterial
      );

    const scale =
      0.75 +
      this.seededRandom(
        seed + 1200
      ) *
      0.85;

    rock.scale.set(
      scale * 1.35,
      scale * 0.7,
      scale
    );

    rock.position.x =
      (
        this.seededRandom(
          seed + 1201
        ) -
        0.5
      ) *
      5;

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

    rock.castShadow =
      false;

    rock.receiveShadow =
      false;

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
       * One longitudinal slot for
       * every left/right pair.
       */
      const slot =
        Math.floor(
          i / 2
        );

      /*
       * Start behind the player.
       */
      let targetZ =
        playerZ -
        45 -
        slot *
        this.spacing;

      /*
       * Small deterministic offset.
       */
      targetZ +=
        (
          this.seededRandom(
            prop.seed + 1300
          ) -
          0.5
        ) *
        3;

      /*
       * Initial placement.
       */
      if (
        Math.abs(
          object.position.z -
          targetZ
        ) >
        this.spacing *
        1.5
      ) {
        this.placeProp(
          prop,
          targetZ
        );
      }

      /*
       * Endless recycling.
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
    }
  }
       
