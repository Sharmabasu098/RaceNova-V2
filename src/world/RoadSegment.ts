import * as THREE from "three";

export interface RoadSegmentConfig {
  width: number;
  length: number;
  y?: number;
}

export class RoadSegment {
  public readonly mesh: THREE.Mesh;
  public readonly length: number;

  constructor(config: RoadSegmentConfig) {
    this.length = config.length;

    const geometry = new THREE.PlaneGeometry(
      config.width,
      config.length
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0x303030,
      roughness: 0.9,
      metalness: 0.05
    });

    this.mesh = new THREE.Mesh(geometry, material);

    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = config.y ?? 0.01;
  }

  public setZ(z: number): void {
    this.mesh.position.z = z;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();

    if (Array.isArray(this.mesh.material)) {
      this.mesh.material.forEach((material) => {
        material.dispose();
      });
    } else {
      this.mesh.material.dispose();
    }
  }
}
