import * as THREE from "three";
import { World } from "../world/World";
import { PlayerCar } from "../player/PlayerCar";

export class RaceNovaEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock: THREE.Clock;

  private readonly world: World;
  private readonly playerCar: PlayerCar;

  constructor(container: HTMLElement) {
    // -------------------------
    // Scene
    // -------------------------

    this.scene = new THREE.Scene();

    this.scene.background =
      new THREE.Color(0x87ceeb);

    // -------------------------
    // Camera
    // -------------------------

    this.camera =
      new THREE.PerspectiveCamera(
        60,
        window.innerWidth /
          window.innerHeight,
        0.1,
        1000
      );

    this.camera.position.set(
      0,
      5,
      10
    );

    this.camera.lookAt(
      0,
      0,
      -20
    );

    // -------------------------
    // Renderer
    // -------------------------

    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        powerPreference:
          "high-performance"
      });

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    container.appendChild(
      this.renderer.domElement
    );

    // -------------------------
    // Clock
    // -------------------------

    this.clock =
      new THREE.Clock();

    // -------------------------
    // Lighting
    // -------------------------

    this.setupLighting();

    // -------------------------
    // World
    // -------------------------

    this.world = new World(
      this.scene,
      {
        roadWidth: 12,
        roadSegmentLength: 50,
        roadSegmentCount: 12
      }
    );

    // -------------------------
    // Player Car
    // -------------------------

    this.playerCar =
      new PlayerCar({
        x: 0,
        y: 0,
        z: 0,
        scale: 1
      });

    this.playerCar.addToScene(
      this.scene
    );

    // -------------------------
    // Resize
    // -------------------------

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

    this.scene.add(
      ambientLight
    );

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

    const deltaTime =
      this.clock.getDelta();

    this.update(deltaTime);

    this.renderer.render(
      this.scene,
      this.camera
    );
  };

  private update(
    deltaTime: number
  ): void {
    // -------------------------
    // Player
    // -------------------------

    this.playerCar.update(
      deltaTime
    );

    // -------------------------
    // World
    // -------------------------

    const playerZ =
      this.playerCar.getPosition().z;

    this.world.update(
      playerZ
    );

    // -------------------------
    // Temporary Chase Camera
    // -------------------------

    const targetZ =
      playerZ + 10;

    this.camera.position.x =
      this.playerCar.getPosition().x;

    this.camera.position.z =
      THREE.MathUtils.lerp(
        this.camera.position.z,
        targetZ,
        5 * deltaTime
      );

    this.camera.lookAt(
      this.playerCar.getPosition().x,
      0.5,
      playerZ - 20
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

  public dispose(): void {
    window.removeEventListener(
      "resize",
      this.handleResize
    );

    this.playerCar.dispose();
    this.world.dispose();

    this.renderer.dispose();
  }
  }
