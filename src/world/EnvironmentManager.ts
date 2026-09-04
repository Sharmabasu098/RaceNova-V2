/**
 * ============================================================
 * RaceNova V2
 * Environment Manager
 * M7 - Endless Roadside Environment
 * ============================================================
 *
 * Responsibilities:
 * - Load roadside vegetation GLB
 * - Create lightweight roadside prop pool
 * - Place vegetation on both sides of the road
 * - Follow the curved road center
 * - Recycle props endlessly as the player moves
 * - Normalize vegetation size for RaceNova world scale
 * - Keep mobile rendering lightweight
 *
 * IMPORTANT:
 * - No gameplay collision
 * - No economy dependency
 * - No audio dependency
 * - No modification to World.ts
 * ============================================================
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface EnvironmentManagerConfig {
  roadWidth?: number;
  sideOffset?: number;
  propCount?: number;
  spacing?: number;
  visibleAhead?: number;
  visibleBehind?: number;
}

interface EnvironmentProp {
  object: THREE.Object3D;
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

  private readonly environmentGroup: THREE.Group;

  private readonly props:
    EnvironmentProp[] = [];

  private readonly sourceObjects:
    THREE.Object3D[] = [];

  private readonly loader:
    GLTFLoader;

  private loaded = false;
  private loading = false;

  private lastPlayerZ = 0;

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
     * Keep vegetation outside the road
     * and outside the immediate guardrail area.
     */
    this.sideOffset =
      Math.max(
        2.5,
        config.sideOffset ?? 3.0
      );

    /*
     * Fixed pool for mobile performance.
     */
    this.propCount =
      Math.max(
        16,
        Math.floor(
          config.propCount ?? 32
        )
      );

    this.spacing =
      Math.max(
        12,
        config.spacing ?? 18
      );

    this.visibleAhead =
      Math.max(
        160,
        config.visibleAhead ?? 260
      );

    this.visibleBehind =
      Math.max(
        60,
        config.visibleBehind ?? 100
      );

    this.environmentGroup =
      new THREE.Group();

    this.environmentGroup.name =
      "RoadsideEnvironment";

    this.scene.add(
      this.environmentGroup
    );

    this.loader =
      new GLTFLoader();
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
      const baseUrl =
        import.meta.env.BASE_URL;

      const assetUrl =
        `${baseUrl}assets/environment/vegetation/vegetation-pack.glb`;

      const gltf =
        await this.loader.loadAsync(
          assetUrl
        );

      const root =
        gltf.scene;

      this.collectSourceObjects(
        root
      );

      if (
        this.sourceObjects.length === 0
      ) {
        console.warn(
          "[EnvironmentManager] No vegetation objects found."
        );

        return;
      }

      this.createPropPool();

      this.loaded = true;

      /*
       * Initial placement.
       */
      this.update(
        this.lastPlayerZ
      );
    } catch (error) {
      console.error(
        "[EnvironmentManager] Failed to load vegetation-pack.glb.",
        error
      );
    } finally {
      this.loading = false;
    }
  }

  // =========================================================
  // Collect Source Objects
  // =========================================================

  private collectSourceObjects(
    root: THREE.Object3D
  ): void {
    this.sourceObjects.length = 0;

    /*
     * The GLB is a combined vegetation pack.
     *
     * Keep each top-level object separate
     * so the pool can reuse individual
     * trees, rocks and vegetation pieces.
     */
    for (
      const child of root.children
    ) {
      const clone =
        child.clone(true);

      clone.updateMatrixWorld(
        true
      );

      this.sourceObjects.push(
        clone
      );
    }

    /*
     * Safety fallback.
     */
    if (
      this.sourceObjects.length === 0
    ) {
      const clone =
        root.clone(true);

      clone.updateMatrixWorld(
        true
      );

      this.sourceObjects.push(
        clone
      );
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
      const sourceIndex =
        i %
        this.sourceObjects.length;

      const source =
        this.sourceObjects[
          sourceIndex
        ];

      const side: -1 | 1 =
        i % 2 === 0
          ? -1
          : 1;

      const clone =
        source.clone(true);

      clone.name =
        `RoadsideProp_${i}`;

      const seed =
        this.createSeed(i);

      this.prepareObject(
        clone
      );

      /*
       * Normalize the actual GLB dimensions.
       *
       * This is important because the
       * vegetation pack contains objects
       * with very different natural sizes.
       */
      this.normalizeObjectScale(
        clone,
        sourceIndex,
        seed
      );

      this.environmentGroup.add(
        clone
      );

      this.props.push({
        object: clone,
        side,
        seed
      });
    }
  }

  // =========================================================
  // Prepare Object
  // =========================================================

  private prepareObject(
    object: THREE.Object3D
  ): void {
    object.traverse(
      (child) => {
        if (
          !(child instanceof THREE.Mesh)
        ) {
          return;
        }

        /*
         * Roadside vegetation is decorative only.
         */
        child.castShadow = false;
        child.receiveShadow = false;

        /*
         * Let Three.js skip objects
         * outside the camera frustum.
         */
        child.frustumCulled = true;
      }
    );
  }

  // =========================================================
  // Normalize Object Scale
  // =========================================================

  private normalizeObjectScale(
    object: THREE.Object3D,
    sourceIndex: number,
    seed: number
  ): void {
    object.updateMatrixWorld(
      true
    );

    const box =
      new THREE.Box3()
        .setFromObject(
          object
        );

    const size =
      new THREE.Vector3();

    box.getSize(
      size
    );

    const height =
      Math.max(
        size.y,
        0.001
      );

    const width =
      Math.max(
        size.x,
        size.z
      );

    /*
     * The current vegetation pack contains:
     *
     * - leaf object
     * - rocks
     * - trees
     * - trunks / smaller vegetation
     *
     * Material names are not always reliable,
     * so dimensions are also used.
     */
    const category =
      this.getObjectCategory(
        object,
        sourceIndex,
        height,
        width
      );

    let targetHeight: number;

    switch (category) {
      case "tree":
        /*
         * Natural roadside tree size.
         */
        targetHeight =
          5.0 +
          this.seededRandom(
            seed + 201
          ) *
          1.5;
        break;

      case "rock":
        /*
         * Small roadside rocks.
         */
        targetHeight =
          0.7 +
          this.seededRandom(
            seed + 202
          ) *
          0.7;
        break;

      case "grass":
        /*
         * Small decorative vegetation.
         */
        targetHeight =
          0.45 +
          this.seededRandom(
            seed + 203
          ) *
          0.45;
        break;

      default:
        /*
         * Safe size for unknown objects.
         */
        targetHeight =
          1.0 +
          this.seededRandom(
            seed + 204
          ) *
          0.8;
        break;
    }

    /*
     * Scale according to actual GLB height.
     *
     * This prevents giant trees/trunks
     * from entering the road.
     */
    const scale =
      targetHeight /
      height;

    object.scale.setScalar(
      scale
    );

    /*
     * Keep width under control as well.
     *
     * This is especially important for
     * wide tree canopies and rocks.
     */
    const maxWidth =
      category === "tree"
        ? 4.5
        : category === "rock"
          ? 1.8
          : category === "grass"
            ? 1.2
            : 2.0;

    const scaledWidth =
      width *
      scale;

    if (
      scaledWidth >
      maxWidth
    ) {
      const widthScale =
        maxWidth /
        scaledWidth;

      object.scale.multiplyScalar(
        widthScale
      );
    }
  }

  // =========================================================
  // Object Category
  // =========================================================

  private getObjectCategory(
    object: THREE.Object3D,
    sourceIndex: number,
    height: number,
    width: number
  ):
    "tree" |
    "rock" |
    "grass" |
    "other" {
    let hasRockMaterial = false;
    let hasLeafMaterial = false;

    object.traverse(
      (child) => {
        if (
          !(child instanceof THREE.Mesh)
        ) {
          return;
        }

        const materials =
          Array.isArray(
            child.material
          )
            ? child.material
            : [
                child.material
              ];

        for (
          const material of materials
        ) {
          const name =
            (
              material.name ??
              ""
            ).toLowerCase();

          if (
            name.includes(
              "rock"
            )
          ) {
            hasRockMaterial = true;
          }

          if (
            name.includes(
              "leaf"
            )
          ) {
            hasLeafMaterial = true;
          }
        }
      }
    );

    if (
      hasRockMaterial
    ) {
      return "rock";
    }

    if (
      hasLeafMaterial
    ) {
      return "tree";
    }

    /*
     * Current pack contains several
     * unnamed-material vegetation objects.
     *
     * Tall objects are treated as trees.
     */
    if (
      height >= 5
    ) {
      return "tree";
    }

    /*
     * Very small objects are grass.
     */
    if (
      height <= 2.4 &&
      width <= 2.0
    ) {
      return "grass";
    }

    /*
     * Medium compact objects are treated
     * as small roadside decoration.
     */
    if (
      height <= 3 &&
      width <= 4
    ) {
      return "rock";
    }

    /*
     * Final fallback.
     */
    void sourceIndex;

    return "other";
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
       * Two props per longitudinal slot:
       *
       * left  + right
       *
       * This keeps the road visually
       * surrounded on both sides.
       */
      const slot =
        Math.floor(
          i / 2
        );

      let targetZ =
        playerZ -
        40 -
        slot *
        this.spacing;

      /*
       * Deterministic longitudinal variation.
       */
      targetZ +=
        (
          this.seededRandom(
            prop.seed + 7
          ) -
          0.5
        ) *
        6;

      /*
       * Place/reposition only when
       * the prop has moved sufficiently
       * away from its intended slot.
       *
       * This avoids visible jitter.
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
       * Endless recycling:
       *
       * Once a prop moves behind the player,
       * send it far ahead again.
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
       * Safety check:
       *
       * If a prop somehow gets too far
       * outside the forward environment,
       * reposition it.
       */
      if (
        object.position.z <
        playerZ -
        this.visibleAhead -
        this.spacing
      ) {
        this.placeProp(
          prop,
          targetZ
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

    const sideRandom =
      this.seededRandom(
        prop.seed + 31
      );

    /*
     * Road width / 2 = road edge.
     *
     * Add a safe roadside offset.
     */
    const distance =
      this.sideOffset +
      sideRandom *
      4.0;

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
     * Keep vegetation upright.
     *
     * Only rotate around Y axis.
     */
    prop.object.rotation.x =
      0;

    prop.object.rotation.z =
      0;

    prop.object.rotation.y =
      (
        this.seededRandom(
          prop.seed + 61
        ) -
        0.5
      ) *
      Math.PI;

    /*
     * Put object on ground.
     */
    this.placeOnGround(
      prop.object
    );
  }

  // =========================================================
  // Ground Placement
  // =========================================================

  private placeOnGround(
    object: THREE.Object3D
  ): void {
    object.updateMatrixWorld(
      true
    );

    const box =
      new THREE.Box3()
        .setFromObject(
          object
        );

    if (
      !Number.isFinite(
        box.min.y
      )
    ) {
      object.position.y =
        0;

      return;
    }

    /*
     * Compensate for the object's
     * bounding-box bottom.
     */
    object.position.y -=
      box.min.y;
  }

  // =========================================================
  // Recycle
  // =========================================================

  private recycleProp(
    prop: EnvironmentProp,
    playerZ: number
  ): void {
    const randomOffset =
      (
        this.seededRandom(
          prop.seed + 101
        ) -
        0.5
      ) *
      10;

    /*
     * Send recycled object ahead
     * of the player.
     *
     * This makes the roadside effectively
     * endless without creating new objects.
     */
    const newZ =
      playerZ -
      this.visibleAhead -
      randomOffset;

    this.placeProp(
      prop,
      newZ
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

    this.props.length = 0;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.disposeProps();

    this.scene.remove(
      this.environmentGroup
    );

    this.sourceObjects.length =
      0;

    this.loaded =
      false;

    this.loading =
      false;
  }
}
