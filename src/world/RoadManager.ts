import * as THREE from "three";
import { RoadSegment } from "./RoadSegment";

export interface RoadManagerConfig {
  roadWidth: number;
  segmentLength: number;
  segmentCount: number;
}

export class RoadManager {
  private readonly scene: THREE.Scene;
  private readonly config: RoadManagerConfig;

  private readonly segments: RoadSegment[] = [];

  constructor(
    scene: THREE.Scene,
    config: RoadManagerConfig
  ) {
    this.scene = scene;
    this.config = config;

    this.createSegments();
  }

  private createSegments(): void {
    for (let i = 0; i < this.config.segmentCount; i++) {
      const segment = new RoadSegment({
        width: this.config.roadWidth,
        length: this.config.segmentLength
      });

      segment.setZ(
        -i * this.config.segmentLength
      );

      this.segments.push(segment);
      this.scene.add(segment.mesh);
    }
  }

  public update(playerZ: number): void {
    const totalLength =
      this.config.segmentLength *
      this.config.segmentCount;

    for (const segment of this.segments) {
      const distanceBehind =
        playerZ - segment.mesh.position.z;

      if (distanceBehind > this.config.segmentLength) {
        segment.mesh.position.z -= totalLength;
      }
    }
  }

  public dispose(): void {
    for (const segment of this.segments) {
      this.scene.remove(segment.mesh);
      segment.dispose();
    }

    this.segments.length = 0;
  }
}
