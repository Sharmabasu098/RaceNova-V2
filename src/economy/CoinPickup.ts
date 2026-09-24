/**
 * ============================================================
 * RaceNova V2
 * Coin Pickup
 * M4.4
 * ============================================================
 *
 * 3D collectible coin used by the RaceNova gameplay world.
 *
 * Responsibilities:
 * - Create the 3D coin
 * - Rotate the coin
 * - Detect player proximity
 * - Report collection
 *
 * Does NOT:
 * - Manage player balance
 * - Save data
 * - Spawn other coins
 * - Handle UI
 *
 * CoinManager + EconomyManager handle those responsibilities.
 * ============================================================
 */

import * as THREE from "three";

export interface CoinPickupConfig {
  x?: number;
  y?: number;
  z?: number;

  value?: number;

  radius?: number;
}

export class CoinPickup {
  public readonly group: THREE.Group;

  private readonly coinMesh: THREE.Mesh;

  private readonly value: number;

  private readonly radius: number;

  private collected = false;

  private readonly rotationSpeed = 4.5;

  private readonly bobSpeed = 3;

  private readonly bobHeight = 0.12;

  private readonly baseY: number;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    config: CoinPickupConfig = {}
  ) {
    this.group =
      new THREE.Group();

    // -------------------------------------------------------
    // Configuration
    // -------------------------------------------------------

    this.value =
      Math.max(
        1,
        Math.floor(
          config.value ?? 1
        )
      );

    this.radius =
      Math.max(
        0.5,
        config.radius ?? 1.35
      );

    const x =
      config.x ?? 0;

    const y =
      config.y ?? 1;

    const z =
      config.z ?? 0;

    this.baseY = y;

    this.group.position.set(
      x,
      y,
      z
    );

    // =====================================================
    // Coin Geometry
    // =====================================================

    const geometry =
      new THREE.CylinderGeometry(
        0.42,
        0.42,
        0.12,
        24
      );

    // =====================================================
    // Coin Material
    // =====================================================

    const material =
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0x5a4300,
        emissiveIntensity: 0.35,
        roughness: 0.3,
        metalness: 0.85
      });

    this.coinMesh =
      new THREE.Mesh(
        geometry,
        material
      );

    /*
     * Cylinder default axis is Y.
     *
     * Rotate it so the coin face
     * is visible from the player's
     * forward direction.
     */
    this.coinMesh.rotation.z =
      Math.PI / 2;

    this.coinMesh.castShadow =
      true;

    this.coinMesh.receiveShadow =
      true;

    this.group.add(
      this.coinMesh
    );
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number
  ): void {
    if (
      this.collected ||
      deltaTime <= 0 ||
      !Number.isFinite(
        deltaTime
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // Rotation
    // -------------------------------------------------------

    this.coinMesh.rotation.y +=
      this.rotationSpeed *
      deltaTime;

    // -------------------------------------------------------
    // Floating animation
    // -------------------------------------------------------

    const elapsed =
      performance.now() *
      0.001;

    this.group.position.y =
      this.baseY +
      Math.sin(
        elapsed *
        this.bobSpeed
      ) *
      this.bobHeight;
  }

  // =========================================================
  // Collection Detection
  // =========================================================

  public checkCollection(
    playerPosition: THREE.Vector3
  ): boolean {
    if (
      this.collected
    ) {
      return false;
    }

    if (
      !playerPosition
    ) {
      return false;
    }

    const distance =
      this.group.position.distanceTo(
        playerPosition
      );

    if (
      distance >
      this.radius
    ) {
      return false;
    }

    this.collect();

    return true;
  }

  // =========================================================
  // Collect
  // =========================================================

  public collect(): void {
    if (
      this.collected
    ) {
      return;
    }

    this.collected =
      true;

    this.group.visible =
      false;
  }

  // =========================================================
  // State
  // =========================================================

  public isCollected(): boolean {
    return this.collected;
  }

  // =========================================================
  // Value
  // =========================================================

  public getValue(): number {
    return this.value;
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
  // Scene
  // =========================================================

  public addToScene(
    scene: THREE.Scene
  ): void {
    if (
      this.group.parent !==
      scene
    ) {
      scene.add(
        this.group
      );
    }
  }

  public removeFromScene(
    scene: THREE.Scene
  ): void {
    if (
      this.group.parent ===
      scene
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
  }
}
