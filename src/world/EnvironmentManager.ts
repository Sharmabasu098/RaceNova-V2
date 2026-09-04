/**
 * ============================================================
 * RaceNova V2
 * Environment Manager
 * M7.2 - Endless Roadside Environment
 * ============================================================
 *
 * Responsibilities:
 * - Load roadside vegetation GLB
 * - Create lightweight pooled vegetation
 * - Keep roadside vegetation endless
 * - Place vegetation outside the road
 * - Use larger natural-looking props
 * - Reduce visible grass gaps
 * - Apply safe fallback colors when GLB materials are plain
 * - Follow curved road center
 * - Recycle props as player moves
 *
 * IMPORTANT:
 * - No gameplay collision
 * - No economy dependency
 * - No audio dependency
 * - No modification to World.ts
 * - Mobile-first pooled rendering
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
  category:
    | "tree"
    | "rock"
    | "grass"
    | "other";
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

  private readonly sourceObjects:
    THREE.Object3D[] = [];

  private readonly sourceCategories:
    (
      | "tree"
      | "rock"
      | "grass"
      | "other"
    )[] = [];

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
     * Keep all decorative objects
     * safely outside the road.
     */
    this.sideOffset =
      Math.max(
        3.0,
        config.sideOffset ?? 3.0
      );

    /*
     * Fixed pool.
     *
     * More objects than before so the
     * roadside does not look empty.
     */
    this.propCount =
      Math.max(
        24,
        Math.floor(
          config.propCount ?? 40
        )
      );

    /*
     * Smaller slot spacing gives denser
     * roadside decoration.
     */
    this.spacing =
      Math.max(
        10,
        config.spacing ?? 14
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
    this.sourceCategories.length = 0;

    root.updateMatrixWorld(
      true
    );

    for (
      const child of root.children
    ) {
      const clone =
        child.clone(true);

      clone.updateMatrixWorld(
        true
      );

      const category =
        this.detectCategory(
          clone,
          this.sourceObjects.length
        );

      this.sourceObjects.push(
        clone
      );

      this.sourceCategories.push(
        category
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

      this.sourceCategories.push(
        "other"
      );
    }
  }

  // =========================================================
  // Detect Category
  // =========================================================

  private detectCategory(
    object: THREE.Object3D,
    sourceIndex: number
  ):
    | "tree"
    | "rock"
    | "grass"
    | "other" {
    let hasLeaf = false;
    let hasRock = false;

    let meshCount = 0;

    object.traverse(
      (child) => {
        if (
          !(child instanceof THREE.Mesh)
        ) {
          return;
        }

        meshCount++;

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
              "leaf"
            ) ||
            name.includes(
              "tree"
            )
          ) {
            hasLeaf = true;
          }

          if (
            name.includes(
              "rock"
            )
          ) {
            hasRock = true;
          }
        }
      }
    );

    if (hasRock) {
      return "rock";
    }

    if (hasLeaf) {
      return "tree";
    }

    /*
     * Measure object dimensions.
     */
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
     * Tall objects are trees.
     */
    if (
      height >= 4.0
    ) {
      return "tree";
    }

    /*
     * Small thin objects are grass.
     */
    if (
      height <= 2.5 &&
      width <= 2.5 &&
      meshCount > 0
    ) {
      return "grass";
    }

    /*
     * Compact medium objects are rocks.
     */
    if (
      height <= 3.5 &&
      width <= 4.0
    ) {
      return "rock";
    }

    /*
     * A few assets in the combined pack
     * may be trunks or unnamed vegetation.
     *
     * Use source position as a deterministic
     * fallback classification.
     */
    if (
      sourceIndex % 3 === 0
    ) {
      return "tree";
    }

    return "other";
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

      const category =
        this.sourceCategories[
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
        clone,
        category
      );

      this.normalizeObjectScale(
        clone,
        category,
        seed
      );

      this.applyFallbackMaterials(
        clone,
        category
      );

      this.environmentGroup.add(
        clone
      );

      this.props.push({
        object: clone,
        side,
        seed,
        category
      });
    }
  }

  // =========================================================
  // Prepare Object
  // =========================================================

  private prepareObject(
    object: THREE.Object3D,
    category:
      | "tree"
      | "rock"
      | "grass"
      | "other"
  ): void {
    object.traverse(
      (child) => {
        if (
          !(child instanceof THREE.Mesh)
        ) {
          return;
        }

        child.castShadow = false;
        child.receiveShadow = false;

        child.frustumCulled = true;

        /*
         * Decorative roadside objects
         * never participate in gameplay.
         */
        child.matrixAutoUpdate = true;

        void category;
      }
    );
  }

  // =========================================================
  // Normalize Scale
  // =========================================================

  private normalizeObjectScale(
    object: THREE.Object3D,
    category:
      | "tree"
      | "rock"
      | "grass"
      | "other",
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

    let targetHeight: number;

    switch (category) {
      case "tree":
        /*
         * Bigger trees.
         */
        targetHeight =
          6.5 +
          this.seededRandom(
            seed + 200
          ) *
          2.5;
        break;

      case "rock":
        /*
         * Clearly visible roadside rocks.
         */
        targetHeight =
          1.0 +
          this.seededRandom(
            seed + 201
          ) *
          1.0;
        break;

      case "grass":
        /*
         * Grass is kept low.
         *
         * It will be placed densely so
         * individual patches are less obvious.
         */
        targetHeight =
          0.7 +
          this.seededRandom(
            seed + 202
          ) *
          0.5;
        break;

      default:
        targetHeight =
          1.5 +
          this.seededRandom(
            seed + 203
          ) *
          1.0;
        break;
    }

    const scale =
      targetHeight /
      height;

    object.scale.setScalar(
      scale
    );
  }

  // =========================================================
  // Fallback Materials
  // =========================================================

  private applyFallbackMaterials(
  object: THREE.Object3D,
  category:
    | "tree"
    | "rock"
    | "grass"
    | "other"
): void {
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

      const clonedMaterials =
        materials.map(
          (material) => {
            const cloned =
              material.clone();

            const materialName =
              (
                cloned.name ??
                ""
              ).toLowerCase();

            /*
             * Preserve real textures.
             */
            if (
              "map" in cloned &&
              (
                cloned as THREE.MeshStandardMaterial
              ).map
            ) {
              return cloned;
            }

            /*
             * Leaf / foliage.
             */
            if (
              materialName.includes(
                "leaf"
              ) ||
              materialName.includes(
                "foliage"
              ) ||
              materialName.includes(
                "grass"
              )
            ) {
              if (
                "color" in cloned
              ) {
                (
                  cloned as THREE.MeshStandardMaterial
                ).color.setHex(
                  0x3f8f3f
                );
              }

              return cloned;
            }

            /*
             * Tree trunk / wood.
             */
            if (
              materialName.includes(
                "trunk"
              ) ||
              materialName.includes(
                "wood"
              ) ||
              materialName.includes(
                "bark"
              )
            ) {
              if (
                "color" in cloned
              ) {
                (
                  cloned as THREE.MeshStandardMaterial
                ).color.setHex(
                  0x76502f
                );
              }

              return cloned;
            }

            /*
             * Rocks.
             */
            if (
              materialName.includes(
                "rock"
              ) ||
              category === "rock"
            ) {
              if (
                "color" in cloned
              ) {
                (
                  cloned as THREE.MeshStandardMaterial
                ).color.setHex(
                  0x777777
                );
              }

              return cloned;
            }

            /*
             * Grass / small vegetation.
             */
            if (
              category === "grass"
            ) {
              if (
                "color" in cloned
              ) {
                (
                  cloned as THREE.MeshStandardMaterial
                ).color.setHex(
                  0x4fa84f
                );
              }

              return cloned;
            }

            /*
             * Tree fallback:
             *
             * Do NOT make every tree part green.
             * Keep unnamed geometry natural brown/green
             * depending on its material role.
             */
            if (
              category === "tree"
            ) {
              if (
                "color" in cloned
              ) {
                (
                  cloned as THREE.MeshStandardMaterial
                ).color.setHex(
                  0x5f7138
                );
              }

              return cloned;
            }

            /*
             * Generic fallback.
             */
            if (
              "color" in cloned
            ) {
              (
                cloned as THREE.MeshStandardMaterial
              ).color.setHex(
                0x6b6b6b
              );
            }

            return cloned;
          }
        );

      child.material =
        Array.isArray(
          child.material
        )
          ? clonedMaterials
          : clonedMaterials[0];
      }
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
       * Two props per slot:
       * left + right.
       */
      const slot =
        Math.floor(
          i / 2
        );

      let targetZ =
        playerZ -
        50 -
        slot *
        this.spacing;

      /*
       * Small deterministic variation.
       */
      targetZ +=
        (
          this.seededRandom(
            prop.seed + 7
          ) -
          0.5
        ) *
        4;

      /*
       * Initial / recycled placement.
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
     * Keep vegetation clearly outside
     * the road edge.
     */
    let extraDistance =
      this.sideOffset +
      this.seededRandom(
        prop.seed + 31
      ) *
      4;

    /*
     * Grass can sit slightly closer
     * to the roadside.
     */
    if (
      prop.category === "grass"
    ) {
      extraDistance =
        2.5 +
        this.seededRandom(
          prop.seed + 32
        ) *
        2.5;
    }

    const x =
      centerX +
      prop.side *
      (
        this.roadWidth / 2 +
        extraDistance
      );

    prop.object.position.x =
      x;

    prop.object.position.z =
      worldZ;

    /*
     * Keep everything upright.
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
    /*
     * Recycle far ahead.
     *
     * No new object is created.
     */
    const randomOffset =
      (
        this.seededRandom(
          prop.seed + 101
        ) -
        0.5
      ) *
      8;

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

    this.sourceCategories.length =
      0;

    this.loaded =
      false;

    this.loading =
      false;
  }
}
