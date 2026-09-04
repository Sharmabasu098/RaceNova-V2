/**
 * ============================================================
 * RaceNova V2
 * Environment Manager
 * M7.4 - Procedural Endless Roadside Environment
 * ============================================================
 *
 * Responsibilities:
 * - Procedural roadside vegetation
 * - Endless roadside recycling
 * - Low-poly trees
 * - Brown tree trunks
 * - Green foliage
 * - Low-poly rocks
 * - Dense roadside grass details
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

  private readonly grassMaterial:
    THREE.MeshStandardMaterial;

  private readonly trunkGeometry:
    THREE.CylinderGeometry;

  private readonly trunkMaterial:
    THREE.MeshStandardMaterial;

  private readonly leafGeometry:
    THREE.IcosahedronGeometry;

  private readonly leafMaterial:
    THREE.MeshStandardMaterial;

  private readonly rockGeometry:
    THREE.DodecahedronGeometry;

  private readonly rockMaterial:
    THREE.MeshStandardMaterial;

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
     * Safe distance outside the road.
     */
    this.sideOffset =
      Math.max(
        3.0,
        config.sideOffset ?? 3.0
      );

    /*
     * Fixed pool.
     *
     * 40 props = 20 roadside slots
     * distributed across both sides.
     */
    this.propCount =
      Math.max(
        24,
        Math.floor(
          config.propCount ?? 40
        )
      );

    /*
     * Never allow large gaps.
     *
     * The current Engine may pass 18,
     * but grass details overlap between
     * neighboring slots.
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
    // Shared Materials
    // =======================================================

    this.grassMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x3f9b3f,
        roughness: 0.9,
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

    this.rockMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x777777,
        roughness: 1.0,
        metalness: 0.0
      });

    // =======================================================
    // Shared Geometry
    // =======================================================

    /*
     * Small grass blade.
     */
    this.grassBladeGeometry =
      new THREE.ConeGeometry(
        0.12,
        0.9,
        4
      );

    /*
     * Tree trunk.
     */
    this.trunkGeometry =
      new THREE.CylinderGeometry(
        0.18,
        0.28,
        2.8,
        6
      );

    /*
     * Low-poly foliage.
     */
    this.leafGeometry =
      new THREE.IcosahedronGeometry(
        1.15,
        1
      );

    /*
     * Low-poly rock.
     */
    this.rockGeometry =
      new THREE.DodecahedronGeometry(
        0.75,
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
      /*
       * No external asset is required.
       *
       * Environment is generated directly
       * from lightweight Three.js geometry.
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
     * Every slot receives grass details.
     *
     * This is what prevents the roadside
     * from looking empty between trees.
     */
    this.addGrassCluster(
      group,
      seed
    );

    /*
     * Trees appear regularly but not
     * on every slot.
     */
    if (
      index % 4 === 0 ||
      index % 7 === 0
    ) {
      this.addTree(
        group,
        seed
      );
    }

    /*
     * Rocks appear on some slots.
     */
    if (
      index % 3 === 0
    ) {
      this.addRock(
        group,
        seed
      );
    }

    return group;
  }

  // =========================================================
  // Grass Cluster
  // =========================================================

  private addGrassCluster(
    group: THREE.Group,
    seed: number
  ): void {
    /*
     * Several small blades are spread
     * across the whole roadside slot.
     *
     * Their depth range overlaps the
     * neighboring slot so there is no
     * obvious cut line.
     */
    const bladeCount = 8;

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

      const randomX =
        (
          this.seededRandom(
            seed +
            i *
            11
          ) -
          0.5
        ) *
        7.5;

      const randomZ =
        (
          this.seededRandom(
            seed +
            i *
            17 +
            100
          ) -
          0.5
        ) *
        12;

      blade.position.x =
        randomX;

      blade.position.y =
        0.45;

      blade.position.z =
        randomZ;

      const scale =
        0.75 +
        this.seededRandom(
          seed +
          i *
          23 +
          200
        ) *
        0.65;

      blade.scale.set(
        scale,
        scale,
        scale
      );

      blade.rotation.y =
        this.seededRandom(
          seed +
          i *
          31 +
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
     * Natural tree size.
     */
    const treeScale =
      1.5 +
      this.seededRandom(
        seed + 500
      ) *
      0.8;

    tree.scale.setScalar(
      treeScale
    );

    // =======================================================
    // Trunk
    // =======================================================

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

    // =======================================================
    // Foliage 1
    // =======================================================

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
      1.25,
      1.0,
      1.25
    );

    leavesBottom.castShadow =
      false;

    leavesBottom.receiveShadow =
      false;

    tree.add(
      leavesBottom
    );

    // =======================================================
    // Foliage 2
    // =======================================================

    const leavesMiddle =
      new THREE.Mesh(
        this.leafGeometry,
        this.leafMaterial
      );

    leavesMiddle.position.set(
      -0.35,
      3.7,
      0.1
    );

    leavesMiddle.scale.set(
      0.95,
      0.9,
      0.95
    );

    leavesMiddle.castShadow =
      false;

    leavesMiddle.receiveShadow =
      false;

    tree.add(
      leavesMiddle
    );

    // =======================================================
    // Foliage 3
    // =======================================================

    const leavesTop =
      new THREE.Mesh(
        this.leafGeometry,
        this.leafMaterial
      );

    leavesTop.position.set(
      0.2,
      4.45,
      -0.1
    );

    leavesTop.scale.set(
      0.75,
      0.75,
      0.75
    );

    leavesTop.castShadow =
      false;

    leavesTop.receiveShadow =
      false;

    tree.add(
      leavesTop
    );

    /*
     * Small deterministic rotation.
     */
    tree.rotation.y =
      (
        this.seededRandom(
          seed + 502
        ) -
        0.5
      ) *
      0.5;

    /*
     * Small natural lean.
     */
    tree.rotation.z =
      (
        this.seededRandom(
          seed + 503
        ) -
        0.5
      ) *
      0.08;

    /*
     * Move the tree within its
     * roadside slot.
     */
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

    group.add(
      tree
    );
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
      0.7 +
      this.seededRandom(
        seed + 600
      ) *
      0.7;

    rock.scale.set(
      scale * 1.25,
      scale * 0.65,
      scale
    );

    rock.position.x =
      (
        this.seededRandom(
          seed + 601
        ) -
        0.5
      ) *
      5;

    rock.position.y =
      0.45;

    rock.position.z =
      (
        this.seededRandom(
          seed + 602
        ) -
        0.5
      ) *
      8;

    rock.rotation.set(
      (
        this.seededRandom(
          seed + 603
        ) -
        0.5
      ) *
      0.4,
      this.seededRandom(
        seed + 604
      ) *
      Math.PI,
      (
        this.seededRandom(
          seed + 605
        ) -
        0.5
      ) *
      0.3
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
       * Each pair occupies one
       * longitudinal roadside slot.
       */
      const slot =
        Math.floor(
          i / 2
        );

      /*
       * Start slightly behind the player
       * so the roadside is already visible
       * when the race begins.
       */
      let targetZ =
        playerZ -
        45 -
        slot *
        this.spacing;

      /*
       * Small deterministic variation.
       */
      targetZ +=
        (
          this.seededRandom(
            prop.seed + 700
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

  // =========================================================
  // Place Prop
  // =========================================================

  private placeProp(
    prop: EnvironmentProp,
    worldZ: number
  ): void {
    const centerX =
      this.getRoadCenterX(
        worldZ
      );

    /*
     * Keep every object outside
     * the road and guardrail zone.
     */
    const randomDistance =
      this.seededRandom(
        prop.seed + 800
      ) *
      3.5;

    const distance =
      this.sideOffset +
      randomDistance;

    const x =
      centerX +
      prop.side *
      (
        this.roadWidth / 2 +
        distance
      );

    prop.object.position.x =
      x;

    prop.object.position.z =
      worldZ;

    /*
     * Keep generated environment upright.
     */
    prop.object.position.y =
      0;

    prop.object.rotation.x =
      0;

    prop.object.rotation.z =
      0;

    prop.object.rotation.y =
      (
        this.seededRandom(
          prop.seed + 801
        ) -
        0.5
      ) *
      0.15;
  }

  // =========================================================
  // Recycle
  // =========================================================

  private recycleProp(
    prop: EnvironmentProp,
    playerZ: number
  ): void {
    /*
     * Put the same pooled object
     * far ahead of the player.
     *
     * No new object is allocated.
     */
    const variation =
      (
        this.seededRandom(
          prop.seed + 900
        ) -
        0.5
      ) *
      5;

    const newZ =
      playerZ -
      this.visibleAhead -
      variation;

    this.placeProp(
      prop,
      newZ
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
    this.grassMaterial.dispose();

    this.trunkGeometry.dispose();
    this.trunkMaterial.dispose();

    this.leafGeometry.dispose();
    this.leafMaterial.dispose();

    this.rockGeometry.dispose();
    this.rockMaterial.dispose();

    this.loaded =
      false;

    this.loading =
      false;
  }
}
