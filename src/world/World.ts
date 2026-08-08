import * as THREE from "three";
import { RoadManager } from "./RoadManager";

export interface WorldConfig {
  roadWidth: number;
  roadSegmentLength: number;
  roadSegmentCount: number;
}

export class World {
  private readonly scene: THREE.Scene;
  private readonly roadManager: RoadManager;

  constructor(
    scene: THREE.Scene,
    config: WorldConfig
  ) {
    this.scene = scene;

    this.createGround();

    this.roadManager = new RoadManager(
      this.scene,
      {
        roadWidth: config.roadWidth,
        segmentLength: config.roadSegmentLength,
        segmentCount: config.roadSegmentCount
      }
    );
  }

  private createGround(): void {
    const geometry = new THREE.PlaneGeometry(
      200,
      200
    );

    const material = new THREE.MeshStandardMaterial({
      color: 0x3f7d3f,
      roughness: 1
    });

    const ground = new THREE.Mesh(
      geometry,
      material
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;

    this.scene.add(ground);
  }

  public update(playerZ: number): void {
    this.roadManager.update(playerZ);
  }

  public dispose(): void {
    this.roadManager.dispose();
  }
}
