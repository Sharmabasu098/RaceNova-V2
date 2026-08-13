import * as THREE from "three";

import { World } from "../world/World";
import { PlayerCar } from "../player/PlayerCar";
import { CarController } from "../player/CarController";
import { SwipeController } from "../player/SwipeController";
import { TrafficManager } from "../traffic/TrafficManager"; 
import { TrafficCollisionSystem } from "../collision/TrafficCollisionSystem";

export class RaceNovaEngine {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly clock: THREE.Clock;

  private readonly world: World;
  private readonly playerCar: PlayerCar;
  private readonly carController: CarController;
  private readonly swipeController: SwipeController;
  private readonly trafficManager: TrafficManager;
  private readonly trafficCollisionSystem:
  TrafficCollisionSystem;

  constructor(container: HTMLElement) {
    // =====================================================
    // Scene
    // =====================================================

    this.scene = new THREE.Scene();

    this.scene.background =
      new THREE.Color(0x87ceeb);

    // =====================================================
    // Camera
    // =====================================================

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

    // =====================================================
    // Renderer
    // =====================================================

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

    this.renderer.shadowMap.enabled = true;

    container.appendChild(
      this.renderer.domElement
    );

    // =====================================================
    // Clock
    // =====================================================

    this.clock =
      new THREE.Clock();

    // =====================================================
    // Lighting
    // =====================================================

    this.setupLighting();

    // =====================================================
    // World
    // =====================================================

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

    // =====================================================
    // Player Car
    // =====================================================

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

    // =====================================================
    // Car Controller
    // =====================================================

    this.carController =
      new CarController(
        this.playerCar,
        {
          laneWidth: 4,
          laneCount: 3,
          steeringSpeed: 10,

          /*
           * IMPORTANT:
           *
           * Player steering now uses the
           * actual curved road center.
           */
          getRoadCenterX: (
            worldZ: number
          ) =>
            this.world.getRoadCenterX(
              worldZ
            )
        }
      );

    // =====================================================
    // Swipe Controller
    // =====================================================

    this.swipeController =
      new SwipeController(
        this.carController,
        {
          swipeThreshold: 50,
          target:
            this.renderer.domElement
        }
      );

    // =====================================================
    // Traffic Manager
    // =====================================================

    this.trafficManager =
      new TrafficManager(
        this.scene,
        {
          laneWidth: 4,
          laneCount: 3,

          maxTraffic: 8,

          spawnDistance: 140,
          despawnDistance: 80,

          minSpeed: 55,
          maxSpeed: 95,

          getRoadCenterX: (
            worldZ: number
          ) =>
            this.world.getRoadCenterX(
              worldZ
            )
        }
      );

    // =====================================================
// Traffic Collision System
// =====================================================

this.trafficCollisionSystem =
  new TrafficCollisionSystem(
    this.playerCar,
    {
      collisionWidth: 1.8,
      collisionDepth: 3.4
    }
  );

    // =====================================================
    // Resize
    // =====================================================

    window.addEventListener(
      "resize",
      this.handleResize
    );
  }

  // =========================================================
  // Lighting
  // =========================================================

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

    sun.castShadow = true;

    this.scene.add(
      sun
    );
  }

  // =========================================================
  // Start
  // =========================================================

  public start(): void {
    this.clock.start();

    this.animate();
  }

  // =========================================================
  // Animation
  // =========================================================

  private animate = (): void => {
    requestAnimationFrame(
      this.animate
    );

    const deltaTime =
      this.clock.getDelta();

    this.update(
      deltaTime
    );

    this.renderer.render(
      this.scene,
      this.camera
    );
  };

  // =========================================================
  // Update
  // =========================================================

  private update(
    deltaTime: number
  ): void {
    if (
      deltaTime <= 0
    ) {
      return;
    }

    // -----------------------------------------------------
    // Player forward movement
    // -----------------------------------------------------

    this.playerCar.update(
      deltaTime
    );

    // -----------------------------------------------------
    // Player steering
    // -----------------------------------------------------

    this.carController.update(
      deltaTime
    );

    // -----------------------------------------------------
    // Player position
    // -----------------------------------------------------

    const playerPosition =
      this.playerCar.getPosition();

    const playerZ =
      playerPosition.z;

    // -----------------------------------------------------
    // Update world
    // -----------------------------------------------------

    this.world.update(
      playerZ
    );

    // -----------------------------------------------------
    // Update traffic
    // -----------------------------------------------------

    this.trafficManager.update(
      deltaTime,
      playerZ
    );

    this.trafficCollisionSystem.update(
  this.trafficManager.getTrafficCars()
);

    // -----------------------------------------------------
    // Chase camera
    // -----------------------------------------------------

    const targetCameraX =
      playerPosition.x;

    const targetCameraZ =
      playerZ + 10;

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
      playerZ - 20
    );
  }

  // =========================================================
  // Resize
  // =========================================================

  private handleResize = (): void => {
    const width =
      window.innerWidth;

    const height =
      window.innerHeight;

    this.camera.aspect =
      width / height;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      width,
      height
    );

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );
  };

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    window.removeEventListener(
      "resize",
      this.handleResize
    );

    this.swipeController.dispose();

    this.carController.dispose();

    this.trafficManager.dispose();

    this.trafficCollisionSystem.dispose();

    this.playerCar.dispose();

    this.world.dispose();

    this.renderer.dispose();

    if (
      this.renderer.domElement.parentElement
    ) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }
  }
}
