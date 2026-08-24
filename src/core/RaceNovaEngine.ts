import * as THREE from "three";

import { World } from "../world/World";

import { PlayerCar } from "../player/PlayerCar";
import { CarController } from "../player/CarController";
import { SwipeController } from "../player/SwipeController";

import { TrafficManager } from "../traffic/TrafficManager";
import { TrafficCollisionSystem } from "../collision/TrafficCollisionSystem";

import { RaceHUD } from "../ui/RaceHUD";
import { Garage } from "../ui/Garage";
import { UpgradeScreen } from "../ui/UpgradeScreen";

import { EconomyManager } from "../economy/EconomyManager";
import { CoinSpawner } from "../economy/CoinSpawner";

import { GarageManager } from "../garage/GarageManager";
import { UpgradeSystem } from "../garage/UpgradeSystem";

import { SaveSystem } from "../save/SaveSystem";

import {
  type PlayerSaveData,
  type PlayerProgress,
  PLAYER_SAVE_VERSION,
  createDefaultPlayerSaveData,
  createDefaultPlayerProgress,
  normalizePlayerProgress,
  isValidPlayerSaveData
} from "../save/PlayerSaveData";

import {
  RACE_DEFINITIONS
} from "../race/RaceDefinitions";

// ============================================================
// M6.7 — Boss System
// ============================================================

import {
  BossManager
} from "../bosses/BossManager";

import {
  BossRace
} from "../bosses/BossRace";

export class RaceNovaEngine {

  // =========================================================
  // Core
  // =========================================================

  private readonly renderer:
    THREE.WebGLRenderer;

  private readonly scene:
    THREE.Scene;

  private readonly camera:
    THREE.PerspectiveCamera;

  private readonly clock:
    THREE.Clock;

  // =========================================================
  // World
  // =========================================================

  private readonly world:
    World;

  // =========================================================
  // Player
  // =========================================================

  private readonly playerCar:
    PlayerCar;

  private readonly carController:
    CarController;

  private readonly swipeController:
    SwipeController;

  // =========================================================
  // Traffic
  // =========================================================

  private readonly trafficManager:
    TrafficManager;

  private readonly trafficCollisionSystem:
    TrafficCollisionSystem;

  // =========================================================
  // Economy
  // =========================================================

  private readonly economyManager:
    EconomyManager;

  private readonly coinSpawner:
    CoinSpawner;

  // =========================================================
  // Garage
  // =========================================================

  private readonly garageManager:
    GarageManager;

  // =========================================================
  // Upgrade System
  // =========================================================

  private readonly upgradeSystem:
    UpgradeSystem;

  // =========================================================
  // Save System
  // =========================================================

  private readonly saveSystem:
    SaveSystem;

  // =========================================================
  // Player Progress
  // M6.9
  // =========================================================

  private playerProgress:
    PlayerProgress =
      createDefaultPlayerProgress(
        RACE_DEFINITIONS
      );

  // =========================================================
  // HUD
  // =========================================================

  private readonly raceHUD:
    RaceHUD;

  // =========================================================
  // Garage UI
  // =========================================================

  private readonly garageUI:
    Garage;

  // =========================================================
  // Upgrade UI
  // =========================================================

  private readonly upgradeScreen:
    UpgradeScreen;

  // =========================================================
  // M6.7 — Boss Manager
  // =========================================================

  private readonly bossManager:
    BossManager;

  // =========================================================
  // M6.7 — Boss Race
  // =========================================================

  private readonly bossRace:
    BossRace;

  // =========================================================
  // M6.7.4 — Boss 3D
  // =========================================================

  private readonly bossMesh:
    THREE.Group;

