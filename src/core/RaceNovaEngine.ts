// ============================================================
// RaceNova V2 — RaceNovaEngine.ts
// M8.3.2 — ZIP-BASED COMPLETE REPLACEMENT
// ============================================================
// Source: RaceNova-V2-main (2).zip
// Single coherent file — do NOT mix with old Engine parts.
// ============================================================

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { World } from "../world/World";
import { EnvironmentManager } from "../world/EnvironmentManager";
import { ObstacleManager } from "../obstacles/ObstacleManager";

import { PlayerCar } from "../player/PlayerCar";
import { CarController } from "../player/CarController";
import { SwipeController } from "../player/SwipeController";

import { TrafficManager } from "../traffic/TrafficManager";
import { TrafficCollisionSystem } from "../collision/TrafficCollisionSystem";
import { ObstacleCollisionSystem } from "../collision/ObstacleCollisionSystem";

import { RaceHUD } from "../ui/RaceHUD";
import { RaceResultUI } from "../ui/RaceResult";
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
import {
  RaceResult
} from "../race/RaceResult";

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

  private bossDefeatSoundPlayed =
    false;

  private bossCompleteSoundPlayed =
    false;

  private bossFailSoundPlayed =
    false;

  private normalRaceCompleteSoundPlayed =
    false;

  private handleAudioUnlock = (): void => {

    void this.audioManager
      .unlock()
      .then(() => {
        this.audioManager.startMusic();
      })
      .catch(() => {
        // Audio unlock may be blocked by browser policy.
      });
  };
  
  // =========================================================
  // World
  // =========================================================

  private readonly world:
    World;

  // =========================================================
  // M7 — Roadside Environment
  // =========================================================

  private readonly environmentManager:
    EnvironmentManager;

  // =========================================================
  // M7.9 — Road Obstacles
  // =========================================================

  private readonly obstacleManager:
    ObstacleManager;

  private readonly obstacleCollisionSystem:
    ObstacleCollisionSystem;

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
  // M8.3 — Race Result System
  // =========================================================

  private readonly raceResult:
    RaceResult;

  private readonly raceResultUI:
    RaceResultUI;

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

  private normalRaceStartZ:
    number = 0;

  private normalRaceLastZ:
    number = 0;

  private normalRaceTime:
    number = 0;

  // Endless road remains endless.
  // Race itself has a virtual finish distance.
  private readonly normalRaceFinishDistance:
    number = 1500;

  // =========================================================
  // M7.9.10 — Engine Runtime State
  // =========================================================

  private running:
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
    // M7 — Roadside Environment
    // =======================================================

    this.environmentManager =
      new EnvironmentManager(
        this.scene,
        (worldZ: number) =>
          this.world.getRoadCenterX(
            worldZ
          ),
        {
          roadWidth:
            this.world.getRoadWidth(),

          sideOffset: 2,

          propCount: 32,

          spacing: 18,

          visibleAhead: 260,

          visibleBehind: 100
        }
      );

    void this.environmentManager.load();

    // =======================================================
    // M7.9 — Road Obstacles
    // =======================================================

    this.obstacleManager =
      new ObstacleManager(
        this.scene,
        (worldZ: number) =>
          this.world.getRoadCenterX(
            worldZ
          ),
        {
          roadWidth:
            this.world.getRoadWidth(),

          laneWidth: 4,

          laneCount: 3,

          obstacleCount: 9,

          spawnDistance: 180,

          recycleDistance: 70,

          playerCollisionWidth: 1.45,

          playerCollisionDepth: 2.4
        }
      );

    this.obstacleManager.initialize();

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
    // M7.9.3 — Proper Obstacle Collision System
    // =======================================================

    this.obstacleCollisionSystem =
      new ObstacleCollisionSystem(
        this.playerCar,
        this.obstacleManager,
        {
          impactStunDuration: 0.75
        }
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
    // M8.3 — Race Result System
    // =======================================================

    this.raceResult =
      new RaceResult();

    this.raceResultUI =
      new RaceResultUI(
        document.body,
        {
          onNextRace: () => {

            this.start();
          },

          onMainMenu: () => {

            window.dispatchEvent(
              new CustomEvent(
                "racenova:race-result-menu"
              )
            );
          }
        }
      );

    this.raceResultUI.hide();

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
    // M7.1 — Mobile Audio Unlock
    // =======================================================

    window.addEventListener(
      "pointerdown",
      this.handleAudioUnlock,
      {
        once: true
      }
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

            if (
              Array.isArray(
                object.material
              )
            ) {

              for (
                const material of
                object.material
              ) {

                material.needsUpdate =
                  true;
              }

            } else {

              object.material.needsUpdate =
                true;
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

      const targetLength =
        5.2;

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
    // M8.1 — Only Boss Campaign Race can start Boss
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // Check authoritative race definition
    // -------------------------------------------------------

    const selectedRaceDefinition =
      RACE_DEFINITIONS.find(
        (race) =>
          race.id ===
          selectedRace.raceId
      );

    if (
      !selectedRaceDefinition
    ) {

      return;
    }

    if (
      !selectedRaceDefinition.isBoss
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
  // M7.9.13 — Fresh Race Start
  // =========================================================

  public start(): void {

    // -------------------------------------------------------
    // Prevent duplicate animation loops
    // -------------------------------------------------------

    if (
      this.running
    ) {

      return;
    }

    // -------------------------------------------------------
    // IMPORTANT:
    // Every START RACE gets a completely fresh
    // runtime state.
    //
    // Player progress / coins / garage / upgrades
    // are NOT deleted by resetRaceState().
    // -------------------------------------------------------

    this.resetRaceState();

    // -------------------------------------------------------
    // M8.3.2 — Start fresh normal race immediately.
    // -------------------------------------------------------

    this.startNormalRace();

    this.running =
      true;

    this.clock.start();

    this.animate();
  }

  // =========================================================
  // Animation
  // =========================================================

  private animate = (): void => {

    if (
      !this.running
    ) {

      return;
    }

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
        .hasCrashed() &&
      !this.obstacleCollisionSystem
        .isFrozen()
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

    this.environmentManager.update(
      playerZ
    );

    this.obstacleManager.update(
      playerZ
    );

    // =======================================================
    // M7.9.4 — Obstacle Collision Response
    // =======================================================

    this.obstacleCollisionSystem.update(
      deltaTime
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
        .hasCrashed() &&
      !this.crashSoundPlayed
    ) {

      this.crashSoundPlayed =
        true;

      // -----------------------------------------------------
      // Existing crash SFX
      // -----------------------------------------------------

      this.audioManager.playSFX(
        "crash"
      );

      // -----------------------------------------------------
      // Stop engine loop.
      //
      // IMPORTANT:
      // Obstacle collision system is NOT modified.
      // -----------------------------------------------------

      this.running =
        false;

      this.clock.stop();

      // -----------------------------------------------------
      // Notify application UI.
      // main.ts will return the player
      // to Main Menu.
      // -----------------------------------------------------

      window.dispatchEvent(
        new CustomEvent(
          "racenova:traffic-crash"
        )
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
    // M7.1 — Boss Race Audio
    // =======================================================

    if (
      this.bossRace.isBossDefeated() &&
      !this.bossDefeatSoundPlayed
    ) {

      this.bossDefeatSoundPlayed =
        true;

      this.audioManager.playSFX(
        "bossDefeat"
      );
    }

    if (
      this.bossRace.isCompleted() &&
      !this.bossCompleteSoundPlayed
    ) {

      this.bossCompleteSoundPlayed =
        true;

      this.audioManager.playSFX(
        "raceComplete"
      );
    }

    if (
      this.bossRace.isFailed() &&
      !this.bossFailSoundPlayed
    ) {

      this.bossFailSoundPlayed =
        true;

      this.audioManager.playSFX(
        "raceFailed"
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

    this.raceHUD.setRaceDistance(
      this.normalRaceDistance,
      this.normalRaceFinishDistance,
      this.normalRaceStarted &&
        !this.normalRaceCompleted
    );

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
  // M8.3.2 — Start Normal Race
  // =========================================================

  private startNormalRace(): void {

    const progression =
      this.playerProgress
        .raceProgression;

    let selectedRace =
      progression.races.find(
        (race) =>
          race.raceId ===
          progression.selectedRaceId
      );

    let selectedRaceDefinition =
      selectedRace
        ? RACE_DEFINITIONS.find(
            (definition) =>
              definition.id ===
              selectedRace!.raceId
          )
        : undefined;

    // -------------------------------------------------------
    // M8.1 — Boss races are not normal races.
    // -------------------------------------------------------

    if (
      !selectedRace ||
      !selectedRaceDefinition ||
      selectedRaceDefinition.isBoss ||
      selectedRace.status === "locked"
    ) {

      const fallback =
        progression.races.find(
          (race) => {

            if (
              race.status !== "available" &&
              race.status !== "completed"
            ) {
              return false;
            }

            const definition =
              RACE_DEFINITIONS.find(
                (item) =>
                  item.id === race.raceId
              );

            return Boolean(
              definition &&
              !definition.isBoss
            );
          }
        );

      if (!fallback) {
        return;
      }

      selectedRace =
        fallback;

      selectedRaceDefinition =
        RACE_DEFINITIONS.find(
          (definition) =>
            definition.id ===
            fallback!.raceId
        );

      progression.selectedRaceId =
        fallback.raceId;

      this.playerProgress.selectedRaceId =
        fallback.raceId;
    }

    if (
      !selectedRace ||
      !selectedRaceDefinition ||
      selectedRaceDefinition.isBoss ||
      selectedRace.status === "locked"
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

    this.raceHUD.setRaceDistance(
      0,
      this.normalRaceFinishDistance,
      true
    );
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
      !Number.isFinite(deltaTime) ||
      deltaTime <= 0
    ) {
      return;
    }

    // -------------------------------------------------------
    // M8.3.2 — Authoritative PlayerCar speed.
    // km/h -> metres/second = km/h / 3.6
    // -------------------------------------------------------

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

    this.normalRaceDistance =
      Math.min(
        Math.max(
          0,
          this.normalRaceDistance
        ),
        this.normalRaceFinishDistance
      );

    if (
      this.normalRaceDistance >=
      this.normalRaceFinishDistance
    ) {

      this.normalRaceDistance =
        this.normalRaceFinishDistance;

      this.finishNormalRace();
    }
  }

  // =========================================================
  // M8.3 — Finish Normal Race
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

    // -------------------------------------------------------
    // Mark race completed
    // -------------------------------------------------------

    this.normalRaceCompleted =
      true;

    // -------------------------------------------------------
    // Existing race complete SFX
    // -------------------------------------------------------

    if (
      !this.normalRaceCompleteSoundPlayed
    ) {

      this.normalRaceCompleteSoundPlayed =
        true;

      this.audioManager.playSFX(
        "raceComplete"
      );
    }

    // -------------------------------------------------------
    // Existing progression/save logic
    // -------------------------------------------------------

    this.completeRace(
      completedRaceId,
      true,
      1,
      completedRaceTime
    );

    // -------------------------------------------------------
    // Unlock/select next campaign race
    // -------------------------------------------------------

    this.advanceToNextRace();

    // -------------------------------------------------------
    // Race runtime finished
    // -------------------------------------------------------

    this.normalRaceStarted =
      false;

    // -------------------------------------------------------
    // Build M8.3 result
    //
    // Reward calculation is intentionally NOT added here.
    // M8.4 will own reward calculation.
    // -------------------------------------------------------

    this.raceResult.set({

      raceId:
        completedRaceId,

      result:
        "WIN",

      position:
        1,

      time:
        completedRaceTime,

      distance:
        this.normalRaceDistance,

      reward:
        0,

      isBossRace:
        false,

      bossDefeated:
        false,

      nextRaceId:
        this.getNextRaceId(
          completedRaceId
        ),

      timestamp:
        Date.now()
    });

    // -------------------------------------------------------
    // Stop gameplay loop while Result UI is open.
    // -------------------------------------------------------

    this.running =
      false;

    this.clock.stop();

    // -------------------------------------------------------
    // Show Result Screen
    // -------------------------------------------------------

    this.raceResultUI.show(
      this.raceResult.get()
    );
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
  // M8.3 — Get Next Race ID
  // =========================================================

  private getNextRaceId(
    currentRaceId: string
  ): string | null {

    const progression =
      this.playerProgress
        .raceProgression;

    const currentIndex =
      progression.races.findIndex(
        (race) =>
          race.raceId ===
          currentRaceId
      );

    if (
      currentIndex < 0
    ) {
      return null;
    }

    const nextRace =
      progression.races[
        currentIndex + 1
      ];

    if (
      !nextRace
    ) {
      return null;
    }

    if (
      nextRace.status ===
      "locked"
    ) {
      return null;
    }

    return nextRace.raceId;
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
  // Player Progress Access
  // =========================================================

  public getPlayerProgress():
    PlayerProgress {

    return this.playerProgress;
  }

  public setPlayerProgress(
    progress: PlayerProgress
  ): void {

    this.playerProgress =
      normalizePlayerProgress(
        progress,
        RACE_DEFINITIONS
      );

    this.playerProgress.selectedRaceId =
      this.playerProgress
        .raceProgression
        .selectedRaceId;
  }

  // =========================================================
  // Boss Defeat Persistence
  // =========================================================

  private recordBossDefeat(): void {

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

    const definition =
      RACE_DEFINITIONS.find(
        (race) =>
          race.id ===
          selectedRace.raceId
      );

    if (
      !definition ||
      !definition.isBoss
    ) {
      return;
    }

    if (
      selectedRace.bossDefeated
    ) {
      return;
    }

    selectedRace.bossDefeated =
      true;

    this.playerProgress
      .bossesDefeated += 1;

    this.savePlayerData();
  }

  // =========================================================
  // Complete Race
  // =========================================================

  private completeRace(
    raceId: string,
    won: boolean,
    position: number,
    time: number
  ): void {

    const progression =
      this.playerProgress
        .raceProgression;

    const race =
      progression.races.find(
        (item) =>
          item.raceId ===
          raceId
      );

    if (
      !race
    ) {
      return;
    }

    // =======================================================
    // Completion
    // =======================================================

    race.completionCount +=
      1;

    if (
      race.completionCount > 0
    ) {

      race.status =
        "completed";
    }

    // =======================================================
    // Win
    // =======================================================

    if (
      won
    ) {

      race.winCount +=
        1;

      this.playerProgress
        .racesWon +=
        1;

      if (
        race.bestPosition <= 0 ||
        position <
          race.bestPosition
      ) {

        race.bestPosition =
          position;
      }

      if (
        time > 0 &&
        (
          race.bestTime <= 0 ||
          time <
            race.bestTime
        )
      ) {

        race.bestTime =
          time;
      }

    }

    // =======================================================
    // Global Progress
    // =======================================================

    this.playerProgress
      .racesCompleted +=
      1;

    // =======================================================
    // Unlock Progress
    // =======================================================

    const completedCount =
      progression.races.filter(
        (item) =>
          item.status ===
          "completed"
      ).length;

    const wonCount =
      progression.races.reduce(
        (
          total,
          item
        ) =>
          total +
          item.winCount,
        0
      );

    // =======================================================
    // Level 2 Unlock
    // =======================================================

    if (
      completedCount >= 3 &&
      wonCount >= 2
    ) {

      this.playerProgress
        .unlockedLevel =
        Math.max(
          this.playerProgress
            .unlockedLevel,
          2
        );
    }

    // =======================================================
    // Unlock First Locked Race
    // =======================================================

    const nextLockedRace =
  progression.races.find(
    (item) => {

      if (
        item.status !==
        "locked"
      ) {
        return false;
      }

      const definition =
        RACE_DEFINITIONS.find(
          (race) =>
            race.id ===
            item.raceId
        );

      return Boolean(
        definition &&
        definition.level <=
          this.playerProgress
            .unlockedLevel
      );
    }
  );

    if (
      nextLockedRace
    ) {

      nextLockedRace.status =
        "available";
    }

    // =======================================================
    // Keep Legacy Fields In Sync
    // =======================================================

    this.playerProgress
      .raceProgression
      .selectedRaceId =
        this.playerProgress
          .selectedRaceId;

    // =======================================================
    // Save
    // =======================================================

    this.savePlayerData();
  }

  // =========================================================
  // Save Player Data
  // =========================================================

  private savePlayerData(): void {

    try {

      const data:
        PlayerSaveData = {

        version:
          PLAYER_SAVE_VERSION,

        progress:
          this.playerProgress,

        economy:
          this.economyManager
            .getSaveData(),

        garage:
          this.garageManager
            .getSaveData(),

        upgrades:
          this.upgradeSystem
            .getSaveData(),

        timestamp:
          Date.now()
      };

      if (
        !isValidPlayerSaveData(
          data
        )
      ) {

        console.error(
          "[RaceNova] Invalid save data."
        );

        return;
      }

      this.saveSystem.save(
        data
      );

    } catch (
      error
    ) {

      console.error(
        "[RaceNova] Save failed:",
        error
      );
    }
  }

  // =========================================================
  // Reset Race State
  // =========================================================

  public resetRaceState(): void {

    // =======================================================
    // Runtime Flags
    // =======================================================

    this.running =
      false;

    this.normalRaceStarted =
      false;

    this.normalRaceCompleted =
      false;

    this.normalRaceId =
      "";

    this.normalRaceDistance =
      0;

    this.normalRaceTime =
      0;

    this.normalRaceCompleteSoundPlayed =
      false;

    this.crashSoundPlayed =
      false;

    this.bossDefeatSoundPlayed =
      false;

    this.bossCompleteSoundPlayed =
      false;

    this.bossFailSoundPlayed =
      false;

    // =======================================================
    // Player
    // =======================================================

    this.playerCar.stop();

    this.playerCar.setSpeed(
      0
    );

    this.playerCar.setX(
      0
    );

    this.playerCar.setZ(
      0
    );

    // =======================================================
    // Traffic
    // =======================================================

    this.trafficManager.clear();

    this.trafficCollisionSystem.reset();

    // =======================================================
    // Obstacles
    // =======================================================

    this.obstacleManager.clear();

    this.obstacleCollisionSystem.reset();

    // =======================================================
    // Coins
    // =======================================================

    this.coinSpawner.clear();

    // =======================================================
    // Boss
    // =======================================================

    this.bossRace.reset();

    this.bossEncounterStarted =
      false;

    this.bossMesh.visible =
      false;

    this.bossMesh.position.set(
      0,
      0,
      -80
    );

    this.bossMesh.rotation.y =
      Math.PI;

    // =======================================================
    // Environment
    // =======================================================

    this.environmentManager.reset(
      0
    );

    // =======================================================
    // Camera
    // =======================================================

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
    // Race Result
    // =======================================================

    this.raceResult.reset();

    this.raceResultUI.hide();

    // =======================================================
    // HUD
    // =======================================================

    this.raceHUD.setRaceDistance(
      0,
      this.normalRaceFinishDistance,
      false
    );

    this.raceHUD.update();

    // =======================================================
    // Audio Runtime State
    // =======================================================

    this.audioManager.stopMusic();

    // =======================================================
    // Clock
    // =======================================================

    this.clock.stop();
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {

    this.running =
      false;

    this.clock.stop();

    // =======================================================
    // Events
    // =======================================================

    window.removeEventListener(
      "resize",
      this.handleResize
    );

    window.removeEventListener(
      "keydown",
      this.handleNitroKeyDown
    );

    window.removeEventListener(
      "pointerdown",
      this.handleAudioUnlock
    );

    // =======================================================
    // Controllers
    // =======================================================

    this.swipeController.dispose();

    // =======================================================
    // Collision Systems
    // =======================================================

    this.trafficCollisionSystem.dispose();

    this.obstacleCollisionSystem.dispose();

    // =======================================================
    // Gameplay Systems
    // =======================================================

    this.coinSpawner.dispose();

    this.trafficManager.dispose();

    this.obstacleManager.dispose();

    this.environmentManager.dispose();

    // =======================================================
    // UI
    // =======================================================

    this.raceHUD.dispose();

    this.raceResultUI.dispose();

    this.garageUI.dispose();

    this.upgradeScreen.dispose();

    // =======================================================
    // Audio
    // =======================================================

    this.audioManager.dispose();

    // =======================================================
    // Renderer
    // =======================================================

    this.renderer.dispose();

    // =======================================================
    // Scene
    // =======================================================

    this.scene.clear();
  }
}
