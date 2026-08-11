import * as THREE from "three";

export interface PlayerCarConfig {
  x?: number;
  y?: number;
  z?: number;
  scale?: number;
}

export class PlayerCar {
  public readonly group: THREE.Group;

  private readonly body: THREE.Mesh;
  private readonly wheels: THREE.Mesh[] = [];

  private speed = 0;
  private readonly maxSpeed = 128;
  private readonly acceleration = 35;

  constructor(config: PlayerCarConfig = {}) {
    this.group = new THREE.Group();

    const scale = config.scale ?? 1;

    this.group.position.set(
      config.x ?? 0,
      config.y ?? 0.55,
      config.z ?? 0
    );

    this.group.scale.setScalar(scale);

    // -------------------------
    // Car body
    // -------------------------

    const bodyGeometry = new THREE.BoxGeometry(
      2.2,
      0.55,
      4.2
    );

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xb51f2a,
      roughness: 0.65,
      metalness: 0.15
    });

    this.body = new THREE.Mesh(
      bodyGeometry,
      bodyMaterial
    );

    this.body.position.y = 0.35;

    this.group.add(this.body);

    // -------------------------
    // Cabin
    // -------------------------

    const cabinGeometry = new THREE.BoxGeometry(
      1.55,
      0.55,
      1.75
    );

    const cabinMaterial = new THREE.MeshStandardMaterial({
      color: 0x20252b,
      roughness: 0.35,
      metalness: 0.1
    });

    const cabin = new THREE.Mesh(
      cabinGeometry,
      cabinMaterial
    );

    cabin.position.set(
      0,
      0.82,
      -0.15
    );

    this.group.add(cabin);

    // -------------------------
    // Wheels
    // -------------------------

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

    const wheelPositions: Array<
      [number, number, number]
    > = [
      [-1.12, 0.25, 1.35],
      [1.12, 0.25, 1.35],
      [-1.12, 0.25, -1.35],
      [1.12, 0.25, -1.35]
    ];

    for (const [x, y, z] of wheelPositions) {
      const wheel = new THREE.Mesh(
        wheelGeometry,
        wheelMaterial
      );

      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, y, z);

      this.wheels.push(wheel);
      this.group.add(wheel);
    }

    // -------------------------
    // Front headlights
    // -------------------------

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

    for (const x of [-0.62, 0.62]) {
      const light = new THREE.Mesh(
        headlightGeometry,
        headlightMaterial
      );

      light.position.set(
        x,
        0.52,
        -2.08
      );

      this.group.add(light);
    }
  }

  public update(deltaTime: number): void {
    if (deltaTime <= 0) return;

    this.speed +=
      this.acceleration * deltaTime;

    this.speed = Math.min(
      this.speed,
      this.maxSpeed
    );

    // km/h → world units/second
    const worldSpeed =
      this.speed / 3.6;

    this.group.position.z -=
      worldSpeed * deltaTime;

    // Simple wheel rotation
    const wheelRotation =
      worldSpeed * deltaTime / 0.42;

    for (const wheel of this.wheels) {
      wheel.rotation.x -= wheelRotation;
    }
  }

  public getSpeed(): number {
    return this.speed;
  }

  public setSpeed(speed: number): void {
    this.speed = THREE.MathUtils.clamp(
      speed,
      0,
      this.maxSpeed
    );
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position;
  }

  public setX(x: number): void {
    this.group.position.x = x;
  }

  public setZ(z: number): void {
    this.group.position.z = z;
  }

  public setRotationY(
  rotationY: number
): void {
  this.group.rotation.y = rotationY;
}

public getRotationY(): number {
  return this.group.rotation.y;
}

  public addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }

  public dispose(): void {
    this.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) {
        return;
      }

      object.geometry.dispose();

      if (Array.isArray(object.material)) {
        object.material.forEach((material) => {
          material.dispose();
        });
      } else {
        object.material.dispose();
      }
    });
  }
  }
