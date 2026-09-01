// RaceNovaEngine.ts — Part 1/7
// Paste this part after the previous part. Do not add/remove extra braces.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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

import { AudioManager } from "../audio/AudioManager";


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

import {
  BossUnlockRules,
  type BossUnlockProgress,
  type BossUnlockConfig
} from "../bosses/BossUnlockRules";

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
// M7.1 — Audio
// =========================================================

private readonly audioManager:
  AudioManager;

  private crashSoundPlayed =
  false;

  

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
  // M6.8.3 — Boss Unlock Rules
  // =========================================================

  private readonly bossUnlockConfig:
    BossUnlockConfig = {

      bossId:
        "boss_race_01",

      requiredLevel:
        2,

      requiredRacesCompleted:
        3,

      requiredRacesWon:
        2
    };

  // =========================================================
  // M6.7.4 — Boss 3D
  // =========================================================

  private readonly bossMesh:
    THREE.Group;

  /**
   * M6.7.4 verification flag.
   *
   * Boss encounter starts only when the
   * proper unlock requirements are satisfied.
   */
  private bossEncounterStarted:
    boolean = false;

  // =========================================================
  // M6.8.8 — Normal Race Runtime
  // =========================================================

  private normalRaceStarted:
    boolean = false;

  private normalRaceCompleted:
    boolean = false;

  private normalRaceId:
    string = "";

  private normalRaceDistance:
    number = 0;

  private normalRaceTime:
    number = 0;

  // Endless road remains endless.
  // Race itself has a virtual finish distance.
  private readonly normalRaceFinishDistance:
    number = 1500;

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
// M7.1 — Audio
// =======================================================

this.audioManager =
  new AudioManager();

