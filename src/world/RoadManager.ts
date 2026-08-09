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
    for (
      let i = 0;
      i < this.config.segmentCount;
      i++
    ) {
      const segment = new RoadSegment({
        width: this.config.roadWidth,
        length: this.config.segmentLength
      });

      // Road extends forward in -Z direction
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

    /*
     * Player moves toward -Z.
     *
     * When a road segment is far behind
     * the player, recycle it to the front.
     */
    const recycleDistance =
      this.config.segmentLength;

    for (const segment of this.segments) {
      const segmentZ =
        segment.mesh.position.z;

      const isBehindPlayer =
        segmentZ >
        playerZ + recycleDistance;

      if (isBehindPlayer) {
        segment.mesh.position.z -=
          totalLength;
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