  /**
   * M6.7.4 verification flag.
   *
   * Boss is started automatically so the 3D
   * integration can be tested immediately.
   *
   * M6.8 will replace this with proper
   * Boss Unlock logic.
   */
  private bossEncounterStarted:
    boolean = false;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    container: HTMLElement
  ) {

    // =======================================================
    // Scene
    // =======================================================

    this.scene =
      new THREE.Scene();

    this.scene.background =
      new THREE.Color(
        0x87ceeb
      );

    // =======================================================
    // Camera
    // =======================================================

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

    // =======================================================
    // Renderer
    // =======================================================

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

    // =======================================================
    // Clock
    // =======================================================

    this.clock =
      new THREE.Clock();

    // =======================================================
    // Lighting
    // =======================================================

    this.setupLighting();

    // =======================================================
    // World
    // =======================================================

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

    // =======================================================
    // Economy Manager
    // =======================================================

    this.economyManager =
      new EconomyManager({
        initialCoins: 0
      });

    // =======================================================
    // Garage Manager
    // =======================================================

    this.garageManager =
      new GarageManager(
        this.economyManager
      );

    // =======================================================
    // Upgrade System
    // =======================================================

    this.upgradeSystem =
      new UpgradeSystem(
        this.economyManager
      );

    // =======================================================
    // Save System
    // =======================================================

    this.saveSystem =
      new SaveSystem(
        this.economyManager,
        this.garageManager,
        this.upgradeSystem
      );

    // =======================================================
    // Restore Save
    // =======================================================

    if (
      this.saveSystem.load()
    ) {

      const savedData =
        this.saveSystem.readSave();

      if (
        savedData
      ) {

        this.setPlayerProgress(
          savedData.progress
        );
      }
    }

    // =======================================================
    // Selected Car
    // =======================================================

    const selectedCar =
      this.garageManager.getSelectedCar();

    const selectedCarStats =
      this.upgradeSystem.getStats(
        selectedCar.id
      );

    // =======================================================
    // Player Car
    // =======================================================

    this.playerCar =
      new PlayerCar({

        x: 0,

        y: 0,

        z: 0,

        scale: 1,

        maxSpeed:
          selectedCarStats.maxSpeed,

        acceleration:
          selectedCarStats.acceleration,

        handling:
          selectedCarStats.handling,

        hardSpeedCap:
          Math.max(
            180,
            selectedCarStats.maxSpeed
          ),

        nitroSpeed:
          Math.min(
            selectedCarStats.maxSpeed + 37,
            Math.max(
              180,
              selectedCarStats.maxSpeed
            )
          ),

        nitroDuration:
          3
      });

    this.playerCar.addToScene(
      this.scene
    );

    // =======================================================
    // Coin Spawner
    // =======================================================

    this.coinSpawner =
      new CoinSpawner(
        this.scene,
        this.economyManager,
        {
          laneWidth: 4,

          laneCount: 3,

          spawnDistance: 180,

          despawnDistance: 60,

          coinSpacing: 10,

          coinHeight: 1,

          maxCoins: 30,

          getRoadCenterX: (
            worldZ: number
          ) =>
            this.world.getRoadCenterX(
              worldZ
            ),

          onCoinCollected: () => {

            this.savePlayerData();
          }
        }
      );

    // =======================================================
    // Race HUD
    // =======================================================

    this.raceHUD =
      new RaceHUD(
        this.playerCar,
        () => {
          this.activateNitro();
        },
        this.economyManager,
        () => {
          this.openGarage();
        }
      );

    // =======================================================
    // Garage UI
    // =======================================================

    this.garageUI =
      new Garage(
        this.garageManager,

        this.economyManager,

        {
          onChanged: () => {

            const selectedCarId =
              this.garageManager
                .getSelectedCarId();

            const upgradedStats =
              this.upgradeSystem.getStats(
                selectedCarId
              );

            this.playerCar.applyCarStats(
              upgradedStats.maxSpeed,
              upgradedStats.acceleration,
              upgradedStats.handling
            );

            this.savePlayerData();

            this.raceHUD.update();
          },

          upgradeSystem:
            this.upgradeSystem,

          onUpgrade: (
            carId
          ) => {

            if (
              this.garageManager
                .getSelectedCarId() !==
              carId
            ) {
              return;
            }

            this.openUpgrades();
          },

          onClose: () => {

            this.closeGarage();
          }
        }
      );

    this.garageUI.hide();

    // =======================================================
    // Upgrade UI
    // =======================================================

    this.upgradeScreen =
      new UpgradeScreen(
        this.garageManager,
        this.upgradeSystem,
        this.economyManager,
        {
          onChanged: () => {

            const selectedCar =
              this.garageManager
                .getSelectedCar();

            if (
              !selectedCar
            ) {
              return;
            }

            const stats =
              this.upgradeSystem.getStats(
                selectedCar.id
              );

            this.playerCar.applyCarStats(
              stats.maxSpeed,
              stats.acceleration,
              stats.handling
            );

            this.savePlayerData();

            this.raceHUD.update();
          },

          onClose: () => {

            this.upgradeScreen.hide();
          }
        }
      );

    this.upgradeScreen.hide();

    // =======================================================
    // Car Controller
    // =======================================================

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

        // =======================================================
    // Swipe Controller
    // =======================================================

    this.swipeController =
      new SwipeController(
        this.carController,
        {
          swipeThreshold: 50,

          target:
            this.renderer.domElement
        }
      );

    // =======================================================
    // Traffic Manager
    // =======================================================

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

    // =======================================================
    // Collision System
    // =======================================================

    this.trafficCollisionSystem =
      new TrafficCollisionSystem(
        this.playerCar,
        {
          collisionWidth: 1.8,

          collisionDepth: 3.4
        }
      );

    // =======================================================
    // M6.7 — Boss Manager
    // =======================================================

    this.bossManager =
      new BossManager({
        spawnLane: 1,

        spawnDistance: 80,

        ai: {

          laneCount: 3,

          laneWidth: 4,

          laneChangeSpeed: 8,

          laneChangeCooldown: 1.25,

          playerAwarenessDistance: 90,

          pursuitDistance: 45,

          maxSpeed: 120,

          acceleration: 35
        }
      });

    // =======================================================
    // M6.7 — Boss Race
    // =======================================================

    this.bossRace =
      new BossRace(
        this.bossManager,
        {
          bossSpawnDistance: 80,

          maxDuration: 0,

          requiredDistance: 0
        }
      );

    // =======================================================
// M6.7.4 — Boss 3D Mesh
// =======================================================

this.bossMesh =
  this.createBossMesh();

this.bossMesh.visible =
  false;

this.scene.add(
  this.bossMesh
);

// =======================================================
// Keyboard Nitro
// =======================================================

window.addEventListener(
  "keydown",
  this.handleNitroKeyDown
);

    // =======================================================
    // Resize
    // =======================================================

    window.addEventListener(
      "resize",
      this.handleResize
    );

    // =======================================================
    // Initial HUD
    // =======================================================

    this.raceHUD.update();
  }

  // =========================================================
  // M6.7.4 — Create Boss 3D Mesh
  // =========================================================

  private createBossMesh():
    THREE.Group {

    const boss =
      new THREE.Group();

    // =======================================================
    // Boss Body
    // =======================================================

    const bodyGeometry =
      new THREE.BoxGeometry(
        3.2,
        0.9,
        5.2
      );

    const bodyMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x7a0f16,

        metalness: 0.55,

        roughness: 0.3
      });

    const body =
      new THREE.Mesh(
        bodyGeometry,
        bodyMaterial
      );

    body.position.y =
      0.85;

    body.castShadow =
      true;

    body.receiveShadow =
      true;

    boss.add(
      body
    );

    // =======================================================
    // Boss Cabin
    // =======================================================

    const cabinGeometry =
      new THREE.BoxGeometry(
        2.35,
        0.75,
        2.4
      );

    const cabinMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x20252b,

        metalness: 0.35,

        roughness: 0.25
      });

    const cabin =
      new THREE.Mesh(
        cabinGeometry,
        cabinMaterial
      );

    cabin.position.y =
      1.55;

    cabin.position.z =
      -0.15;

    cabin.castShadow =
      true;

    cabin.receiveShadow =
      true;

    boss.add(
      cabin
    );

    // =======================================================
    // Boss Roof
    // =======================================================

    const roofGeometry =
      new THREE.BoxGeometry(
        2.15,
        0.18,
        1.9
      );

    const roofMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x111318,

        metalness: 0.5,

        roughness: 0.25
      });

    const roof =
      new THREE.Mesh(
        roofGeometry,
        roofMaterial
      );

    roof.position.y =
      1.98;

    roof.position.z =
      -0.15;

    roof.castShadow =
      true;

    boss.add(
      roof
    );

    // =======================================================
    // Wheels
    // =======================================================

    const wheelGeometry =
      new THREE.CylinderGeometry(
        0.48,
        0.48,
        0.38,
        16
      );

    const wheelMaterial =
      new THREE.MeshStandardMaterial({
        color: 0x111111,

        roughness: 0.75
      });

    const wheelPositions: Array<
      [number, number, number]
    > = [
      [-1.55, 0.48, -1.7],
      [1.55, 0.48, -1.7],
      [-1.55, 0.48, 1.7],
      [1.55, 0.48, 1.7]
    ];

    for (
      const position
      of wheelPositions
    ) {

      const wheel =
        new THREE.Mesh(
          wheelGeometry,
          wheelMaterial
        );

      wheel.rotation.z =
        Math.PI / 2;

      wheel.position.set(
        position[0],
        position[1],
        position[2]
      );

      wheel.castShadow =
        true;

      wheel.receiveShadow =
        true;

      boss.add(
        wheel
      );
    }

    // =======================================================
    // Boss Front Light
    // =======================================================

    const lightGeometry =
      new THREE.BoxGeometry(
        0.55,
        0.22,
        0.12
      );

    const lightMaterial =
      new THREE.MeshStandardMaterial({
        color: 0xffe6b0,

        emissive: 0xffaa33,

        emissiveIntensity: 1.5
      });

    const leftLight =
      new THREE.Mesh(
        lightGeometry,
        lightMaterial
      );

    leftLight.position.set(
      -0.9,
      1.0,
      -2.62
    );

    boss.add(
      leftLight
    );

    const rightLight =
      new THREE.Mesh(
        lightGeometry,
        lightMaterial
      );

    rightLight.position.set(
      0.9,
      1.0,
      -2.62
    );

    boss.add(
      rightLight
    );

    // =======================================================
    // Boss Scale
    // =======================================================

    boss.scale.set(
      1,
      1,
      1
    );

    boss.position.set(
      0,
      0,
      -80
    );

    return boss;
  }

  // =========================================================
  // M6.7.4 — Update Boss 3D
  // =========================================================

  private updateBoss3D():
    void {

    if (
      !this.bossManager.isActive()
    ) {

      this.bossMesh.visible =
        false;

      return;
    }

    const bossPosition =
      this.bossManager.getPosition();

    if (
      !bossPosition
    ) {

      this.bossMesh.visible =
        false;

      return;
    }

    const roadCenterX =
      this.world.getRoadCenterX(
        bossPosition.z
      );

    this.bossMesh.position.x =
      roadCenterX +
      bossPosition.x;

    this.bossMesh.position.y =
      0;

    this.bossMesh.position.z =
      bossPosition.z;

    this.bossMesh.visible =
      true;

    this.bossVerificationMarker.visible =
  true;

this.bossVerificationMarker.rotation.y +=
  0.04;

    // -------------------------------------------------------
    // Boss faces forward on the road.
    // RaceNova forward direction is -Z.
    // -------------------------------------------------------

    this.bossMesh.rotation.y =
      Math.PI;
  }

  // =========================================================
  // M6.7.4 — Start Boss Encounter
  // =========================================================

  private startBossEncounter(
    playerZ: number
  ): void {

    if (
      this.bossEncounterStarted
    ) {
      return;
    }

    if (
      !Number.isFinite(
        playerZ
      )
    ) {
      return;
    }

    const result =
      this.bossRace.start(
        "boss_race_01",
        playerZ
      );

    if (
      result.success
    ) {

      this.bossEncounterStarted =
        true;

      this.updateBoss3D();
    }
  }

  // =========================================================
  // Garage Button Handler
  // =========================================================

  private handleGarageButtonClick = (
    event: MouseEvent
  ): void => {

    event.preventDefault();

    event.stopPropagation();

    this.openGarage();
  };

  // =========================================================
  // Nitro Activation
  // =========================================================

  private activateNitro(): void {

    if (
      this.trafficCollisionSystem
        .hasCrashed()
    ) {
      return;
    }

    if (
      this.playerCar.isNitroActive()
    ) {
      return;
    }

    this.playerCar.activateNitro();

    this.raceHUD.update();
  };

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
      !Number.isFinite(
        deltaTime
      )
    ) {
      return;
    }

    // =======================================================
    // Player Movement
    // =======================================================

    if (
      !this.trafficCollisionSystem
        .hasCrashed()
    ) {

      this.playerCar.update(
        deltaTime
      );
    }

    // =======================================================
    // Player Steering
    // =======================================================

    this.carController.update(
      deltaTime
    );

    // =======================================================
    // Player Position
    // =======================================================

    const playerPosition =
      this.playerCar.getPosition();

    const playerZ =
      playerPosition.z;

    // =======================================================
    // World
    // =======================================================

    this.world.update(
      playerZ
    );

    // =======================================================
    // Traffic
    // =======================================================

    this.trafficManager.update(
      deltaTime,
      playerZ
    );

    // =======================================================
    // Collision
    // =======================================================

    this.trafficCollisionSystem.update(
      this.trafficManager
        .getTrafficCars()
    );

    // =======================================================
    // Coins
    // =======================================================

    if (
      !this.trafficCollisionSystem
        .hasCrashed()
    ) {

      this.coinSpawner.update(
        deltaTime,
        playerPosition
      );
    }

    // =======================================================
    // M6.7.4 — Start Boss
    // =======================================================

    if (
      !this.bossEncounterStarted
    ) {

      this.startBossEncounter(
        playerZ
      );
    }

    // =======================================================
    // M6.7.4 — Boss Race Update
    // =======================================================

    if (
      this.bossRace.isActive() &&
      !this.trafficCollisionSystem
        .hasCrashed()
    ) {

      this.bossRace.update(
        deltaTime,

        playerPosition.x,

        playerZ,

        this.playerCar.getSpeed()
      );
    }

    // =======================================================
    // M6.7.4 — Boss 3D Update
    // =======================================================

    this.updateBoss3D();

    // =======================================================
    // Player Progress
    // =======================================================

    const speed =
      this.playerCar.getSpeed();

    if (
      Number.isFinite(speed) &&
      speed > 0
    ) {

      this.playerProgress
        .totalDistance +=
        (speed / 3.6) *
        deltaTime;
    }

    // =======================================================
    // HUD
    // =======================================================

    this.raceHUD.update();

    // =======================================================
    // Camera
    // =======================================================

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
  // Economy Access
  // =========================================================

  public getEconomyManager():
    EconomyManager {

    return this.economyManager;
  }

  // =========================================================
  // Garage Access
  // =========================================================

  public getGarageManager():
    GarageManager {

    return this.garageManager;
  }

  // =========================================================
  // Garage UI Access
  // =========================================================

  public openGarage(): void {

    this.garageUI.open();
  }

  public closeGarage(): void {

    this.garageUI.hide();
  }

  public isGarageOpen(): boolean {

    return this.garageUI.isVisible();
  }

  // =========================================================
  // Upgrade UI Access
  // =========================================================

  public openUpgrades(): void {

    this.upgradeScreen.open();
  }

  public closeUpgrades(): void {

    this.upgradeScreen.hide();
  }

  public isUpgradeScreenOpen(): boolean {

    return this.upgradeScreen.isVisible();
  }

  // =========================================================
  // Selected Car
  // =========================================================

  public getSelectedCarId(): string {

    return this.garageManager
      .getSelectedCarId();
  }

  // =========================================================
  // Upgrade Access
  // =========================================================

  public getUpgradeSystem():
    UpgradeSystem {

    return this.upgradeSystem;
  }

  // =========================================================
  // Save System Access
  // =========================================================

  public getSaveSystem():
    SaveSystem {

    return this.saveSystem;
  }

  // =========================================================
  // Boss Manager Access
  // M6.7.4
  // =========================================================

  public getBossManager():
    BossManager {

    return this.bossManager;
  }

  // =========================================================
  // Boss Race Access
  // M6.7.4
  // =========================================================

  public getBossRace():
    BossRace {

    return this.bossRace;
  }

  // =========================================================
  // Boss State
  // M6.7.4
  // =========================================================

  public isBossActive(): boolean {

    return this.bossManager.isActive();
  }

  // =========================================================
  // Boss Position
  // M6.7.4
  // =========================================================

  public getBossPosition(): {
    x: number;
    z: number;
  } | null {

    return this.bossManager
      .getPosition();
  }

  // =========================================================
  // Player Progress
  // =========================================================

  public getPlayerProgress():
    PlayerProgress {

    return {

      ...this.playerProgress,

      raceProgression: {

        ...this.playerProgress
          .raceProgression,

        races:
          this.playerProgress
            .raceProgression.races.map(
              (race) => ({
                ...race
              })
            )
      }
    };
  }

  // =========================================================
  // Set Player Progress
  // M6.9
  // =========================================================

  public setPlayerProgress(
    progress: PlayerProgress
  ): void {

    if (
      !progress ||
      typeof progress !==
        "object"
    ) {
      return;
    }

    const normalized =
      normalizePlayerProgress(
        progress,
        RACE_DEFINITIONS
      );

    this.playerProgress = {

      ...normalized,

      raceProgression: {

        ...normalized.raceProgression,

        races:
          normalized.raceProgression.races.map(
            (race) => ({
              ...race
            })
          )
      }
    };
  }

  // =========================================================
  // Complete Save Snapshot
  // =========================================================

  public getPlayerSaveData():
    PlayerSaveData {

    const save =
      createDefaultPlayerSaveData(

        this.economyManager
          .getState(),

        this.garageManager
          .getState(),

        this.upgradeSystem
          .getState(),

        RACE_DEFINITIONS
      );

    return {

      ...save,

      version:
        PLAYER_SAVE_VERSION,

      progress: {

        ...this.playerProgress,

        raceProgression: {

          ...this.playerProgress
            .raceProgression,

          races:
            this.playerProgress
              .raceProgression.races.map(
                (race) => ({
                  ...race
                })
              )
        }
      },

      updatedAt:
        Date.now()
    };
  }

  // =========================================================
  // Save Player Data
  // =========================================================

  public savePlayerData():
    boolean {

    return this.saveSystem.save({
      ...this.playerProgress,

      raceProgression: {

        ...this.playerProgress
          .raceProgression,

        races:
          this.playerProgress
            .raceProgression.races.map(
              (race) => ({
                ...race
              })
            )
      }
    });
  }

  // =========================================================
  // Load Player Save Snapshot
  // =========================================================

  public loadPlayerSaveData(
    save: unknown
  ): boolean {

    if (
      !isValidPlayerSaveData(
        save
      )
    ) {
      return false;
    }

    // -------------------------------------------------------
    // Economy
    // -------------------------------------------------------

    const economyLoaded =
      this.economyManager.loadState(
        save.economy
      );

    if (
      !economyLoaded
    ) {
      return false;
    }

    // -------------------------------------------------------
    // Garage
    // -------------------------------------------------------

    const garageLoaded =
      this.garageManager.loadState(
        save.garage
      );

    if (
      !garageLoaded
    ) {
      return false;
    }

    // -------------------------------------------------------
    // Upgrades
    // -------------------------------------------------------

    const upgradesLoaded =
      this.upgradeSystem.loadState(
        save.upgrades
      );

    if (
      !upgradesLoaded
    ) {
      return false;
    }

    // -------------------------------------------------------
    // Progress
    // -------------------------------------------------------

    this.setPlayerProgress(
      save.progress
    );

    return true;
  }

      // =========================================================
  // Load Persistent Player Data
  // =========================================================

  public loadPlayerData():
    boolean {

    const loaded =
      this.saveSystem.load();

    if (
      !loaded
    ) {
      return false;
    }

    const savedData =
      this.saveSystem.readSave();

    if (
      !savedData
    ) {
      return false;
    }

    this.setPlayerProgress(
      savedData.progress
    );

    return true;
  }

  // =========================================================
  // Reset Player Data
  // =========================================================

  public resetPlayerData(): void {

    this.saveSystem.resetProgress();

    this.playerProgress =
      createDefaultPlayerProgress(
        RACE_DEFINITIONS
      );
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {

    // =======================================================
    // Event Listeners
    // =======================================================

    window.removeEventListener(
      "resize",
      this.handleResize
    );

    window.removeEventListener(
      "keydown",
      this.handleNitroKeyDown
    );

    // =======================================================
    // Boss System
    // =======================================================

    this.bossRace.reset();

    this.bossRace.dispose();

    this.bossManager.dispose();

    // =======================================================
    // Boss 3D Resources
    // =======================================================

    this.bossMesh.traverse(
      (
        object
      ) => {

        if (
          object instanceof
          THREE.Mesh
        ) {

          object.geometry.dispose();

          if (
            Array.isArray(
              object.material
            )
          ) {

            for (
              const material
              of object.material
            ) {

              material.dispose();
            }

          } else {

            object.material.dispose();
          }
        }
      }
    );

    this.scene.remove(
      this.bossMesh
    );

    // =======================================================
    // Controllers
    // =======================================================

    this.swipeController.dispose();

    this.carController.dispose();

    // =======================================================
    // Gameplay Systems
    // =======================================================

    this.trafficManager.dispose();

    this.trafficCollisionSystem.dispose();

    // =======================================================
    // Coin / Economy
    // =======================================================

    this.coinSpawner.dispose();

    this.economyManager.dispose();

    // =======================================================
    // Garage / Upgrade
    // =======================================================

    this.garageManager.reset();

    this.upgradeSystem.reset();

    // =======================================================
    // Save System
    // =======================================================

    this.saveSystem.dispose();

    // =======================================================
    // Player / World
    // =======================================================

    this.playerCar.dispose();

    this.world.dispose();

    // =======================================================
    // HUD
    // =======================================================

    this.raceHUD.dispose();

    // =======================================================
    // Garage UI
    // =======================================================

    this.garageUI.dispose();

    // =======================================================
    // Upgrade UI
    // =======================================================

    this.upgradeScreen.dispose();

    // =======================================================
    // Renderer
    // =======================================================

    this.renderer.dispose();

    if (
      this.renderer.domElement
        .parentElement
    ) {

      this.renderer.domElement
        .parentElement
        .removeChild(
          this.renderer.domElement
        );
    }
  }
}
      
