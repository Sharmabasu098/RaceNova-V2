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
}

export class PlayerCar {
  public readonly group: THREE.Group;

  private readonly body: THREE.Mesh;
  private readonly wheels: THREE.Mesh[] = [];

  // =========================================================
  // Speed System
  // =========================================================

  /**
   * Authoritative gameplay speed in km/h.
   */
  private speed = 0;

  /**
   * Normal maximum driving speed.
   *
   * Nitro will later be allowed to temporarily
   * push the car above this value.
   */
  private readonly maxSpeed: number;

  /**
   * Absolute safety limit.
   *
   * No gameplay system should be able to push
   * the car above this value.
   */
  private readonly hardSpeedCap: number;

  /**
   * Normal acceleration in km/h per second.
   */
  private readonly acceleration: number;

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

    /*
     * Normal acceleration.
     *
     * Nitro will later modify speed through
     * dedicated methods instead of creating
     * another movement system.
     */
    this.speed +=
      this.acceleration *
      deltaTime;

    /*
     * Normal driving speed is capped at
     * maxSpeed.
     *
     * A future Nitro system can temporarily
     * increase the speed above this value
     * using setSpeed().
     */
    this.speed =
      Math.min(
        this.speed,
        this.maxSpeed
      );

    /*
     * Absolute safety cap.
     */
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
  // Speed API
  // =========================================================

  /**
   * Returns the authoritative gameplay speed.
   */
  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Returns the normal maximum speed.
   */
  public getMaxSpeed(): number {
    return this.maxSpeed;
  }

  /**
   * Returns the absolute safety cap.
   */
  public getHardSpeedCap(): number {
    return this.hardSpeedCap;
  }

  /**
   * Sets speed while respecting the hard cap.
   *
   * This will be used by:
   * - Collision
   * - Nitro
   * - Future Drift
   * - Future gameplay systems
   */
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

  /**
   * Instantly stop the car.
   */
  public stop(): void {
    this.speed = 0;
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
