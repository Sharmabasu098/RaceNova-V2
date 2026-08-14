import * as THREE from "three";

export interface PlayerCarConfig {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;

  maxSpeed?: number;
  acceleration?: number;
  hardSpeedCap?: number;

  // Nitro
  maxNitro?: number;
  nitroDuration?: number;
  nitroBoost?: number;
  nitroRechargeRate?: number;
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

  private readonly maxNitro: number;
  private nitroAmount: number;

  private readonly nitroDuration: number;
  private readonly nitroBoost: number;
  private readonly nitroRechargeRate: number;

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

    this.maxNitro =
      Math.max(
        0,
        config.maxNitro ?? 100
      );

    this.nitroAmount =
      this.maxNitro;

    this.nitroDuration =
      Math.max(
        0,
        config.nitroDuration ?? 3
      );

    this.nitroBoost =
      Math.max(
        0,
        config.nitroBoost ?? 45
      );

    this.nitroRechargeRate =
      Math.max(
        0,
        config.nitroRechargeRate ?? 0
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
        this.stopNitro();
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

    const currentMaximum =
      this.nitroActive
        ? Math.min(
            this.maxSpeed +
              this.nitroBoost,
            this.hardSpeedCap
          )
        : this.maxSpeed;

    this.speed =
      Math.min(
        this.speed,
        currentMaximum
      );

    // =====================================================
    // Hard safety cap
    // =====================================================

    this.speed =
      THREE.MathUtils.clamp(
        this.speed,
        0,
        this.hardSpeedCap
      );

    // =====================================================
    // Convert km/h → world units/sec
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

    // =====================================================
    // Optional Nitro recharge
    // =====================================================

    if (
      !this.nitroActive &&
      this.nitroRechargeRate > 0 &&
      this.nitroAmount <
        this.maxNitro
    ) {
      this.nitroAmount =
        Math.min(
          this.maxNitro,
          this.nitroAmount +
            this.nitroRechargeRate *
              deltaTime
        );
    }
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
  }

  public stop(): void {
    this.speed = 0;
  }

  // =========================================================
  // Nitro API
  // =========================================================

  /**
   * Start Nitro.
   *
   * Returns true when Nitro successfully starts.
   */
  public activateNitro(): boolean {
    if (
      this.nitroActive
    ) {
      return false;
    }

    if (
      this.nitroAmount <= 0
    ) {
      return false;
    }

    if (
      this.nitroDuration <= 0
    ) {
      return false;
    }

    this.nitroActive = true;
    this.nitroTimer =
      this.nitroDuration;

    /*
     * Consume the available Nitro.
     *
     * M2.2 uses a simple full activation model.
     * Later we can make it continuous.
     */
    this.nitroAmount = 0;

    /*
     * Immediately increase speed so
     * Nitro has a visible gameplay effect.
     */
    this.speed =
      Math.min(
        this.speed +
          this.nitroBoost,
        this.hardSpeedCap
      );

    return true;
  }

  /**
   * Stop Nitro immediately.
   */
  public stopNitro(): void {
    this.nitroActive = false;
    this.nitroTimer = 0;

    /*
     * When Nitro ends, don't suddenly kill
     * the car's speed. The normal max speed
     * will take effect naturally.
     */
    this.speed =
      Math.min(
        this.speed,
        this.maxSpeed
      );
  }

  public isNitroActive(): boolean {
    return this.nitroActive;
  }

  public getNitroAmount(): number {
    return this.nitroAmount;
  }

  public getMaxNitro(): number {
    return this.maxNitro;
  }

  public getNitroTimer(): number {
    return this.nitroTimer;
  }

  public setNitroAmount(
    amount: number
  ): void {
    if (
      !Number.isFinite(amount)
    ) {
      return;
    }

    this.nitroAmount =
      THREE.MathUtils.clamp(
        amount,
        0,
        this.maxNitro
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
