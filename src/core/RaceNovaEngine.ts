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
  // Mobile HUD
  // =========================================================

  private readonly hudContainer: HTMLDivElement;
  private readonly speedDisplay: HTMLDivElement;
  private readonly nitroButton: HTMLButtonElement;
  private readonly nitroStatus: HTMLDivElement;
  private readonly raceHUD: RaceHUD;

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

    this.raceHUD =
  new RaceHUD(
    this.playerCar
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
    // HUD
    // =====================================================

    this.hudContainer =
      document.createElement(
        "div"
      );

    this.speedDisplay =
      document.createElement(
        "div"
      );

    this.nitroStatus =
      document.createElement(
        "div"
      );

    this.nitroButton =
      document.createElement(
        "button"
      );

    this.createHUD();

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
  }

  // =========================================================
  // HUD
  // =========================================================

  private createHUD(): void {
    // -----------------------------------------------------
    // Main HUD container
    // -----------------------------------------------------

    this.hudContainer.style.position =
      "fixed";

    this.hudContainer.style.left =
      "0";

    this.hudContainer.style.top =
      "0";

    this.hudContainer.style.width =
      "100%";

    this.hudContainer.style.height =
      "100%";

    this.hudContainer.style.pointerEvents =
      "none";

    this.hudContainer.style.zIndex =
      "1000";

    // -----------------------------------------------------
    // Speed display
    // -----------------------------------------------------

    this.speedDisplay.style.position =
      "absolute";

    this.speedDisplay.style.top =
      "20px";

    this.speedDisplay.style.left =
      "20px";

    this.speedDisplay.style.minWidth =
      "105px";

    this.speedDisplay.style.padding =
      "10px 14px";

    this.speedDisplay.style.borderRadius =
      "12px";

    this.speedDisplay.style.background =
      "rgba(0, 0, 0, 0.55)";

    this.speedDisplay.style.color =
      "#ffffff";

    this.speedDisplay.style.fontFamily =
      "Arial, sans-serif";

    this.speedDisplay.style.fontWeight =
      "700";

    this.speedDisplay.style.fontSize =
      "22px";

    this.speedDisplay.style.textAlign =
      "center";

    this.speedDisplay.textContent =
      "0 km/h";

    // -----------------------------------------------------
    // Nitro status
    // -----------------------------------------------------

    this.nitroStatus.style.position =
      "absolute";

    this.nitroStatus.style.top =
      "88px";

    this.nitroStatus.style.left =
      "20px";

    this.nitroStatus.style.color =
      "#ffffff";

    this.nitroStatus.style.fontFamily =
      "Arial, sans-serif";

    this.nitroStatus.style.fontWeight =
      "700";

    this.nitroStatus.style.fontSize =
      "15px";

    this.nitroStatus.textContent =
      "NITRO READY";

    // -----------------------------------------------------
    // Nitro button
    // -----------------------------------------------------

    this.nitroButton.type =
      "button";

    this.nitroButton.textContent =
      "⚡ NITRO";

    this.nitroButton.style.position =
      "absolute";

    this.nitroButton.style.right =
      "24px";

    this.nitroButton.style.bottom =
      "30px";

    this.nitroButton.style.width =
      "125px";

    this.nitroButton.style.height =
      "60px";

    this.nitroButton.style.border =
      "none";

    this.nitroButton.style.borderRadius =
      "18px";

    this.nitroButton.style.background =
      "#ff7a00";

    this.nitroButton.style.color =
      "#ffffff";

    this.nitroButton.style.fontFamily =
      "Arial, sans-serif";

    this.nitroButton.style.fontSize =
      "18px";

    this.nitroButton.style.fontWeight =
      "900";

    this.nitroButton.style.boxShadow =
      "0 5px 18px rgba(0,0,0,0.35)";

    this.nitroButton.style.pointerEvents =
      "auto";

    this.nitroButton.style.touchAction =
      "manipulation";

    this.nitroButton.style.userSelect =
      "none";

    // -----------------------------------------------------
    // Mobile touch
    // -----------------------------------------------------

    this.nitroButton.addEventListener(
      "pointerdown",
      this.handleNitroButton
    );

    // -----------------------------------------------------
    // Add HUD
    // -----------------------------------------------------

    this.hudContainer.appendChild(
      this.speedDisplay
    );

    this.hudContainer.appendChild(
      this.nitroStatus
    );

    this.hudContainer.appendChild(
      this.nitroButton
    );

    document.body.appendChild(
      this.hudContainer
    );
  }

  // =========================================================
  // Nitro Button
  // =========================================================

  private handleNitroButton = (
    event: PointerEvent
  ): void => {
    event.preventDefault();

    this.activateNitro();
  };

  // =========================================================
  // Nitro Activation
  // =========================================================

  private activateNitro(): void {
    if (
      this.trafficCollisionSystem.hasCrashed()
    ) {
      return;
    }

    if (
      this.playerCar.isNitroActive()
    ) {
      return;
    }

    this.playerCar.activateNitro();

    this.updateHUD();
  }

  // =========================================================
  // Keyboard Nitro
  // =========================================================

  private handleNitroKeyDown = (
    event: KeyboardEvent
  ): void => {
    if (
      event.key.toLowerCase() !== "n"
    ) {
      return;
    }

    if (event.repeat) {
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

    if (
      !this.trafficCollisionSystem.hasCrashed()
    ) {
      this.playerCar.update(
        deltaTime
      );
      this.raceHUD.update();
    }

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
    // World
    // -----------------------------------------------------

    this.world.update(
      playerZ
    );

    // -----------------------------------------------------
    // Traffic
    // -----------------------------------------------------

    this.trafficManager.update(
      deltaTime,
      playerZ
    );

    // -----------------------------------------------------
    // Collision
    // -----------------------------------------------------

    this.trafficCollisionSystem.update(
      this.trafficManager.getTrafficCars()
    );

    // -----------------------------------------------------
    // HUD
    // -----------------------------------------------------

    this.updateHUD();

    // -----------------------------------------------------
    // Chase Camera
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
  };

  // =========================================================
  // HUD Update
  // =========================================================

  private updateHUD(): void {
    const speed =
      Math.round(
        this.playerCar.getSpeed()
      );

    this.speedDisplay.textContent =
      `${speed} km/h`;

    if (
      this.playerCar.isNitroActive()
    ) {
      const remaining =
        this.playerCar
          .getNitroTimeRemaining();

      this.nitroStatus.textContent =
        `⚡ NITRO ${remaining.toFixed(1)}s`;

      this.nitroButton.textContent =
        `⚡ ${remaining.toFixed(1)}s`;

      this.nitroButton.style.opacity =
        "0.75";
    } else {
      this.nitroStatus.textContent =
        "NITRO READY";

      this.nitroButton.textContent =
        "⚡ NITRO";

      this.nitroButton.style.opacity =
        "1";
    }
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

    window.removeEventListener(
      "keydown",
      this.handleNitroKeyDown
    );

    this.nitroButton.removeEventListener(
      "pointerdown",
      this.handleNitroButton
    );

    this.swipeController.dispose();

    this.carController.dispose();

    this.trafficManager.dispose();

    this.trafficCollisionSystem.dispose();

    this.playerCar.dispose();

    this.world.dispose();

    this.renderer.dispose();

    this.raceHUD.dispose();

    if (
      this.hudContainer.parentElement
    ) {
      this.hudContainer.parentElement.removeChild(
        this.hudContainer
      );
    }

    if (
      this.renderer.domElement.parentElement
    ) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }
  }
}
