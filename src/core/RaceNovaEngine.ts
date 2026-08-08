import * as THREE from "three";
import { World } from "../world/World";

export class RaceNovaEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;
  private world: World;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, -20);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    container.appendChild(
      this.renderer.domElement
    );

    this.clock = new THREE.Clock();

    this.setupLighting();

    this.world = new World(
      this.scene,
      {
        roadWidth: 12,
        roadSegmentLength: 50,
        roadSegmentCount: 12
      }
    );

    window.addEventListener(
      "resize",
      this.handleResize
    );
  }

  private setupLighting(): void {
    const ambientLight =
      new THREE.AmbientLight(
        0xffffff,
        1.5
      );

    this.scene.add(ambientLight);

    const sun =
      new THREE.DirectionalLight(
        0xffffff,
        2
      );

    sun.position.set(
      10,
      20,
      10
    );

    this.scene.add(sun);
  }

  public start(): void {
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(
      this.animate
    );

    const delta =
      this.clock.getDelta();

    this.update(delta);

    this.renderer.render(
      this.scene,
      this.camera
    );
  };

  private update(
    _delta: number
  ): void {
    // Temporary player position.
    // Player system will replace this later.
    const playerZ = 0;

    this.world.update(
      playerZ
    );
  }

  private handleResize = (): void => {
    this.camera.aspect =
      window.innerWidth /
      window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  };
}
