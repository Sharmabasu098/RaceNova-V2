import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// ============================================================
// RaceNova V2
// Traffic Car
// GLB Integration
// ============================================================

export interface TrafficCarConfig {
  x?: number;
  y?: number;
  z?: number;
  speed?: number;
  scale?: number;

  // =========================================================
  // Legacy / Traffic Variant Compatibility
  // =========================================================

  /**
   * Optional traffic color supplied by
   * TrafficManager.
   *
   * GLB materials are intentionally preserved.
   * This value exists for compatibility with
   * the existing TrafficManager API.
   */
  color?: number;

  // =========================================================
  // GLB Configuration
  // =========================================================


  modelPath?: string;
  modelScale?: number;
  modelRotationY?: number;
}

export class TrafficCar {

  // =========================================================
  // Main Group
  // =========================================================

  public readonly group: THREE.Group;

  /**
   * Container for the loaded GLB.
   *
   * TrafficManager and CollisionSystem continue
   * to work with TrafficCar.group exactly as before.
   */
  private readonly modelGroup:
    THREE.Group;

  // =========================================================
  // GLB Loader
  // =========================================================

  private readonly gltfLoader:
    GLTFLoader;

  private modelLoaded =
    false;

  private modelLoadFailed =
    false;

  // =========================================================
  // Model Configuration
  // =========================================================

  private readonly modelPath:
    string;

  private readonly modelScale:
    number;

  private readonly modelRotationY:
    number;

  // =========================================================
  // Gameplay
  // =========================================================

  /**
   * Traffic speed in km/h.
   *
   * Speed remains fixed unless another
   * gameplay system explicitly changes it.
   */
  private speed: number;

  /**
   * Whether this traffic car is currently active.
   */
  private active =
    true;

