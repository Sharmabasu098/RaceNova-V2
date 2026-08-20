import * as THREE from "three";

export interface PlayerCarConfig {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;

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
  public readonly group: THREE.Group;

  private readonly body: THREE.Mesh;
  private readonly wheels: THREE.Mesh[] = [];

  // =========================================================
  // Gameplay Stats
  // =========================================================

  /*
   * IMPORTANT:
   *
   * These are intentionally NOT readonly.
   *
   * M5.3 requires runtime car switching.
   *
   * Garage
   *   ↓
   * CarData
   *   ↓
   * UpgradeSystem
   *   ↓
   * PlayerCar.applyCarStats()
   */

  private maxSpeed: number;
  private acceleration: number;
  private handling: number;

  private hardSpeedCap: number;

  private speed = 0;

  // =========================================================
  // Nitro System
  // =========================================================

  private nitroSpeed: number;
  private nitroDuration: number;

  private nitroActive = false;
  private nitroTimer = 0;

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
  // Constructor
  // =========================================================

  constructor(
    config: PlayerCarConfig = {}
  ) {
    this.group =
      new THREE.Group();

    const scale =
      Number.isFinite(config.scale)
        ? config.scale!
        : 1;

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

    this.group.scale.setScalar(
      scale
    );

    // =====================================================
    // Initial Gameplay Stats
    // =====================================================

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

    // =====================================================
    // Nitro Configuration
    // =====================================================

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

    // =====================================================
    // Car Body
    // =====================================================

    const bodyGeometry =
      new THREE.BoxGeometry(
        2.2,
        0.55,
        4.2
      );

    const bodyMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xb51f2a,
        roughness: 0.65,
        metalness: 0.15
      });

    this.body =
      new THREE.Mesh(
        bodyGeometry,
        bodyMaterial
      );

    this.body.position.y =
      0.35;

    this.body.castShadow =
      true;

    this.body.receiveShadow =
      true;

    this.group.add(
      this.body
    );

    // =====================================================
    // Cabin
    // =====================================================

    const cabinGeometry =
      new THREE.BoxGeometry(
        1.55,
        0.55,
        1.75
      );

    const cabinMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x20252b,
        roughness: 0.35,
        metalness: 0.1
      });

    const cabin =
      new THREE.Mesh(
        cabinGeometry,
        cabinMaterial
      );

    cabin.position.set(
      0,
      0.82,
      -0.15
    );

    cabin.castShadow =
      true;

    this.group.add(
      cabin
    );

    // =====================================================
    // Wheels
    // =====================================================

    const wheelGeometry =
      new THREE.CylinderGeometry(
        0.42,
        0.42,
        0.28,
        16
      );

    const wheelMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x151515,
        roughness: 0.85
      });

    const wheelPositions:
      Array<
        [number, number, number]
      > = [
        [-1.12, 0.25, 1.35],
        [1.12, 0.25, 1.35],
        [-1.12, 0.25, -1.35],
        [1.12, 0.25, -1.35]
      ];

    for (
      const [x, y, z]
      of wheelPositions
    ) {
      const wheel =
        new THREE.Mesh(
          wheelGeometry,
          wheelMaterial
        );

      wheel.rotation.z =
        Math.PI / 2;

      wheel.position.set(
        x,
        y,
        z
      );

      wheel.castShadow =
        true;

      this.wheels.push(
        wheel
      );

      this.group.add(
        wheel
      );
    }

    // =====================================================
    // Headlights
    // =====================================================

    const headlightGeometry =
      new THREE.BoxGeometry(
        0.42,
        0.16,
        0.08
      );

    const headlightMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x555555,
        roughness: 0.25
      });

    for (
      const x of [-0.62, 0.62]
    ) {
      const light =
        new THREE.Mesh(
          headlightGeometry,
          headlightMaterial
        );

      light.position.set(
        x,
        0.52,
        -2.08
      );

      this.group.add(
        light
      );
    }

    // =====================================================
    // Nitro Visual Effect
    // =====================================================

    this.createNitroEffect();

    this.setNitroEffectVisible(
      false
    );
  }

  // =========================================================
  // Runtime Car Stats
  // M5.3
  // =========================================================

  /**
   * Applies the effective stats of the
   * currently selected car at runtime.
   *
   * Source:
   *
   * CarData
   *    ↓
   * UpgradeSystem.getStats()
   *    ↓
   * PlayerCar.applyCarStats()
   *
   * This does NOT save anything.
   * SaveSystem remains responsible
   * for persistence.
   */
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

    // -----------------------------------------------------
    // Apply gameplay stats
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // Recalculate hard cap
    // -----------------------------------------------------

    /*
     * Keep the established RaceNova
     * minimum hard cap of 180.
     */
    this.hardSpeedCap =
      Math.max(
        180,
        this.maxSpeed
      );

    // -----------------------------------------------------
    // Recalculate Nitro
    // -----------------------------------------------------

    /*
     * Nitro remains +37 above the
     * selected car's normal max speed,
     * but never exceeds hardSpeedCap.
     */
    this.nitroSpeed =
      THREE.MathUtils.clamp(
        this.maxSpeed + 37,
        this.maxSpeed,
        this.hardSpeedCap
      );

    // -----------------------------------------------------
    // Keep current speed valid
    // -----------------------------------------------------

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
        color: 0xff8a00,
        emissive: 0xff3d00,
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 0.9,
        roughness: 0.25,
        metalness: 0
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

    // =====================================================
    // Nitro Light
    // =====================================================

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

    const pulse =
      0.85 +
      Math.sin(
        performance.now() * 0.025
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
          performance.now() * 0.015
        ) *
        0.08;
    }

    if (
      this.nitroLight
    ) {
      this.nitroLight.intensity =
        1.8 +
        Math.sin(
          performance.now() * 0.03
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

    // =====================================================
    // Nitro Timer
    // =====================================================

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

    // =====================================================
    // Normal Acceleration
    // =====================================================

    this.speed +=
      this.acceleration *
      deltaTime;

    // =====================================================
    // Speed Limit
    // =====================================================

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

    // =====================================================
    // Absolute Hard Cap
    // =====================================================

    this.speed =
      THREE.MathUtils.clamp(
        this.speed,
        0,
        this.hardSpeedCap
      );

    // =====================================================
    // Convert km/h → world units / second
    // =====================================================

    const worldSpeed =
      this.speed / 3.6;

    // =====================================================
    // Forward Movement
    // =====================================================

    this.group.position.z -=
      worldSpeed *
      deltaTime;

    // =====================================================
    // Wheel Rotation
    // =====================================================

    const wheelRotation =
      worldSpeed *
      deltaTime /
      0.42;

    for (
      const wheel
      of this.wheels
    ) {
      wheel.rotation.x -=
        wheelRotation;
    }

    // =====================================================
    // Nitro Visual
    // =====================================================

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

  public isNitroActive(): boolean {
    return this.nitroActive;
  }

  public getNitroTimeRemaining(): number {
    return Math.max(
      0,
      this.nitroTimer
    );
  }

  public getNitroSpeed(): number {
    return this.nitroSpeed;
  }

  public getNitroDuration(): number {
    return this.nitroDuration;
  }

  // =========================================================
  // Speed API
  // =========================================================

  public getSpeed(): number {
    return this.speed;
  }

  public getMaxSpeed(): number {
    return this.maxSpeed;
  }

  public getHardSpeedCap(): number {
    return this.hardSpeedCap;
  }

  // =========================================================
  // Handling API
  // =========================================================

  public getHandling(): number {
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

  public getPosition(): THREE.Vector3 {
    return this.group.position;
  }

  public setX(
    x: number
  ): void {
    this.group.position.x =
      x;
  }

  public setZ(
    z: number
  ): void {
    this.group.position.z =
      z;
  }

  // =========================================================
  // Rotation
  // =========================================================

  public setRotationY(
    rotationY: number
  ): void {
    this.group.rotation.y =
      rotationY;
  }

  public getRotationY(): number {
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
