/**
 * ============================================================
 * RaceNova V2
 * Environment Manager
 * M7 - Roadside Environment
 * ============================================================
 *
 * Responsibilities:
 * - Load roadside vegetation GLB
 * - Create lightweight roadside prop pool
 * - Place vegetation on both sides of the road
 * - Follow the curved road center
 * - Recycle props as the player moves
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

  private readonly roadWidth: number;
  private readonly sideOffset: number;
  private readonly propCount: number;
  private readonly spacing: number;
  private readonly visibleAhead: number;
  private readonly visibleBehind: number;

  private readonly environmentGroup: THREE.Group;

  private readonly props: EnvironmentProp[] = [];
  private readonly sourceObjects: THREE.Object3D[] = [];

  private readonly loader: GLTFLoader;

  private loaded = false;
  private loading = false;

  private lastPlayerZ = 0;

  constructor(
    scene: THREE.Scene,
    getRoadCenterX: (worldZ: number) => number,
    config: EnvironmentManagerConfig = {}
  ) {
    this.scene = scene;

    this.getRoadCenterX =
      getRoadCenterX;

    this.roadWidth =
      config.roadWidth ?? 12;

    this.sideOffset =
      config.sideOffset ?? 2.0;

    this.propCount =
      Math.max(
        8,
        Math.floor(
          config.propCount ?? 32
        )
      );

    this.spacing =
      Math.max(
        8,
        config.spacing ?? 18
      );

    this.visibleAhead =
      Math.max(
        80,
        config.visibleAhead ?? 260
      );

    this.visibleBehind =
      Math.max(
        40,
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

  private readonly getRoadCenterX:
    (worldZ: number) => number;

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
     * The combined GLB contains multiple
     * top-level vegetation objects.
     *
     * We clone those objects individually
     * instead of cloning the entire pack.
     */

    for (
      const child of root.children
    ) {
      this.sourceObjects.push(
        child
      );
    }

    /*
     * Safety fallback:
     * If the GLB has no top-level children,
     * use the root itself.
     */

    if (
      this.sourceObjects.length === 0
    ) {
      this.sourceObjects.push(
        root
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

      this.prepareObject(
        clone
      );

      const seed =
        this.createSeed(i);

      this.applyScale(
        clone,
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
         * Roadside vegetation does not
         * participate in gameplay physics.
         */

        child.castShadow = false;
        child.receiveShadow = false;

        child.frustumCulled = true;
      }
    );
  }

  // =========================================================
  // Scale
  // =========================================================

  private applyScale(
    object: THREE.Object3D,
    seed: number
  ): void {
    /*
     * Keep vegetation visually varied
     * without becoming excessively large.
     */

    const variation =
      0.75 +
      this.seededRandom(seed) *
        0.55;

    object.scale.setScalar(
      variation
    );
  }

  // =========================================================
  // Seed
  // =========================================================

  private createSeed(
    index: number
  ): number {
    return (
      (index * 1103515245 +
        12345) >>>
      0
    );
  }

  private seededRandom(
    seed: number
  ): number {
    const value =
      Math.sin(seed * 12.9898) *
      43758.5453;

    return (
      value -
      Math.floor(value)
    );
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    playerZ: number
  ): void {
    if (
      !Number.isFinite(playerZ)
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
       * Keep each prop distributed
       * along the negative-Z racing path.
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
       * Add a small deterministic
       * longitudinal variation.
       */

      targetZ +=
        (
          this.seededRandom(
            prop.seed + 7
          ) -
          0.5
        ) *
        5;

      /*
       * If the prop is already positioned
       * near the target slot, do not move it.
       *
       * This prevents visible jitter.
       */

      if (
        Math.abs(
          object.position.z -
            targetZ
        ) >
        this.spacing * 1.5
      ) {
        this.placeProp(
          prop,
          targetZ
        );
      }

      /*
       * Recycle props that fall too far
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

    const distance =
      this.sideOffset +
      1.0 +
      sideRandom * 5.0;

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
     * Slight variation in rotation
     * makes repeated props look less uniform.
     */

    prop.object.rotation.y =
      (
        this.seededRandom(
          prop.seed + 61
        ) -
        0.5
      ) *
      Math.PI;

    /*
     * Put the object approximately
     * on the ground.
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
      object.position.y = 0;

      return;
    }

    object.position.y =
      -box.min.y;
  }

  // =========================================================
  // Recycle
  // =========================================================

  private recycleProp(
    prop: EnvironmentProp,
    playerZ: number
  ): void {
    const recycleDistance =
      this.visibleAhead;

    const randomOffset =
      (
        this.seededRandom(
          prop.seed + 101
        ) -
        0.5
      ) *
      10;

    const newZ =
      playerZ -
      recycleDistance -
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

    this.sourceObjects.length = 0;

    this.loaded = false;
    this.loading = false;
  }
}