this.audioManager.initialize();

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

              this.audioManager.playSFX(
                "coin"
              );

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
        },

        () => {

          return {
            level:
              this.playerProgress
                .unlockedLevel,

            racesCompleted:
              this.playerProgress
                .racesCompleted,

            racesRequired:
              3,

            racesWon:
              this.playerProgress
                .racesWon,

            winsRequired:
              2,

            bossUnlocked:
              this.isBossUnlocked()
          };
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
    // M6.8.6 — Boss Race Finish Distance
    // =======================================================

    this.bossRace =
      new BossRace(
        this.bossManager,

        {
          bossSpawnDistance: 80,

          maxDuration: 0,

          // Boss race virtual finish distance.
          // Endless road continues; only the
          // Boss encounter has a 1500m finish.

          requiredDistance: 1500
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

    // Load the real Boss GLB asynchronously.
    // Gameplay/BossAI remains independent of the visual asset.
    void this.loadBossModel();

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
  // M6.7.4 — Boss GLB Visual
  // =========================================================

  private createBossMesh(): THREE.Group {

    return new THREE.Group();
  }

  // =========================================================
  // M6.10 — Load Boss GLB
  // =========================================================

  private async loadBossModel(): Promise<void> {

    const loader =
      new GLTFLoader();

    // Static URL so Vite bundles the model correctly for
    // development, GitHub Pages, and production builds.
    const modelUrl =
  "/RaceNova-V2/assets/cars/bosscar.glb";
    try {

      const gltf =
        await loader.loadAsync(
          modelUrl
        );

      const model =
        gltf.scene;

      if (!model) {
        console.error(
          "[RaceNova] Boss GLB loaded without a scene."
        );
        return;
      }

      // Prepare the imported model for the existing Boss
      // transform/update pipeline.
      model.traverse(
        (object) => {

          if (
            object instanceof THREE.Mesh
          ) {

            object.castShadow = true;
            object.receiveShadow = true;

            if (Array.isArray(object.material)) {
              for (const material of object.material) {
                material.needsUpdate = true;
              }
            } else {
              object.material.needsUpdate = true;
            }
          }
        }
      );

      // Normalize the imported model so differently authored
      // GLB dimensions do not make the Boss enormous/tiny.
      const box =
        new THREE.Box3().setFromObject(
          model
        );

      const size =
        box.getSize(
          new THREE.Vector3()
        );

      const center =
        box.getCenter(
          new THREE.Vector3()
        );

      const targetLength = 5.2;
      const sourceLength =
        Math.max(
          size.x,
          size.z,
          0.001
        );

      const uniformScale =
        targetLength /
        sourceLength;

      model.scale.setScalar(
        uniformScale
      );

      // Recalculate after scaling and place the model on the
      // same ground plane used by the existing Boss system.
      const scaledBox =
        new THREE.Box3().setFromObject(
          model
        );

      const scaledCenter =
        scaledBox.getCenter(
          new THREE.Vector3()
        );

      model.position.x -=
        scaledCenter.x;

      model.position.z -=
        scaledCenter.z;

      model.position.y -=
        scaledBox.min.y;

      // Avoid an unused-center lint/type warning while keeping
      // the original bounds calculation explicit for debugging.
      void center;

      this.bossMesh.add(
        model
      );

      // updateBoss3D() controls visibility and world position.
      // Do not expose the model until it has finished loading.
      this.bossMesh.visible =
        this.bossManager.isActive();

    } catch (error) {

      console.error(
        "[RaceNova] Failed to load Boss GLB:",
        error
      );
    }
  }

     // =========================================================
  // M6.7.4 — Update Boss 3D
  // =========================================================

  private updateBoss3D(): void {

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

    // -------------------------------------------------------
    // Boss faces forward on the road.
    // RaceNova forward direction is -Z.
    // -------------------------------------------------------

    this.bossMesh.rotation.y =
      Math.PI;
  }

  // =========================================================
  // M6.8.3 — Check Boss Unlock
  // =========================================================

  private isBossUnlocked(): boolean {

    const progression =
      this.playerProgress
        .raceProgression;

    const unlockProgress:
      BossUnlockProgress = {

      unlockedLevel:
        this.playerProgress
          .unlockedLevel,

      racesCompleted:
        this.playerProgress
          .racesCompleted,

      racesWon:
        this.playerProgress
          .racesWon,

      bossesDefeated:
        this.playerProgress
          .bossesDefeated,

      races:
        progression.races
    };

    return BossUnlockRules.isUnlocked(
      unlockProgress,
      this.bossUnlockConfig
    );
  }

  // =========================================================
  // M6.8.3 — Start Boss Encounter
  // =========================================================

  private startBossEncounter(
    playerZ: number
    ): void {

    // -------------------------------------------------------
    // Already started
    // -------------------------------------------------------

    if (
      this.bossEncounterStarted
    ) {
      return;
    }

    // -------------------------------------------------------
    // Invalid player position
    // -------------------------------------------------------

    if (
      !Number.isFinite(
        playerZ
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // Boss Unlock Check
    // -------------------------------------------------------

    if (
      !this.isBossUnlocked()
    ) {

      /*
       * Boss is still locked.
       *
       * Do not start BossRace.
       * Do not activate BossManager.
       */

      return;
    }

    // -------------------------------------------------------
    // Start Boss Race
    // -------------------------------------------------------

    const result =
      this.bossRace.start(
        this.bossUnlockConfig.bossId,
        playerZ
      );

    // -------------------------------------------------------
    // Confirm Start
    // -------------------------------------------------------

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

this.audioManager.playSFX(
  "nitro"
);

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

    if (
  this.trafficCollisionSystem
    .hasCrashed()
) {

  this.audioManager.playSFX(
    "crash"
  );
    }

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
    // Boss Start Check
    // =======================================================

    if (
      !this.bossEncounterStarted
    ) {

      this.startBossEncounter(
        playerZ
      );
    }

    // =======================================================
    // Boss Race Update
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
    // Boss Defeat Persistence
    // =======================================================

    if (
      this.bossRace.isBossDefeated()
    ) {

      this.recordBossDefeat();
    }

    // =======================================================
    // Boss 3D Update
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
    // M6.8.8 — Normal Race Runtime
    // =======================================================

    if (
      !this.bossRace.isActive() &&
      !this.normalRaceStarted &&
      !this.normalRaceCompleted
    ) {

      this.startNormalRace();
    }

    // =======================================================
    // Normal Race Update
    // =======================================================

    if (
      this.normalRaceStarted &&
      !this.normalRaceCompleted &&
      !this.trafficCollisionSystem
        .hasCrashed()
    ) {

      this.updateNormalRace(
        deltaTime
      );
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
  // M6.8.8 — Start Normal Race
  // =========================================================

  private startNormalRace(): void {

    const progression =
      this.playerProgress
        .raceProgression;

    const selectedRace =
      progression.races.find(
        (race) =>
          race.raceId ===
          progression.selectedRaceId
      );

    if (
      !selectedRace
    ) {
      return;
    }

    if (
      selectedRace.status ===
      "locked"
    ) {
      return;
    }

    this.normalRaceId =
      selectedRace.raceId;

    this.normalRaceStarted =
      true;

    this.normalRaceCompleted =
      false;

    this.normalRaceDistance =
      0;

    this.normalRaceTime =
      0;
  }

  // =========================================================
  // M6.8.8 — Update Normal Race
  // =========================================================

  private updateNormalRace(
    deltaTime: number
  ): void {

    if (
      !this.normalRaceStarted ||
      this.normalRaceCompleted
    ) {
      return;
    }

    if (
      !Number.isFinite(
        deltaTime
      ) ||
      deltaTime <= 0
    ) {
      return;
    }

    const speed =
      this.playerCar.getSpeed();

    if (
      Number.isFinite(speed) &&
      speed > 0
    ) {

      this.normalRaceDistance +=
        (speed / 3.6) *
        deltaTime;
    }

    this.normalRaceTime +=
      deltaTime;

    // =======================================================
    // Virtual Race Finish
    // =======================================================
    //
    // The world/road remains endless.
    // Only the current race has a
    // virtual 1500m finish line.
    // =======================================================

    if (
      this.normalRaceDistance >=
      this.normalRaceFinishDistance
    ) {

      this.finishNormalRace();

      return;
    }
  }

  // =========================================================
  // M6.8.8 — Finish Normal Race
  // =========================================================

  private finishNormalRace(): void {

    if (
      !this.normalRaceStarted ||
      this.normalRaceCompleted
    ) {
      return;
    }

    const completedRaceId =
      this.normalRaceId;

    const completedRaceTime =
      this.normalRaceTime;

    this.normalRaceCompleted =
      true;

    this.completeRace(
      completedRaceId,
      true,
      1,
      completedRaceTime
    );

    this.advanceToNextRace();

    this.normalRaceStarted =
      false;
  }

  // =========================================================
  // M6.8.8 — Advance Campaign Race
  // =========================================================

  private advanceToNextRace(): void {

    const progression =
      this.playerProgress
        .raceProgression;

    const currentIndex =
      progression.races.findIndex(
        (race) =>
          race.raceId ===
          this.normalRaceId
      );

    if (
      currentIndex < 0
    ) {
      return;
    }

    const nextRace =
      progression.races[
        currentIndex + 1
      ];

    if (
      !nextRace
    ) {
      return;
    }

    if (
      nextRace.status ===
      "locked"
    ) {

      nextRace.status =
        "available";
    }

    progression.selectedRaceId =
      nextRace.raceId;

    this.playerProgress.selectedRaceId =
      nextRace.raceId;

    this.savePlayerData();
  }

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
  // =========================================================

  public getBossManager():
    BossManager {

    return this.bossManager;
  }

  // =========================================================
  // Boss Race Access
  // =========================================================

  public getBossRace():
    BossRace {

    return this.bossRace;
  }

  // =========================================================
  // Boss State
  // =========================================================

  public isBossActive(): boolean {

    return this.bossManager.isActive();
  }

  // =========================================================
  // Boss Position
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
  // Race Completion
  // M6.8.7 — Race Completion → Progression
  // =========================================================

  private completeRace(
    raceId: string,
    won: boolean,
    position: number = 1,
    time: number = 0
  ): void {

    const progression =
      this.playerProgress
        .raceProgression;

    const race =
      progression.races.find(
        (entry) =>
          entry.raceId === raceId
      );

    if (
      !race
    ) {
      return;
    }

    // -------------------------------------------------------
    // Race completion
    // -------------------------------------------------------

    race.completionCount += 1;

    progression.racesCompleted += 1;

    // -------------------------------------------------------
    // Race win
    // -------------------------------------------------------

    if (
      won
    ) {

      race.winCount += 1;

      progression.racesWon += 1;
    }

    // -------------------------------------------------------
    // Best position
    // -------------------------------------------------------

    if (
      Number.isFinite(position) &&
      position > 0 &&
      (
        race.bestPosition === 0 ||
        position < race.bestPosition
      )
    ) {

      race.bestPosition =
        Math.floor(position);
    }

    // -------------------------------------------------------
    // Best time
    // -------------------------------------------------------

    if (
      Number.isFinite(time) &&
      time > 0 &&
      (
        race.bestTime === 0 ||
        time < race.bestTime
      )
    ) {

      race.bestTime =
        time;
    }

    // -------------------------------------------------------
    // Mark completed
    // -------------------------------------------------------

    if (
      won
    ) {

      race.status =
        "completed";
    }

    // -------------------------------------------------------
    // Campaign progression
    // -------------------------------------------------------

    const nextRace =
      progression.races.find(
        (entry) =>
          entry.status === "locked"
      );

    if (
      nextRace
    ) {

      nextRace.status =
        "available";
    }

    // -------------------------------------------------------
    // M6.8.7 — Level 2 Progression
    // -------------------------------------------------------

    const levelTwoUnlocked =
      progression.racesCompleted >= 3 &&
      progression.racesWon >= 2;

    if (
      levelTwoUnlocked
    ) {

      progression.unlockedLevel =
        Math.max(
          progression.unlockedLevel,
          2
        );

    } else {

      progression.unlockedLevel =
        Math.max(
          progression.unlockedLevel,
          1
        );
    }

    // -------------------------------------------------------
    // Legacy progress synchronization
    // -------------------------------------------------------

    this.playerProgress.unlockedLevel =
      progression.unlockedLevel;

    this.playerProgress.racesCompleted =
      progression.racesCompleted;

    this.playerProgress.racesWon =
      progression.racesWon;

    this.playerProgress.selectedRaceId =
      progression.selectedRaceId;

    this.playerProgress.bossesDefeated =
      progression.bossesDefeated;

    // -------------------------------------------------------
    // Persist progression
    // -------------------------------------------------------

    this.savePlayerData();

    // -------------------------------------------------------
    // Refresh HUD
    // -------------------------------------------------------

    this.raceHUD.update();
  }

  // =========================================================
  // M6.8.5 — Record Boss Defeat
  // =========================================================

  private recordBossDefeat(): void {

    const raceId =
    this.bossRace.getRaceId();

    if (
      !raceId
    ) {
      return;
    }

    const progression =
      this.playerProgress
        .raceProgression;

    const race =
      progression.races.find(
        (entry) =>
          entry.raceId === raceId
      );

    if (
      !race ||
      race.bossDefeated
    ) {
      return;
    }

    const updatedRaces =
      progression.races.map(
        (entry) =>
          entry.raceId === raceId
            ? {
                ...entry,
                bossDefeated: true
              }
            : {
                ...entry
              }
      );

    this.playerProgress = {

      ...this.playerProgress,

      bossesDefeated:
        this.playerProgress
          .bossesDefeated + 1,

      raceProgression: {

        ...progression,

        bossesDefeated:
          progression
            .bossesDefeated + 1,

        races:
          updatedRaces
      }
    };

    this.savePlayerData();
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

      
