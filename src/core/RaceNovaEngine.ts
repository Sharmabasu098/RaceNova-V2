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

            this.closeUpgrades();
          }
        }
      );

    this.upgradeScreen.hide();

    // =======================================================
    // Boss Manager
    // =======================================================

    this.bossManager =
      new BossManager();

    // =======================================================
    // Boss Race
    // =======================================================

    this.bossRace =
      new BossRace(
        this.bossManager,
        {
          requiredDistance:
            1500,

          bossSpawnDistance:
            80,

          overtakeDistance:
            5
        }
      );

    // =======================================================
    // Boss 3D Mesh
    // =======================================================

    this.bossMesh =
      new THREE.Group();

    this.bossMesh.visible =
      false;

    this.bossMesh.position.set(
      0,
      0,
      -80
    );

    this.bossMesh.rotation.y =
      Math.PI;

    this.scene.add(
      this.bossMesh
    );

    void this.loadBossModel();

    // =======================================================
    // Car Controller
    // =======================================================

    this.carController =
      new CarController(
        this.playerCar,
        {
          laneWidth: 4,

          laneCount: 3,

          steeringSpeed: 10
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
