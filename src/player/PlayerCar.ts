import * as THREE from "three";

export interface PlayerCarConfig {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;

  // Speed configuration
  maxSpeed?: number;
  acceleration?: number;
  hardSpeedCap?: number;

  // Nitro configuration
  nitroSpeed?: number;
  nitroDuration?: number;
}

export class PlayerCar {
  public readonly group: THREE.Group;

  private readonly body: THREE.Mesh;
  private readonly wheels: THREE.Mesh[] = [];

  // =========================================================
  // Speed System
  // =========================================================

  private speed = 0;

  private readonly maxSpeed: number;
  private readonly hardSpeedCap: number;
  private readonly acceleration: number;

  // =========================================================
  // Nitro System
  // =========================================================

  private readonly nitroSpeed: number;
  private readonly nitroDuration: number;

  private nitroActive = false;
  private nitroTimer = 0;

  constructor(
    config: PlayerCarConfig = {}
  ) {
    this.group = new THREE.Group();

    const scale =
      config.scale ?? 1;

    this.group.position.set(
      config.x ?? 0,
      config.y ?? 0.55,
      config.z ?? 0
    );

    this.group.scale.setScalar(
      scale
    );

    // =====================================================
    // Speed configuration
    // =====================================================

    this.maxSpeed =
      Math.max(
        1,
        config.maxSpeed ?? 128
      );

    this.hardSpeedCap =
      Math.max(
        this.maxSpeed,
        config.hardSpeedCap ?? 180
      );

    this.acceleration =
      Math.max(
        0,
        config.acceleration ?? 35
      );

    // =====================================================
    // Nitro configuration
    // =====================================================

    this.nitroSpeed =
      THREE.MathUtils.clamp(
        config.nitroSpeed ?? 165,
        this.maxSpeed,
        this.hardSpeedCap
      );

    this.nitroDuration =
      Math.max(
        0.1,
        config.nitroDuration ?? 3
      );

    // =====================================================
    // Car body
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

    this.body.castShadow = true;
    this.body.receiveShadow = true;

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

    cabin.castShadow = true;

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

      wheel.castShadow = true;

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
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number
  ): void {
    if (
      deltaTime <= 0
    ) {
      return;
    }

    // =====================================================
    // Nitro timer
    // =====================================================

    if (this.nitroActive) {
      this.nitroTimer -= deltaTime;

      if (
        this.nitroTimer <= 0
      ) {
        this.nitroActive = false;
        this.nitroTimer = 0;

        /*
         * Nitro finished.
         *
         * Bring speed back to the normal
         * maximum immediately.
         */
        this.speed =
          Math.min(
            this.speed,
            this.maxSpeed
          );
      }
    }

    // =====================================================
    // Normal acceleration
    // =====================================================

    this.speed +=
      this.acceleration *
      deltaTime;

    // =====================================================
    // Speed limit
    // =====================================================

    if (this.nitroActive) {
      /*
       * During Nitro the car can go
       * above the normal 128 km/h limit.
       */
      this.speed =
        Math.min(
          this.speed,
          this.nitroSpeed
        );
    } else {
      /*
       * Normal driving limit.
       */
      this.speed =
        Math.min(
          this.speed,
          this.maxSpeed
        );
    }

    // =====================================================
    // Absolute hard cap
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
    // Forward movement
    // =====================================================

    this.group.position.z -=
      worldSpeed *
      deltaTime;

    // =====================================================
    // Wheel rotation
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
  }

  // =========================================================
  // Nitro
  // =========================================================

  public activateNitro(): void {
    /*
     * Do nothing if Nitro is already active.
     */
    if (this.nitroActive) {
      return;
    }

    /*
     * Do not activate while stopped.
     */
    if (this.speed <= 0) {
      return;
    }

    this.nitroActive = true;
    this.nitroTimer =
      this.nitroDuration;

    /*
     * Immediately push speed upward.
     */
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

    /*
     * Collision or external systems can
     * force the car below normal speed.
     */
    if (
      this.speed <= 0
    ) {
      this.nitroActive = false;
      this.nitroTimer = 0;
    }
  }

  public stop(): void {
    this.speed = 0;
    this.nitroActive = false;
    this.nitroTimer = 0;
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
