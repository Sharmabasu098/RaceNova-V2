import * as THREE from "three";
import { World } from "../world/World";
import { PlayerCar } from "../player/PlayerCar";
import { CarController } from "../player/CarController";
import { SwipeController } from "../player/SwipeController";

export class RaceNovaEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock: THREE.Clock;

  private readonly world: World;
  private readonly playerCar: PlayerCar;
  private readonly carController: CarController;
  private readonly swipeController: SwipeController;

  constructor(container: HTMLElement) {
    // Scene
    this.scene = new THREE.Scene();

    this.scene.background =
      new THREE.Color(0x87ceeb);

    // Camera
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
      0.5,
      -20
    );

    // Renderer
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

    // Clock
    this.clock =
      new THREE.Clock();

    // Lighting
    this.setupLighting();

    // World
     this.world = new World(
  this.scene,
  {
    roadWidth: 12,
    roadSegmentLength: 50,
    roadSegmentCount: 24,
    laneCount: 3,
    curveStrength: 8,
    curveFrequency: 0.008
  }
);

    // Player Car
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

    // Car Controller
    this.carController =
  new CarController(
    this.playerCar,
    {
      laneWidth: 4,
      laneCount: 3,
      steeringSpeed: 10,

      getRoadCenterX:
        (worldZ: number) =>
          this.world.getRoadCenterX(
            worldZ
          )
    }
  );

    // Swipe Controller
    this.swipeController =
      new SwipeController(
        this.carController,
        {
          swipeThreshold: 50,
          target:
            this.renderer.domElement
        }
      );

    // Resize
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
    // Player movement
    this.playerCar.update(
      deltaTime
    );

    // Steering
    this.carController.update(
      deltaTime
    );

    // World
    const playerZ =
      this.playerCar.getPosition().z;

    this.world.update(
      playerZ
    );

    // Chase camera
    const playerPosition =
      this.playerCar.getPosition();

    const targetCameraX =
      playerPosition.x;

    const targetCameraZ =
      playerPosition.z + 10;

    this.camera.position.x =
      THREE.MathUtils.damp(
        this.camera.position.x,
        targetCameraX,
        8,
        deltaTime
      );

    this.camera.position.z =
      THREE.MathUtils.damp(
        this.camera.position.z,
        targetCameraZ,
        5,
        deltaTime
      );

    this.camera.lookAt(
      playerPosition.x,
      0.5,
      playerPosition.z - 20
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

    this.swipeController.dispose();
    this.carController.dispose();

    this.playerCar.dispose();
    this.world.dispose();

    this.renderer.dispose();
  }
}