  /**
   * True when this traffic car has been
   * stopped because of a collision.
   */
  private stoppedByCollision =
    false;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    config: TrafficCarConfig = {}
  ) {

    // =======================================================
    // Main Group
    // =======================================================

    this.group =
      new THREE.Group();

    this.group.name =
      "TrafficCar";

    // =======================================================
    // Model Group
    // =======================================================

    this.modelGroup =
      new THREE.Group();

    this.modelGroup.name =
      "TrafficCarModel";

    this.group.add(
      this.modelGroup
    );

    // =======================================================
    // Position
    // =======================================================

    this.group.position.set(

      Number.isFinite(config.x)
        ? config.x!
        : 0,

      Number.isFinite(config.y)
        ? config.y!
        : 0.55,

      Number.isFinite(config.z)
        ? config.z!
        : -80
    );

    // =======================================================
    // Traffic Speed
    // =======================================================

    this.speed =
      Math.max(
        0,
        Number.isFinite(config.speed)
          ? config.speed!
          : 70
      );

    // =======================================================
    // GLB Configuration
    // =======================================================

    this.modelPath =
  config.modelPath ??
  `${import.meta.env.BASE_URL}assets/cars/trafficsuv.glb`;
    
    this.modelScale =
      Math.max(
        0.001,
        Number.isFinite(config.modelScale)
          ? config.modelScale!
          : 1
      );

    /*
     * RaceNova forward direction:
     *
     * Player:
     *      -Z
     *
     * Traffic:
     *      +Z
     *
     * Many downloaded GLB vehicles face +Z.
     *
     * Rotating by PI makes the vehicle
     * visually face the road direction.
     */
    this.modelRotationY =
      Number.isFinite(
        config.modelRotationY
      )
        ? config.modelRotationY!
        : Math.PI;

    // =======================================================
    // GLB Loader
    // =======================================================

    this.gltfLoader =
      new GLTFLoader();

    // =======================================================
    // Load Model
    // =======================================================

    this.loadTrafficCar();
  }

  // =========================================================
  // Load Traffic GLB
  // =========================================================

  private loadTrafficCar(): void {

    this.gltfLoader.load(

      this.modelPath,

      (gltf) => {

        const model =
          gltf.scene;

        model.name =
          "TrafficCarGLB";

        // ---------------------------------------------------
        // Rotation
        // ---------------------------------------------------

        model.rotation.y =
          this.modelRotationY;

        // ---------------------------------------------------
        // Initial scale
        // ---------------------------------------------------

        model.scale.setScalar(
          this.modelScale
        );

        // ---------------------------------------------------
        // Shadows
        // ---------------------------------------------------

        model.traverse(
          (object) => {

            if (
              object instanceof THREE.Mesh
            ) {

              object.castShadow =
                true;

              object.receiveShadow =
                true;
            }
          }
        );

        // ---------------------------------------------------
        // Normalize model size
        // ---------------------------------------------------

        this.normalizeModel(
          model
        );

        // ---------------------------------------------------
        // Add model
        // ---------------------------------------------------

        this.modelGroup.add(
          model
        );

        this.modelLoaded =
          true;

        this.modelLoadFailed =
          false;
      },

      undefined,

      (error) => {

        this.modelLoaded =
          false;

        this.modelLoadFailed =
          true;

        console.error(
          "[RaceNova] Failed to load traffic GLB:",
          this.modelPath,
          error
        );
      }
    );
  }

  // =========================================================
  // Normalize GLB
  // =========================================================

  private normalizeModel(
    model: THREE.Object3D
  ): void {

    const box =
      new THREE.Box3().setFromObject(
        model
      );

    if (
      box.isEmpty()
    ) {
      return;
    }

    const size =
      new THREE.Vector3();

    box.getSize(
      size
    );

    const maxDimension =
      Math.max(
        size.x,
        size.y,
        size.z
      );

    if (
      !Number.isFinite(
        maxDimension
      ) ||
      maxDimension <= 0
    ) {
      return;
    }

    /*
     * RaceNova traffic cars are roughly
     * 4.2 world units long.
     *
     * This prevents downloaded GLBs
     * from appearing huge or tiny.
     */
    const targetLength =
      4.2;

    const normalizationScale =
      targetLength /
      maxDimension;

    model.scale.multiplyScalar(
      normalizationScale
    );

    // -------------------------------------------------------
    // Recalculate bounds
    // -------------------------------------------------------

    const normalizedBox =
      new THREE.Box3().setFromObject(
        model
      );

    const center =
      new THREE.Vector3();

    normalizedBox.getCenter(
      center
    );

    // -------------------------------------------------------
    // Center X/Z
    // -------------------------------------------------------

    model.position.x -=
      center.x;

    model.position.z -=
      center.z;

    // -------------------------------------------------------
    // Put car on road level
    // -------------------------------------------------------

    const normalizedMinY =
      normalizedBox.min.y;

    model.position.y -=
      normalizedMinY;
  }

  // =========================================================
  // GLB Status
  // =========================================================

  public isModelLoaded():
    boolean {

    return this.modelLoaded;
  }

  public hasModelLoadFailed():
    boolean {

    return this.modelLoadFailed;
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number
  ): void {

    /*
     * IMPORTANT:
     *
     * A collision-stopped traffic car
     * must never move again until it is
     * explicitly reset for reuse.
     */
    if (
      !this.active ||
      this.stoppedByCollision ||
      deltaTime <= 0 ||
      !Number.isFinite(deltaTime)
    ) {
      return;
    }

    // -------------------------------------------------------
    // Convert km/h to world units per second
    // -------------------------------------------------------

    const worldSpeed =
      this.speed / 3.6;

    /*
     * Player moves toward negative Z.
     * Traffic moves toward positive Z.
     */
    this.group.position.z +=
      worldSpeed *
      deltaTime;
  }

  // =========================================================
  // Position
  // =========================================================

  public getPosition():
    THREE.Vector3 {

    return this.group.position;
  }

  public setPosition(
    x: number,
    y: number,
    z: number
  ): void {

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(z)
    ) {
      return;
    }

    this.group.position.set(
      x,
      y,
      z
    );
  }

  // =========================================================
  // Speed
  // =========================================================

  public getSpeed():
    number {

    return this.speed;
  }

  public setSpeed(
    speed: number
  ): void {

    if (
      !Number.isFinite(speed)
    ) {
      return;
    }

    this.speed =
      Math.max(
        0,
        speed
      );
  }

  // =========================================================
  // Collision Stop
  // =========================================================

  /**
   * Permanently stops this traffic car
   * for the current active lifetime.
   *
   * It will not move again until
   * resetCollisionStop() is called.
   */
  public stopForCollision(): void {

    this.stoppedByCollision =
      true;

    this.speed =
      0;
  }

  // =========================================================
  // Collision Reset
  // =========================================================

  /**
   * Called when an inactive traffic car
   * is reused for a new spawn.
   */
  public resetCollisionStop(): void {

    this.stoppedByCollision =
      false;
  }

  // =========================================================
  // Collision State
  // =========================================================

  public isStoppedByCollision():
    boolean {

    return this.stoppedByCollision;
  }

  // =========================================================
  // Active State
  // =========================================================

  public isActive():
    boolean {

    return this.active;
  }

  public setActive(
    active: boolean
  ): void {

    this.active =
      active;

    this.group.visible =
      active;
  }

  // =========================================================
  // Scene
  // =========================================================

  public addToScene(
    scene: THREE.Scene
  ): void {

    if (
      this.group.parent !== scene
    ) {

      scene.add(
        this.group
      );
    }

    this.group.visible =
      true;
  }

  public removeFromScene(
    scene: THREE.Scene
  ): void {

    if (
      this.group.parent === scene
    ) {

      scene.remove(
        this.group
      );
    }
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {

    this.group.traverse(
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

    this.modelGroup.clear();
  }
}
