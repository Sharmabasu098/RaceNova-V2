import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export interface PlayerCarConfig {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;

  // =========================================================
  // GLB Configuration
  // =========================================================

  modelPath?: string;
  modelScale?: number;
  modelRotationY?: number;

  // =========================================================
  // Car Gameplay Stats
  // =========================================================

  maxSpeed?: number;
  acceleration?: number;
  handling?: number;

  hardSpeedCap?: number;

  // =========================================================
  // Nitro Configuration
  // =========================================================

  nitroSpeed?: number;
  nitroDuration?: number;
}

export interface PlayerCarStats {
  maxSpeed: number;
  acceleration: number;
  handling: number;
}

export class PlayerCar {

  // =========================================================
  // Main Group
  // =========================================================

  public readonly group: THREE.Group;

  /**
   * Contains the loaded GLB model.
   *
   * Gameplay code should continue using
   * PlayerCar.group.
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
  // Gameplay Stats
  // =========================================================

  private maxSpeed: number;
  private acceleration: number;
  private handling: number;

  private hardSpeedCap: number;

  private speed =
    0;

  // =========================================================
  // Nitro System
  // =========================================================

  private nitroSpeed: number;
  private nitroDuration: number;

  private nitroActive =
    false;

  private nitroTimer =
    0;

  // =========================================================
  // Nitro Visual Effect
  // =========================================================

  private readonly nitroEffectGroup =
    new THREE.Group();

  private readonly nitroFlames:
    THREE.Mesh[] = [];

  private nitroLight:
    THREE.PointLight | null = null;

  // =========================================================
  // Configuration
  // =========================================================

  private readonly modelPath:
    string;

  private readonly modelScale:
    number;

  private readonly modelRotationY:
    number;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    config: PlayerCarConfig = {}
  ) {

    // =======================================================
    // Main Group
    // =======================================================

    this.group =
      new THREE.Group();

    this.group.name =
      "PlayerCar";

    // =======================================================
    // Model Group
    // =======================================================

    this.modelGroup =
      new THREE.Group();

    this.modelGroup.name =
      "PlayerCarModel";

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
        : 0
    );

    // =======================================================
    // Gameplay Stats
    // =======================================================

    this.maxSpeed =
      Math.max(
        1,
        Number.isFinite(config.maxSpeed)
          ? config.maxSpeed!
          : 128
      );

    this.acceleration =
      Math.max(
        0,
        Number.isFinite(config.acceleration)
          ? config.acceleration!
          : 35
      );

    this.handling =
      Math.max(
        0.1,
        Number.isFinite(config.handling)
          ? config.handling!
          : 5
      );

    this.hardSpeedCap =
      Math.max(
        this.maxSpeed,
        Number.isFinite(config.hardSpeedCap)
          ? config.hardSpeedCap!
          : 180
      );

    // =======================================================
    // Nitro
    // =======================================================

    this.nitroSpeed =
      THREE.MathUtils.clamp(

        Number.isFinite(config.nitroSpeed)
          ? config.nitroSpeed!
          : this.maxSpeed + 37,

        this.maxSpeed,

        this.hardSpeedCap
      );

    this.nitroDuration =
      Math.max(
        0.1,
        Number.isFinite(config.nitroDuration)
          ? config.nitroDuration!
          : 3
      );

    // =======================================================
    // GLB Configuration
    // =======================================================

    this.modelPath =
  config.modelPath ??
  new URL(
    "../../assets/cars/playercar.glb",
    import.meta.url
  ).href;

    /*
     * RaceNova world forward direction:
     *
     *        -Z
     *         ↑
     *       PLAYER
     *
     * Many downloaded GLB cars face +Z.
     *
     * Default rotation fixes that.
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
    // Load Player Car
    // =======================================================

    this.loadPlayerCar();

    // =======================================================
    // Nitro
    // =======================================================

    this.createNitroEffect();

    this.setNitroEffectVisible(
      false
    );
  }

  // =========================================================
  // Load Player GLB
  // =========================================================

  private loadPlayerCar(): void {

    this.gltfLoader.load(

      this.modelPath,

      (gltf) => {

        const model =
          gltf.scene;

        model.name =
          "PlayerCarGLB";

        // ---------------------------------------------------
        // Basic transform
        // ---------------------------------------------------

        model.rotation.y =
          this.modelRotationY;

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

              /*
               * GLB materials remain untouched.
               *
               * We do NOT replace them with
               * simple BoxGeometry materials.
               */
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
          "[RaceNova] Failed to load playercar.glb:",
          error
        );
      }
    );
  }

  // =========================================================
  // Normalize GLB Model
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
     * RaceNova cars are roughly
     * 4 world units long.
     *
     * This prevents a downloaded
     * GLB from appearing huge/tiny.
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
    // Recalculate bounding box
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
    // Put wheels/body on road level
    // -------------------------------------------------------

    const normalizedMinY =
      normalizedBox.min.y;

    model.position.y -=
      normalizedMinY;
  }

  // =========================================================
  // GLB Status
  // =========================================================

  public isModelLoaded(): boolean {

    return this.modelLoaded;
  }

  public hasModelLoadFailed(): boolean {

    return this.modelLoadFailed;
  }

  // =========================================================
  // Runtime Car Stats
  // =========================================================

  public applyCarStats(
    maxSpeed: number,
    acceleration: number,
    handling: number
  ): void {

    if (
      !Number.isFinite(maxSpeed) ||
      !Number.isFinite(acceleration) ||
      !Number.isFinite(handling)
    ) {
      return;
    }

    // -------------------------------------------------------
    // Gameplay stats
    // -------------------------------------------------------

    this.maxSpeed =
      Math.max(
        1,
        maxSpeed
      );

    this.acceleration =
      Math.max(
        0,
        acceleration
      );

    this.handling =
      Math.max(
        0.1,
        handling
      );

    // -------------------------------------------------------
    // Hard cap
    // -------------------------------------------------------

    this.hardSpeedCap =
      Math.max(
        180,
        this.maxSpeed
      );

    // -------------------------------------------------------
    // Nitro
    // -------------------------------------------------------

    this.nitroSpeed =
      THREE.MathUtils.clamp(

        this.maxSpeed + 37,

        this.maxSpeed,

        this.hardSpeedCap
      );

    // -------------------------------------------------------
    // Keep speed valid
    // -------------------------------------------------------

    if (
      this.nitroActive
    ) {

      this.speed =
        Math.min(
          this.speed,
          this.nitroSpeed
        );

    } else {

      this.speed =
        Math.min(
          this.speed,
          this.maxSpeed
        );
    }

    this.speed =
      THREE.MathUtils.clamp(
        this.speed,
        0,
        this.hardSpeedCap
      );
  }

  // =========================================================
  // Get Gameplay Stats
  // =========================================================

  public getStats():
    PlayerCarStats {

    return {

      maxSpeed:
        this.maxSpeed,

      acceleration:
        this.acceleration,

      handling:
        this.handling
    };
  }

  // =========================================================
  // Nitro Visual Creation
  // =========================================================

  private createNitroEffect(): void {

    this.nitroEffectGroup.name =
      "NitroEffect";

    const flameGeometry =
      new THREE.ConeGeometry(
        0.22,
        0.9,
        12
      );

    const flameMaterial =
      new THREE.MeshStandardMaterial({

        color:
          0xff8a00,

        emissive:
          0xff3d00,

        emissiveIntensity:
          2.5,

        transparent:
          true,

        opacity:
          0.9,

        roughness:
          0.25,

        metalness:
          0
      });

    const exhaustPositions:
      Array<
        [number, number, number]
      > = [

        [-0.65, 0.34, 2.15],

        [0.65, 0.34, 2.15]
      ];

    for (
      const [x, y, z]
      of exhaustPositions
    ) {

      const flame =
        new THREE.Mesh(
          flameGeometry.clone(),
          flameMaterial.clone()
        );

      flame.rotation.x =
        Math.PI / 2;

      flame.position.set(
        x,
        y,
        z
      );

      flame.scale.set(
        0.85,
        1,
        0.85
      );

      flame.castShadow =
        false;

      flame.receiveShadow =
        false;

      this.nitroFlames.push(
        flame
      );

      this.nitroEffectGroup.add(
        flame
      );
    }

    // =======================================================
    // Nitro Light
    // =======================================================

    this.nitroLight =
      new THREE.PointLight(
        0xff5500,
        0,
        5
      );

    this.nitroLight.position.set(
      0,
      0.45,
      2.1
    );

    this.nitroEffectGroup.add(
      this.nitroLight
    );

    this.group.add(
      this.nitroEffectGroup
    );
  }

  // =========================================================
  // Nitro Visibility
  // =========================================================

  private setNitroEffectVisible(
    visible: boolean
  ): void {

    this.nitroEffectGroup.visible =
      visible;

    if (
      this.nitroLight
    ) {

      this.nitroLight.intensity =
        visible
          ? 2.2
          : 0;
    }
  }

  // =========================================================
  // Nitro Visual Update
  // =========================================================

  private updateNitroEffect(
    deltaTime: number
  ): void {

    if (
      !this.nitroActive
    ) {

      this.setNitroEffectVisible(
        false
      );

      return;
    }

    this.setNitroEffectVisible(
      true
    );

    const now =
      performance.now();

    const pulse =
      0.85 +
      Math.sin(
        now * 0.025
      ) *
      0.18;

    for (
      const flame
      of this.nitroFlames
    ) {

      flame.scale.x =
        pulse;

      flame.scale.y =
        0.9 +
        pulse * 0.35;

      flame.scale.z =
        pulse;

      flame.rotation.z =
        Math.sin(
          now * 0.015
        ) *
        0.08;
    }

    if (
      this.nitroLight
    ) {

      this.nitroLight.intensity =
        1.8 +
        Math.sin(
          now * 0.03
        ) *
        0.7;
    }

    void deltaTime;
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number
  ): void {

    if (
      deltaTime <= 0 ||
      !Number.isFinite(deltaTime)
    ) {
      return;
    }

    // =======================================================
    // Nitro Timer
    // =======================================================

    if (
      this.nitroActive
    ) {

      this.nitroTimer -=
        deltaTime;

      if (
        this.nitroTimer <= 0
      ) {

        this.nitroActive =
          false;

        this.nitroTimer =
          0;

        this.speed =
          Math.min(
            this.speed,
            this.maxSpeed
          );
      }
    }

    // =======================================================
    // Normal Acceleration
    // =======================================================

    this.speed +=
      this.acceleration *
      deltaTime;

    // =======================================================
    // Speed Limit
    // =======================================================

    if (
      this.nitroActive
    ) {

      this.speed =
        Math.min(
          this.speed,
          this.nitroSpeed
        );

    } else {

      this.speed =
        Math.min(
          this.speed,
          this.maxSpeed
        );
    }

    // =======================================================
    // Absolute Hard Cap
    // =======================================================

    this.speed =
      THREE.MathUtils.clamp(
        this.speed,
        0,
        this.hardSpeedCap
      );

    // =======================================================
    // km/h → world units/sec
    // =======================================================

    const worldSpeed =
      this.speed / 3.6;

    // =======================================================
    // Forward Movement
    // =======================================================

    this.group.position.z -=
      worldSpeed *
      deltaTime;

    // =======================================================
    // Nitro Visual
    // =======================================================

    this.updateNitroEffect(
      deltaTime
    );
  }

  // =========================================================
  // Nitro
  // =========================================================

  public activateNitro(): void {

    if (
      this.nitroActive
    ) {
      return;
    }

    if (
      this.speed <= 0
    ) {
      return;
    }

    this.nitroActive =
      true;

    this.nitroTimer =
      this.nitroDuration;

    this.speed =
      Math.max(
        this.speed,
        this.maxSpeed
      );

    this.speed =
      Math.min(
        this.speed,
        this.nitroSpeed
      );

    this.setNitroEffectVisible(
      true
    );
  }

  public isNitroActive():
    boolean {

    return this.nitroActive;
  }

  public getNitroTimeRemaining():
    number {

    return Math.max(
      0,
      this.nitroTimer
    );
  }

  public getNitroSpeed():
    number {

    return this.nitroSpeed;
  }

  public getNitroDuration():
    number {

    return this.nitroDuration;
  }

  // =========================================================
  // Speed API
  // =========================================================

  public getSpeed():
    number {

    return this.speed;
  }

  public getMaxSpeed():
    number {

    return this.maxSpeed;
  }

  public getHardSpeedCap():
    number {

    return this.hardSpeedCap;
  }

  // =========================================================
  // Handling
  // =========================================================

  public getHandling():
    number {

    return this.handling;
  }

  // =========================================================
  // Speed Control
  // =========================================================

  public setSpeed(
    speed: number
  ): void {

    if (
      !Number.isFinite(speed)
    ) {
      return;
    }

    this.speed =
      THREE.MathUtils.clamp(
        speed,
        0,
        this.hardSpeedCap
      );

    if (
      this.speed <= 0
    ) {

      this.nitroActive =
        false;

      this.nitroTimer =
        0;

      this.setNitroEffectVisible(
        false
      );
    }
  }

  public stop(): void {

    this.speed =
      0;

    this.nitroActive =
      false;

    this.nitroTimer =
      0;

    this.setNitroEffectVisible(
      false
    );
  }

  // =========================================================
  // Position
  // =========================================================

  public getPosition():
    THREE.Vector3 {

    return this.group.position;
  }

  public setX(
    x: number
  ): void {

    if (
      !Number.isFinite(x)
    ) {
      return;
    }

    this.group.position.x =
      x;
  }

  public setZ(
    z: number
  ): void {

    if (
      !Number.isFinite(z)
    ) {
      return;
    }

    this.group.position.z =
      z;
  }

  // =========================================================
  // Rotation
  // =========================================================

  public setRotationY(
    rotationY: number
  ): void {

    if (
      !Number.isFinite(rotationY)
    ) {
      return;
    }

    this.group.rotation.y =
      rotationY;
  }

  public getRotationY():
    number {

    return this.group.rotation.y;
  }

  // =========================================================
  // Scene
  // =========================================================

  public addToScene(
    scene: THREE.Scene
  ): void {

    scene.add(
      this.group
    );
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
  }
}
  
