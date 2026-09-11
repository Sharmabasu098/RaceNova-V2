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

          sideOffset:
            2,

          propCount:
            32,

          spacing:
            18,

          visibleAhead:
            260,

          visibleBehind:
            100
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

          laneWidth:
            4,

          laneCount:
            3,

          obstacleCount:
            9,

          spawnDistance:
            180,

          recycleDistance:
            70,

          playerCollisionWidth:
            1.45,

          playerCollisionDepth:
            2.4
        }
      );

    this.obstacleManager.initialize();

    // =======================================================
    // Economy Manager
    // =======================================================

    this.economyManager =
      new EconomyManager({
        initialCoins:
          0
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

        x:
          0,

        y:
          0,

        z:
          0,

        scale:
          1,

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
          impactStunDuration:
            0.75
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

          laneWidth:
            4,

          laneCount:
            3,

          spawnDistance:
            180,

          despawnDistance:
            60,

          coinSpacing:
            10,

          coinHeight:
            1,

          maxCoins:
            30,

          getRoadCenterX:
            (
              worldZ: number
            ) =>
              this.world.getRoadCenterX(
                worldZ
              ),

          onCoinCollected:
            () => {

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

          onNextRace:
            () => {

              this.start();

            },

          onMainMenu:
            () => {

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
          onChanged:
            () => {

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

          onUpgrade:
            (
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

          onClose:
            () => {

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
          onChanged:
            () => {

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

          onClose:
            () => {

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
          laneWidth:
            4,

          laneCount:
            3,

          steeringSpeed:
            10,

          getRoadCenterX:
            (
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
          swipeThreshold:
            50,

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
          laneWidth:
            4,

          laneCount:
            3,

          maxTraffic:
            8,

          spawnDistance:
            140,

          despawnDistance:
            80,

          minSpeed:
            55,

          maxSpeed:
            95,

          getRoadCenterX:
            (
              worldZ: number
            ) =>
              this.world.getRoadCenterX(
                worldZ
              )
        }
      );

    // =======================================================
    // Traffic Collision System
    // =======================================================

    this.trafficCollisionSystem =
      new TrafficCollisionSystem(
        this.playerCar,
        {
          collisionWidth:
            1.8,

          collisionDepth:
            3.4
        }
      );

    // =======================================================
    // M6.7 — Boss Manager
    // =======================================================

    this.bossManager =
      new BossManager({
        spawnLane:
          1,

        spawnDistance:
          80,

        ai: {

          laneCount:
            3,

          laneWidth:
            4,

          laneChangeSpeed:
            8,

          laneChangeCooldown:
            1.25,

          playerAwarenessDistance:
            90,

          pursuitDistance:
            45,

          maxSpeed:
            120,

          acceleration:
            35

        }
      });

    // =======================================================
    // M6.7 — Boss Race
    // =======================================================

    this.bossRace =
      new BossRace(
        this.bossManager,
        {
          bossSpawnDistance:
            80,

          maxDuration:
            0,

          requiredDistance:
            1500
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
    // M6.7.4 — Load Boss Model
    // =======================================================

    void this.loadBossModel();

    // =======================================================
    // AUDIO — USER INTERACTION UNLOCK
    // =======================================================

    window.addEventListener(
      "pointerdown",
      this.handleAudioUnlock,
      {
        once:
          true
      }
    );

    // =======================================================
    // NITRO KEY
    // =======================================================

    window.addEventListener(
      "keydown",
      this.handleNitroKeyDown
    );

    // =======================================================
    // RESIZE
    // =======================================================

    window.addEventListener(
      "resize",
      this.handleResize
    );

    // =======================================================
    // INITIAL HUD UPDATE
    // =======================================================

    this.raceHUD.update();

  }


// ============================================================
// M6.7.4 — CREATE BOSS MESH
// ============================================================

  private createBossMesh():
    THREE.Group {

    return new THREE.Group();

  }


// ============================================================
// M6.7.4 — LOAD BOSS MODEL
// ============================================================

  private async loadBossModel():
    Promise<void> {

    const loader =
      new GLTFLoader();

    const modelUrl =
      "/RaceNova-V2/assets/cars/bosscar.glb";

    try {

      const gltf =
        await loader.loadAsync(
          modelUrl
        );

      const model =
        gltf.scene;

      model.traverse(
        (object) => {

          if (
            object instanceof THREE.Mesh
          ) {

            object.castShadow =
              true;

            object.receiveShadow =
              true;

            if (
              object.material
            ) {

              if (
                Array.isArray(
                  object.material
                )
              ) {

                object.material.forEach(
                  (material) => {

                    material.needsUpdate =
                      true;

                  }
                );

              } else {

                object.material.needsUpdate =
                  true;

              }

            }

          }

        }
      );

      // ======================================================
      // BOSS MODEL — SCALE
      // ======================================================

      const box =
        new THREE.Box3()
          .setFromObject(
            model
          );

      const size =
        new THREE.Vector3();

      box.getSize(
        size
      );

      const currentLength =
        Math.max(
          size.x,
          size.z,
          0.001
        );

      const targetLength =
        5.2;

      const scale =
        targetLength /
        currentLength;

      model.scale.setScalar(
        scale
      );

      // ======================================================
      // BOSS MODEL — CENTER
      // ======================================================

      const scaledBox =
        new THREE.Box3()
          .setFromObject(
            model
          );

      const center =
        new THREE.Vector3();

      scaledBox.getCenter(
        center
      );

      model.position.x -=
        center.x;

      model.position.z -=
        center.z;

      // ======================================================
      // BOSS MODEL — FLOOR ALIGN
      // ======================================================

      const finalBox =
        new THREE.Box3()
          .setFromObject(
            model
          );

      model.position.y -=
        finalBox.min.y;

      // ======================================================
      // ADD MODEL
      // ======================================================

      this.bossMesh.add(
        model
      );

      this.bossMesh.visible =
        this.bossManager.isActive();

    } catch (
      error
    ) {

      console.error(
        "RaceNovaEngine: Boss model load failed",
        error
      );

    }

  }


// ============================================================
// M6.7.4 — UPDATE BOSS 3D
// ============================================================

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

    // ======================================================
    // BOSS — ROAD CENTER
    // ======================================================

    const roadCenterX =
      this.world.getRoadCenterX(
        bossPosition.z
      );

    this.bossMesh.position.set(
      roadCenterX +
        bossPosition.x,

      0,

      bossPosition.z
    );

    this.bossMesh.visible =
      true;

    this.bossMesh.rotation.y =
      Math.PI;

  }


// ============================================================
// M6.8.3 — BOSS UNLOCK CHECK
// ============================================================

  private isBossUnlocked():
    boolean {

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


// ============================================================
// M8.1 — START BOSS ENCOUNTER
// Boss is restricted to Boss campaign race.
// ============================================================

  private startBossEncounter(
    playerZ: number
  ):
    void {

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

    // ======================================================
    // GET CURRENT SELECTED RACE
    // ======================================================

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

    // ======================================================
    // GET RACE DEFINITION
    // ======================================================

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

    // ======================================================
    // IMPORTANT:
    // isBoss belongs to RaceDefinition.
    // ======================================================

    if (
      !selectedRaceDefinition.isBoss
    ) {

      return;

    }

    // ======================================================
    // BOSS UNLOCK
    // ======================================================

    if (
      !this.isBossUnlocked()
    ) {

      return;

    }

    // ======================================================
    // START BOSS RACE
    // ======================================================

    const result =
      this.bossRace.start(
        this.bossUnlockConfig.bossId,
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


// ============================================================
// M7.1 — ACTIVATE NITRO
// ============================================================

  private activateNitro():
    void {

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


// ============================================================
// M7.1 — NITRO KEY HANDLER
// ============================================================

  private handleNitroKeyDown =
    (
      event: KeyboardEvent
    ):
      void => {

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


// ============================================================
// CORE — LIGHTING
// ============================================================

  private setupLighting():
    void {

    const ambientLight =
      new THREE.AmbientLight(
        0xffffff,
        1.5
      );

    this.scene.add(
      ambientLight
    );

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        2
      );

    directionalLight.position.set(
      10,
      20,
      10
    );

    directionalLight.castShadow =
      true;

    this.scene.add(
      directionalLight
    );

  }


// ============================================================
// CORE — START GAME
// ============================================================

  public start():
    void {

    if (
      this.running
    ) {

      return;

    }

    // ======================================================
    // M8.2 — RESET CURRENT RACE STATE
    // ======================================================

    this.resetRaceState();

    // ======================================================
    // M8.3.2 — START NORMAL RACE
    // ======================================================

    this.startNormalRace();

    this.running =
      true;

    this.clock.start();

    this.animate();

  }


// ============================================================
// CORE — ANIMATION LOOP
// ============================================================

  private animate =
    (): void => {

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


// ============================================================
// CORE — MAIN UPDATE LOOP
// ============================================================

  private update(
    deltaTime: number
  ):
    void {

    if (
      !Number.isFinite(
        deltaTime
      ) ||
      deltaTime <= 0
    ) {

      return;

    }

    // ======================================================
    // TRAFFIC CRASH STATE
    // ======================================================

    const trafficCrashed =
      this.trafficCollisionSystem
        .hasCrashed();

    // ======================================================
    // PLAYER MOVEMENT
    // ======================================================

    if (
      !trafficCrashed &&
      !this.obstacleCollisionSystem
        .isFrozen()
    ) {

      this.playerCar.update(
        deltaTime
      );

    }

    // ======================================================
    // CAR CONTROLLER
    // ======================================================

    this.carController.update(
      deltaTime
    );

    // ======================================================
    // PLAYER POSITION
    // ======================================================

    const playerPosition =
      this.playerCar.getPosition();

    const playerZ =
      playerPosition.z;

    // ======================================================
    // WORLD
    // ======================================================

    this.world.update(
      playerZ
    );

    // ======================================================
    // ENVIRONMENT
    // ======================================================

    this.environmentManager.update(
      playerZ
    );

    // ======================================================
    // OBSTACLES
    // ======================================================

    this.obstacleManager.update(
      playerZ
    );

    // ======================================================
    // OBSTACLE COLLISION
    // ======================================================

    this.obstacleCollisionSystem.update(
      deltaTime
    );

    // ======================================================
    // TRAFFIC
    // ======================================================

    this.trafficManager.update(
      deltaTime,
      playerZ
    );

    // ======================================================
    // TRAFFIC COLLISION
    // ======================================================

    this.trafficCollisionSystem.update(
      this.trafficManager.getTrafficCars()
    );

    // ======================================================
    // NEW TRAFFIC CRASH
    // ======================================================

    const nowTrafficCrashed =
      this.trafficCollisionSystem
        .hasCrashed();

    if (
      nowTrafficCrashed &&
      !this.crashSoundPlayed
    ) {

      this.crashSoundPlayed =
        true;

      this.audioManager.playSFX(
        "crash"
      );

    }

    // ======================================================
    // TRAFFIC CRASH → MAIN MENU
    // ======================================================

    if (
      nowTrafficCrashed &&
      !trafficCrashed
    ) {

      this.running =
        false;

      this.clock.stop();

      window.dispatchEvent(
        new CustomEvent(
          "racenova:traffic-crash"
        )
      );

      return;

    }

    // ======================================================
    // COINS
    // ======================================================

    if (
      !nowTrafficCrashed
    ) {

      this.coinSpawner.update(
        deltaTime,
        playerPosition
      );

    }

    // ======================================================
    // BOSS ENCOUNTER
    // ======================================================

    if (
      !this.bossEncounterStarted
    ) {

      this.startBossEncounter(
        playerZ
      );

    }

    // ======================================================
    // BOSS UPDATE
    // ======================================================

    if (
      this.bossRace.isActive() &&
      !nowTrafficCrashed
    ) {

      this.bossRace.update(
        deltaTime,
        playerPosition.x,
        playerZ,
        this.playerCar.getSpeed()
      );

    }

    // ======================================================
    // BOSS DEFEAT SOUND
    // ======================================================

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

    // ======================================================
    // BOSS COMPLETE SOUND
    // ======================================================

    if (
      this.bossRace.isCompleted() &&
      !this.bossCompleteSoundPlayed
    ) {

      this.bossCompleteSoundPlayed =
        true;

      this.audioManager.playSFX(
        "bossComplete"
      );

    }

    // ======================================================
    // BOSS FAIL SOUND
    // ======================================================

    if (
      this.bossRace.isFailed() &&
      !this.bossFailSoundPlayed
    ) {

      this.bossFailSoundPlayed =
        true;

      this.audioManager.playSFX(
        "bossFail"
      );

    }

    // ======================================================
    // RECORD BOSS DEFEAT
    // ======================================================

    if (
      this.bossRace.isBossDefeated()
    ) {

      this.recordBossDefeat();

    }

    // ======================================================
    // UPDATE BOSS MODEL
    // ======================================================

    this.updateBoss3D();

    // ======================================================
    // TOTAL DISTANCE
    // ======================================================

    const currentSpeed =
      this.playerCar.getSpeed();

    if (
      Number.isFinite(
        currentSpeed
      ) &&
      currentSpeed > 0
    ) {

      this.playerProgress
        .totalDistance +=
          (
            currentSpeed / 3.6
          ) *
          deltaTime;

    }

    // ======================================================
    // M8.3.2 — NORMAL RACE UPDATE
    // ======================================================

    if (
      this.normalRaceStarted &&
      !this.normalRaceCompleted &&
      !nowTrafficCrashed
    ) {

      this.updateNormalRace(
        deltaTime
      );

    }

    // ======================================================
    // HUD — DISTANCE
    // ======================================================
    this.raceHUD.setRaceDistance(
      this.normalRaceDistance,
      this.normalRaceFinishDistance,
      this.normalRaceStarted &&
        !this.normalRaceCompleted
    );

    this.raceHUD.update();

    // ======================================================
    // CAMERA FOLLOW
    // ======================================================

    const targetCameraX =
      playerPosition.x;

    const targetCameraZ =
      playerZ + 10;

    this.camera.position.x +=
      (
        targetCameraX -
        this.camera.position.x
      ) *
      Math.min(
        1,
        deltaTime * 8
      );

    this.camera.position.z +=
      (
        targetCameraZ -
        this.camera.position.z
      ) *
      Math.min(
        1,
        deltaTime * 8
      );

    this.camera.lookAt(
      playerPosition.x,
      0.5,
      playerZ - 20
    );

  }

    // ============================================================
// M8.3.2 — START NORMAL RACE
// ============================================================

  private startNormalRace():
    void {

    const progression =
      this.playerProgress
        .raceProgression;

    // ========================================================
    // FIND SELECTED RACE
    // ========================================================

    let selectedRace =
      progression.races.find(
        (race) =>
          race.raceId ===
          progression.selectedRaceId
      );

    let selectedRaceDefinition =
      selectedRace
        ? RACE_DEFINITIONS.find(
            (race) =>
              race.id ===
              selectedRace!.raceId
          )
        : undefined;

    // ========================================================
    // BOSS RACE MUST NOT START AS NORMAL RACE
    // ========================================================

    if (
      !selectedRace ||
      !selectedRaceDefinition ||
      selectedRaceDefinition.isBoss ||
      selectedRace.status ===
        "locked"
    ) {

      // ======================================================
      // FALLBACK — FIRST AVAILABLE NON-BOSS RACE
      // ======================================================

      const fallback =
        progression.races.find(
          (race) => {

            if (
              race.status !==
                "available" &&
              race.status !==
                "completed"
            ) {

              return false;

            }

            const definition =
              RACE_DEFINITIONS.find(
                (item) =>
                  item.id ===
                  race.raceId
              );

            return Boolean(
              definition &&
              !definition.isBoss
            );

          }
        );

      if (
        !fallback
      ) {

        return;

      }

      selectedRace =
        fallback;

      selectedRaceDefinition =
        RACE_DEFINITIONS.find(
          (race) =>
            race.id ===
            fallback!.raceId
        );

      progression.selectedRaceId =
        fallback.raceId;

      this.playerProgress
        .selectedRaceId =
          fallback.raceId;

    }

    // ========================================================
    // FINAL VALIDATION
    // ========================================================

    if (
      !selectedRace ||
      !selectedRaceDefinition
    ) {

      return;

    }

    if (
      selectedRaceDefinition.isBoss
    ) {

      return;

    }

    if (
      selectedRace.status ===
      "locked"
    ) {

      return;

    }

    // ========================================================
    // INITIALIZE NORMAL RACE
    // ========================================================

    this.normalRaceId =
      selectedRace.raceId;

    this.normalRaceStarted =
      true;

    this.normalRaceCompleted =
      false;

    this.normalRaceDistance =
      0;

    this.normalRaceStartZ =
      this.playerCar.getPosition()
        .z;

    this.normalRaceLastZ =
      this.normalRaceStartZ;

    this.normalRaceTime =
      0;

    // ========================================================
    // HUD — RESET DISTANCE
    // ========================================================

    this.raceHUD.setRaceDistance(
      0,
      this.normalRaceFinishDistance,
      true
    );

    this.raceHUD.update();

  }


// ============================================================
// M8.3.2 — UPDATE NORMAL RACE DISTANCE
// ============================================================
//
// The player's actual Z movement is used to calculate race
// distance. This keeps the race distance tied to gameplay.
//
// The road/world uses negative Z movement, so:
//
// distanceDelta = lastZ - currentZ
//
// ============================================================

  private updateNormalRace(
    deltaTime: number
  ):
    void {

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

    // ========================================================
    // CURRENT PLAYER Z
    // ========================================================

    const currentZ =
      this.playerCar
        .getPosition()
        .z;

    if (
      !Number.isFinite(
        currentZ
      )
    ) {

      return;

    }

    // ========================================================
    // CALCULATE REAL Z MOVEMENT
    // ========================================================

    const distanceDelta =
      this.normalRaceLastZ -
      currentZ;

    this.normalRaceLastZ =
      currentZ;

    // ========================================================
    // ONLY COUNT FORWARD MOVEMENT
    // ========================================================

    if (
      Number.isFinite(
        distanceDelta
      ) &&
      distanceDelta > 0
    ) {

      this.normalRaceDistance +=
        distanceDelta;

    }

    // ========================================================
    // RACE TIMER
    // ========================================================

    this.normalRaceTime +=
      deltaTime;

    // ========================================================
    // CLAMP DISTANCE
    // ========================================================

    if (
      this.normalRaceDistance <
      0
    ) {

      this.normalRaceDistance =
        0;

    }

    if (
      this.normalRaceDistance >
      this.normalRaceFinishDistance
    ) {

      this.normalRaceDistance =
        this.normalRaceFinishDistance;

    }

    // ========================================================
    // 1500m FINISH CHECK
    // ========================================================

    if (
      this.normalRaceDistance >=
      this.normalRaceFinishDistance
    ) {

      this.normalRaceDistance =
        this.normalRaceFinishDistance;

      this.finishNormalRace();

    }

  }


// ============================================================
// M8.3 — FINISH NORMAL RACE
// ============================================================

  private finishNormalRace():
    void {

    if (
      !this.normalRaceStarted ||
      this.normalRaceCompleted
    ) {

      return;

    }

    // ========================================================
    // CAPTURE RESULT
    // ========================================================

    const completedRaceId =
      this.normalRaceId;

    const completedRaceTime =
      this.normalRaceTime;

    const completedDistance =
      this.normalRaceDistance;

    // ========================================================
    // MARK COMPLETED
    // ========================================================

    this.normalRaceCompleted =
      true;

    // ========================================================
    // RACE COMPLETE SOUND
    // ========================================================

    if (
      !this.normalRaceCompleteSoundPlayed
    ) {

      this.normalRaceCompleteSoundPlayed =
        true;

      this.audioManager.playSFX(
        "raceComplete"
      );

    }

    // ========================================================
    // SAVE COMPLETED RACE
    // ========================================================

    this.completeRace(
      completedRaceId,
      true,
      1,
      completedRaceTime
    );

    // ========================================================
    // ADVANCE CAMPAIGN
    // ========================================================

    this.advanceToNextRace();

    this.normalRaceStarted =
      false;

    // ========================================================
    // NEXT RACE ID
    // ========================================================

    const nextRaceId =
      this.getNextRaceId(
        completedRaceId
      );

    // ========================================================
    // CREATE RESULT
    // ========================================================

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
        completedDistance,

      reward:
        0,

      isBossRace:
        false,

      bossDefeated:
        false,

      nextRaceId:
        nextRaceId,

      timestamp:
        Date.now()

    });

    // ========================================================
    // STOP RACE
    // ========================================================

    this.running =
      false;

    this.clock.stop();

    // ========================================================
    // SHOW RESULT UI
    // ========================================================

    this.raceResultUI.show(
      this.raceResult.get()
    );

  }


// ============================================================
// M8.3 — ADVANCE TO NEXT RACE
// ============================================================

  private advanceToNextRace():
    void {

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

    // ========================================================
    // UNLOCK NEXT RACE
    // ========================================================

    if (
      nextRace.status ===
      "locked"
    ) {

      nextRace.status =
        "available";

    }

    // ========================================================
    // SELECT NEXT RACE
    // ========================================================

    progression.selectedRaceId =
      nextRace.raceId;

    this.playerProgress
      .selectedRaceId =
        nextRace.raceId;

    // ========================================================
    // SAVE
    // ========================================================

    this.savePlayerData();

  }


// ============================================================
// M8.3 — GET NEXT RACE ID
// ============================================================

  private getNextRaceId(
    raceId: string
  ):
    string | null {

    const progression =
      this.playerProgress
        .raceProgression;

    const currentIndex =
      progression.races.findIndex(
        (race) =>
          race.raceId ===
          raceId
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


// ============================================================
// CORE — RESIZE
// ============================================================

  private handleResize =
    (): void => {

    const width =
      window.innerWidth;

    const height =
      window.innerHeight;

    if (
      height <= 0
    ) {

      return;

    }

    // ========================================================
    // CAMERA
    // ========================================================

    this.camera.aspect =
      width / height;

    this.camera.updateProjectionMatrix();

    // ========================================================
    // RENDERER
    // ========================================================

    this.renderer.setSize(
      width,
      height
    );

    this.renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio || 1,
        2
      )
    );

  };


// ============================================================
// PUBLIC API — ECONOMY
// ============================================================

  public getEconomyManager():
    EconomyManager {

    return this.economyManager;

  }


// ============================================================
// PUBLIC API — GARAGE MANAGER
// ============================================================

  public getGarageManager():
    GarageManager {

    return this.garageManager;

  }


// ============================================================
// PUBLIC API — OPEN GARAGE
// ============================================================

  public openGarage():
    void {

    this.garageUI.open();

  }


// ============================================================
// PUBLIC API — CLOSE GARAGE
// ============================================================

  public closeGarage():
    void {

    this.garageUI.hide();

  }


// ============================================================
// PUBLIC API — GARAGE STATE
// ============================================================

  public isGarageOpen():
    boolean {

    return this.garageUI.isVisible();

  }


// ============================================================
// PUBLIC API — OPEN UPGRADES
// ============================================================

  public openUpgrades():
    void {

    this.upgradeScreen.open();

  }


// ============================================================
// PUBLIC API — CLOSE UPGRADES
// ============================================================

  public closeUpgrades():
    void {

    this.upgradeScreen.hide();

  }


// ============================================================
// PUBLIC API — UPGRADE STATE
// ============================================================

  public isUpgradeScreenOpen():
    boolean {

    return this.upgradeScreen.isVisible();

  }


// ============================================================
// PUBLIC API — SELECTED CAR
// ============================================================

  public getSelectedCarId():
    string {

    return this.garageManager
      .getSelectedCarId();

  }


// ============================================================
// PUBLIC API — UPGRADE SYSTEM
// ============================================================

  public getUpgradeSystem():
    UpgradeSystem {

    return this.upgradeSystem;

  }


// ============================================================
// PUBLIC API — SAVE SYSTEM
// ============================================================

  public getSaveSystem():
    SaveSystem {

    return this.saveSystem;

  }

  // ============================================================
// PUBLIC API — PLAYER
// ============================================================

  public getPlayerCar():
    PlayerCar {

    return this.playerCar;

  }


// ============================================================
// PUBLIC API — RACE STATE
// ============================================================

  public isRaceRunning():
    boolean {

    return this.running;

  }

  public isNormalRaceActive():
    boolean {

    return (
      this.normalRaceStarted &&
      !this.normalRaceCompleted
    );

  }

  public getNormalRaceDistance():
    number {

    return this.normalRaceDistance;

  }

  public getNormalRaceFinishDistance():
    number {

    return this.normalRaceFinishDistance;

  }


// ============================================================
// PUBLIC API — PROGRESSION
// ============================================================

  public getPlayerProgress():
    PlayerProgress {

    return this.playerProgress;

  }


// ============================================================
// PUBLIC API — BOSS
// ============================================================

  public isBossRaceActive():
    boolean {

    return (
      this.bossEncounterStarted &&
      this.bossRace.isActive()
    );

  }

  public isBossUnlocked():
    boolean {

    const progress =
      this.playerProgress;

    const completed =
      progress.raceProgression
        .races
        .filter(
          (race) =>
            race.status ===
            "completed"
        )
        .length;

    const won =
      progress.raceProgression
        .races
        .reduce(
          (
            total,
            race
          ) =>
            total +
            race.winCount,
          0
        );

    return (
      progress.unlockedLevel >=
        this.bossUnlockConfig.requiredLevel &&
      completed >=
        this.bossUnlockConfig.requiredRacesCompleted &&
      won >=
        this.bossUnlockConfig.requiredRacesWon
    );

  }


// ============================================================
// PUBLIC API — START BOSS ENCOUNTER
// ============================================================

  public startBossEncounter():
    void {

    if (
      this.bossEncounterStarted
    ) {

      return;

    }

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

    // ========================================================
    // AUTHORITATIVE RACE DEFINITION
    // ========================================================

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

    // ========================================================
    // BOSS ONLY
    // ========================================================

    if (
      !selectedRaceDefinition.isBoss
    ) {

      return;

    }

    // ========================================================
    // UNLOCK CHECK
    // ========================================================

    if (
      !this.isBossUnlocked()
    ) {

      return;

    }

    const playerZ =
      this.playerCar
        .getPosition()
        .z;

    const result =
      this.bossRace.start(
        this.bossUnlockConfig.bossId,
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


// ============================================================
// BOSS 3D UPDATE
// ============================================================

  private updateBoss3D():
    void {

    if (
      !this.bossEncounterStarted
    ) {

      this.bossMesh.visible =
        false;

      return;

    }

    if (
      !this.bossRace.isActive()
    ) {

      this.bossMesh.visible =
        false;

      return;

    }

    const bossPosition =
      this.bossRace
        .getBossManager()
        .getPosition();

    if (
      !bossPosition
    ) {

      this.bossMesh.visible =
        false;

      return;

    }

    this.bossMesh.visible =
      true;

    this.bossMesh.position.x =
      bossPosition.x;

    this.bossMesh.position.y =
      bossPosition.y;

    this.bossMesh.position.z =
      bossPosition.z;

  }


// ============================================================
// SAVE PLAYER DATA
// ============================================================

  private savePlayerData():
    void {

    try {

      const snapshot =
        this.saveSystem
          .createSnapshot(
            this.playerProgress,
            this.economyManager,
            this.garageManager,
            this.upgradeSystem
          );

      this.saveSystem.save(
        snapshot
      );

    } catch (
      error
    ) {

      console.error(
        "RaceNova: failed to save player data",
        error
      );

    }

  }


// ============================================================
// RESET RACE STATE
// ============================================================

  public resetRaceState():
    void {

    // ========================================================
    // ENGINE STATE
    // ========================================================

    this.running =
      false;

    this.normalRaceStarted =
      false;

    this.normalRaceCompleted =
      false;

    this.normalRaceId =
      null;

    this.normalRaceDistance =
      0;

    this.normalRaceTime =
      0;

    this.normalRaceCompleteSoundPlayed =
      false;

    // ========================================================
    // PLAYER
    // ========================================================

    this.playerCar.setSpeed(
      0
    );

    this.playerCar.stop();

    this.playerCar.setX(
      0
    );

    this.playerCar.setZ(
      0
    );

    // ========================================================
    // TRAFFIC
    // ========================================================

    this.trafficManager.clear();

    this.trafficCollisionSystem.reset();

    // ========================================================
    // OBSTACLES
    // ========================================================

    this.obstacleManager.clear();

    this.obstacleCollisionSystem.reset();

    // ========================================================
    // COINS
    // ========================================================

    this.coinSpawner.clear();

    // ========================================================
    // BOSS
    // ========================================================

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

    // ========================================================
    // ENVIRONMENT
    // ========================================================

    this.environmentManager.reset(
      0
    );

    // ========================================================
    // CAMERA
    // ========================================================

    this.camera.position.set(
      0,
      6,
      12
    );

    this.camera.lookAt(
      0,
      1,
      -20
    );

    // ========================================================
    // HUD
    // ========================================================

    this.raceHUD.setRaceDistance(
      0,
      this.normalRaceFinishDistance,
      false
    );

    this.raceHUD.update();

    // ========================================================
    // RESULT UI
    // ========================================================

    this.raceResult.reset();

    this.raceResultUI.hide();

    // ========================================================
    // CLOCK
    // ========================================================

    this.clock.stop();

  }


// ============================================================
// DISPOSE
// ============================================================

  public dispose():
    void {

    // ========================================================
    // STOP ENGINE
    // ========================================================

    this.running =
      false;

    this.clock.stop();

    // ========================================================
    // EVENT LISTENERS
    // ========================================================

    window.removeEventListener(
      "resize",
      this.handleResize
    );

    // ========================================================
    // CONTROLS
    // ========================================================

    this.swipeController.dispose();

    // ========================================================
    // SYSTEMS
    // ========================================================

    this.trafficCollisionSystem.dispose();

    this.obstacleCollisionSystem.dispose();

    this.coinSpawner.dispose();

    this.trafficManager.dispose();

    this.obstacleManager.dispose();

    this.environmentManager.dispose();

    // ========================================================
    // UI
    // ========================================================

    this.raceHUD.dispose();

    this.raceResultUI.dispose();

    this.garageUI.dispose();

    this.upgradeScreen.dispose();

    // ========================================================
    // AUDIO
    // ========================================================

    this.audioManager.dispose();

    // ========================================================
    // RENDERER
    // ========================================================

    this.renderer.dispose();

    // ========================================================
    // SCENE
    // ========================================================

    this.scene.clear();

  }

}
