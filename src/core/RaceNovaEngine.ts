import * as THREE from "three";

import { World } from "../world/World";
import { PlayerCar } from "../player/PlayerCar";
import { CarController } from "../player/CarController";
import { SwipeController } from "../player/SwipeController";
import { TrafficManager } from "../traffic/TrafficManager";
import { TrafficCollisionSystem } from "../collision/TrafficCollisionSystem";
import { RaceHUD } from "../ui/RaceHUD";

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

  // =========================================================
  // HUD
  // =========================================================

  /*
   * RaceHUD is now the ONLY authoritative
   * speed + Nitro display.
   *
   * Old duplicate speedDisplay,
   * nitroStatus and nitroButton HUD
   * have been removed.
   */
  private readonly raceHUD: RaceHUD;

  constructor(
    container: HTMLElement
  ) {
    // =====================================================
    // Scene
    // =====================================================

    this.scene =
      new THREE.Scene();

    this.scene.background =
      new THREE.Color(
        0x87ceeb
      );

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

    this.renderer.shadowMap.enabled =
      true;

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

    this.world =
      new World(
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
        scale: 1,

        maxSpeed: 128,
        acceleration: 35,
        hardSpeedCap: 180,

        nitroSpeed: 165,
        nitroDuration: 3
      });

    this.playerCar.addToScene(
      this.scene
    );

    // =====================================================
// Race HUD
// =====================================================

this.raceHUD =
  new RaceHUD(
    this.playerCar,
    () => {
      this.activateNitro();
    }
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
    // Keyboard Nitro
    // =====================================================

    window.addEventListener(
      "keydown",
      this.handleNitroKeyDown
    );

    // =====================================================
    // Resize
    // =====================================================

    window.addEventListener(
      "resize",
      this.handleResize
    );

    // =====================================================
    // Initial HUD
    // =====================================================

    this.raceHUD.update();
  }

  // =========================================================
  // Nitro Activation
  // =========================================================

  private activateNitro(): void {
    /*
     * Nitro cannot be activated after
     * a traffic crash.
     */
    if (
      this.trafficCollisionSystem.hasCrashed()
    ) {
      return;
    }

    /*
     * PlayerCar itself also protects
     * against duplicate Nitro activation.
     */
    if (
      this.playerCar.isNitroActive()
    ) {
      return;
    }

    this.playerCar.activateNitro();

    /*
     * Immediately refresh the authoritative HUD.
     */
    this.raceHUD.update();
  }

  // =========================================================
  // Keyboard Nitro
  // =========================================================

  private handleNitroKeyDown = (
    event: KeyboardEvent
  ): void => {
    if (
      event.key.toLowerCase() !==
      "n"
    ) {
      return;
    }

    if (
      event.repeat
    ) {
      return;
    }

    this.activateNitro();
  };

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

    sun.castShadow =
      true;

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
  // Main Update
  // =========================================================

  private update(
    deltaTime: number
  ): void {
    if (
      deltaTime <= 0 ||
      !Number.isFinite(deltaTime)
    ) {
      return;
    }

    // =====================================================
    // Player Forward Movement
    // =====================================================

    /*
     * Player movement stops after crash.
     */
    if (
      !this.trafficCollisionSystem.hasCrashed()
    ) {
      this.playerCar.update(
        deltaTime
      );
    }

    // =====================================================
    // Player Steering
    // =====================================================

    /*
     * Keep steering system active so
     * the input system remains stable.
     */
    this.carController.update(
      deltaTime
    );

    // =====================================================
    // Player Position
    // =====================================================

    const playerPosition =
      this.playerCar.getPosition();

    const playerZ =
      playerPosition.z;

    // =====================================================
    // World
    // =====================================================

    this.world.update(
      playerZ
    );

    // =====================================================
    // Traffic
    // =====================================================

    this.trafficManager.update(
      deltaTime,
      playerZ
    );

    // =====================================================
    // Traffic Collision
    // =====================================================

    /*
     * IMPORTANT:
     *
     * TrafficCollisionSystem.update()
     * currently accepts ONLY the traffic
     * car array.
     *
     * Do NOT pass deltaTime here.
     */
    this.trafficCollisionSystem.update(
      this.trafficManager.getTrafficCars()
    );

    // =====================================================
    // HUD
    // =====================================================

    /*
     * RaceHUD reads the actual PlayerCar
     * speed/Nitro state every frame.
     *
     * There is no second speed HUD anymore.
     */
    this.raceHUD.update();

    // =====================================================
    // Chase Camera
    // =====================================================

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
  };

  // =========================================================
  // Resize
  // =========================================================

  private handleResize = (): void => {
    const width =
      window.innerWidth;

    const height =
      window.innerHeight;

    if (
      height <= 0
    ) {
      return;
    }

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
    // -----------------------------------------------------
    // Event listeners
    // -----------------------------------------------------

    window.removeEventListener(
      "resize",
      this.handleResize
    );

    window.removeEventListener(
      "keydown",
      this.handleNitroKeyDown
    );

    // -----------------------------------------------------
    // Controllers
    // -----------------------------------------------------

    this.swipeController.dispose();

    this.carController.dispose();

    // -----------------------------------------------------
    // Gameplay systems
    // -----------------------------------------------------

    this.trafficManager.dispose();

    this.trafficCollisionSystem.dispose();

    this.playerCar.dispose();

    this.world.dispose();

    // -----------------------------------------------------
    // HUD
    // -----------------------------------------------------

    this.raceHUD.dispose();

    // -----------------------------------------------------
    // Renderer
    // -----------------------------------------------------

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
