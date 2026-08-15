import * as THREE from "three";

export interface TrafficCarConfig {
  x?: number;
  y?: number;
  z?: number;
  speed?: number;
  color?: number;
  scale?: number;
}

export class TrafficCar {
  public readonly group: THREE.Group;

  private readonly body: THREE.Mesh;
  private readonly wheels: THREE.Mesh[] = [];

  /**
   * Traffic speed in km/h.
   *
   * Speed is fixed after spawning unless
   * another gameplay system explicitly changes it
   * through setSpeed().
   */
  private speed: number;

  private active = true;

  constructor(
    config: TrafficCarConfig = {}
  ) {
    this.group = new THREE.Group();

    const scale =
      config.scale ?? 1;

    this.group.position.set(
      config.x ?? 0,
      config.y ?? 0.55,
      config.z ?? -80
    );

    this.group.scale.setScalar(
      scale
    );

    // =====================================================
    // Fixed Traffic Speed
    // =====================================================

    this.speed =
      Math.max(
        0,
        config.speed ?? 70
      );

    // =====================================================
    // Body
    // =====================================================

    const bodyGeometry =
      new THREE.BoxGeometry(
        2.2,
        0.55,
        4.2
      );

    const bodyMaterial =
      new THREE.MeshStandardMaterial({
        color:
          config.color ?? 0x2563eb,
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

    const lightGeometry =
      new THREE.BoxGeometry(
        0.42,
        0.16,
        0.08
      );

    const lightMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x444444,
        roughness: 0.25
      });

    for (
      const x of [-0.62, 0.62]
    ) {
      const light =
        new THREE.Mesh(
          lightGeometry,
          lightMaterial
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
      !this.active ||
      deltaTime <= 0
    ) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Traffic cars do NOT accelerate.
     *
     * Their current speed is used directly.
     */
    const worldSpeed =
      this.speed / 3.6;

    /*
     * Player moves toward negative Z.
     * Traffic moves toward positive Z.
     */
    this.group.position.z +=
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
      const wheel of this.wheels
    ) {
      wheel.rotation.x +=
        wheelRotation;
    }
  }

  // =========================================================
  // Position
  // =========================================================

  public getPosition(): THREE.Vector3 {
    return this.group.position;
  }

  public setPosition(
    x: number,
    y: number,
    z: number
  ): void {
    this.group.position.set(
      x,
      y,
      z
    );
  }

  // =========================================================
  // Speed
  // =========================================================

  public getSpeed(): number {
    return this.speed;
  }

  /**
   * Allows collision/gameplay systems to change
   * traffic speed intentionally.
   *
   * This does NOT create automatic acceleration.
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
      Math.max(
        0,
        speed
      );
  }

  // =========================================================
  // Active State
  // =========================================================

  public isActive(): boolean {
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
    scene.add(
      this.group
    );
  }

  public removeFromScene(
    scene: THREE.Scene
  ): void {
    scene.remove(
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
