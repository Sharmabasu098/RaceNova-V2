// ============================================================
// RaceNova V2 — RaceNovaEngine.ts
// M11.8.8 — Account-Bound Engine
// Based on current M8.3.2 Engine
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

import {
  PlayerProfileManager
} from "../profile/PlayerProfileManager";

import {
  LocalPersistenceRepository
} from "../profile/LocalPersistenceRepository";

import {
  RuntimeProfileBridge
} from "../profile/RuntimeProfileBridge";

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
  // M11.8.8 — Account Context
  // =========================================================

  /**
   * The engine instance belongs to exactly one authenticated
   * RaceNova account.
   *
   * IMPORTANT:
   * - No account switching inside a live engine.
   * - A new engine instance must be created for another account.
   * - The accountId is used by SaveSystem for account-scoped
   *   persistence.
   */
  private readonly accountId:
    string;

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

  private raceCrashed =
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
  // M8.4 — Normal Race Win Reward
  // =========================================================

  private static readonly NORMAL_RACE_WIN_REWARD =
    100;

  // =======================================================
  // M8.6 — Boss WIN Reward
  // =======================================================

  private static readonly BOSS_WIN_REWARD =
    500;

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
  // M10.7.2 — Runtime Profile Integration
  // =========================================================

  private readonly profileManager:
    PlayerProfileManager;

  private readonly runtimeProfileBridge:
    RuntimeProfileBridge;

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
  // M11.8.8 — Constructor
  // =========================================================

  constructor(
    container: HTMLElement,
    accountId: string
  ) {

    // =======================================================
    // Account Validation
    // =======================================================

    if (
      typeof accountId !== "string" ||
      accountId.trim().length === 0
    ) {

      throw new Error(
        "RaceNovaEngine: accountId must be a non-empty string."
      );
    }

    this.accountId =
      accountId.trim();

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
    // M11.8.8 — Account-Bound Save System
    // =======================================================

    this.saveSystem =
      new SaveSystem(
        this.economyManager,
        this.garageManager,
        this.upgradeSystem,
        {
          accountId:
            this.accountId
        }
      );

    // =======================================================
    // M10.7.2 — Runtime Profile Integration
    // =======================================================

    const profileRepository =
      new LocalPersistenceRepository(
        this.saveSystem
      );

    this.profileManager =
      new PlayerProfileManager(
        profileRepository
      );

    this.runtimeProfileBridge =
      new RuntimeProfileBridge(
        this.profileManager
      );

    // =======================================================
    // Restore Account-Bound Save
    // M11.8.8
    // =======================================================

    const saveLoaded =
      this.saveSystem.load();

    if (
      saveLoaded
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

    // -------------------------------------------------------
    // Ensure a valid PlayerSaveData snapshot exists
    // -------------------------------------------------------

    if (
      !this.saveSystem.readSave()
    ) {

      this.saveSystem.save();
    }

    // -------------------------------------------------------
    // Runtime Profile Initialization
    //
    // IMPORTANT:
    // The authenticated accountId is now the profile identity.
    // No shared LOCAL_PROFILE_ID is used.
    // -------------------------------------------------------

    const runtimeSaveData =
      this.saveSystem.readSave();

    if (
      runtimeSaveData
    ) {

      const initializedProfile =
        this.runtimeProfileBridge.initialize(
          this.accountId,
          runtimeSaveData,
          ""
        );

      if (
        initializedProfile
      ) {

        // -----------------------------------------------------
        // PlayerSaveData remains authoritative.
        // Synchronize the current gameplay save into
        // the active runtime profile.
        // -----------------------------------------------------

        this.runtimeProfileBridge
          .syncSaveData(
            runtimeSaveData
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

        modelPath:
          selectedCar.modelPath,

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
        document.body,
        this.garageManager,
        this.upgradeSystem,
        this.economyManager,
        () => {

          this.savePlayerData();
        }
      );

    this.garageUI.hide();

    // =======================================================
    // Upgrade UI
    // =======================================================

    this.upgradeScreen =
      new UpgradeScreen(
        document.body,
        this.garageManager,
        this.upgradeSystem,
        this.economyManager,
        () => {

          this.savePlayerData();
        }
      );

    this.upgradeScreen.hide();

    // =======================================================
    // Traffic Manager
    // =======================================================

    this.trafficManager =
      new TrafficManager(
        this.scene,
        (
          worldZ: number
        ) =>
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

          trafficCount:
            8,

          spawnDistance:
            220,

          recycleDistance:
            80
        }
      );

    this.trafficManager.initialize();

    // =======================================================
    // Traffic Collision System
    // =======================================================

    this.trafficCollisionSystem =
      new TrafficCollisionSystem(
        this.playerCar,
        this.trafficManager
      );

    // =======================================================
    // Car Controller
    // =======================================================

    this.carController =
      new CarController(
        this.playerCar,
        {
          laneWidth: 4,

          laneCount: 3
        }
      );

    // =======================================================
    // Swipe Controller
    // =======================================================

    this.swipeController =
      new SwipeController(
        this.carController
      );

    // =======================================================
    // Boss Manager
    // =======================================================

    this.bossManager =
      new BossManager();

    // =======================================================
    // Boss Race
    // =======================================================

    this.bossRace =
      new BossRace();

    // =======================================================
    // Boss Mesh
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

    // =======================================================
    // Initial Boss State
    // =======================================================

    this.bossEncounterStarted =
      false;

    // =======================================================
    // Resize
    // =======================================================

    window.addEventListener(
      "resize",
      this.handleResize
    );

    // =======================================================
    // Nitro Keyboard
    // =======================================================

    window.addEventListener(
      "keydown",
      this.handleNitroKeyDown
    );

    // =======================================================
    // Audio Unlock
    // =======================================================

    window.addEventListener(
      "pointerdown",
      this.handleAudioUnlock,
      {
        passive: true
      }
    );

    // =======================================================
    // Initial Runtime State
    // =======================================================

    this.resetRaceState();

    // =======================================================
    // Renderer / Engine Ready
    // =======================================================

    this.render();
  }

  // =========================================================
  // M11.8.8 — Account Access
  // =========================================================

  /**
   * Returns the authenticated account identifier that owns
   * this engine instance.
   *
   * Example:
   *   google:<verified-google-sub>
   *   pi:<verified-pi-uid>
   */
  public getAccountId(): string {

    return this.accountId;
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

  // =========================================================
  // Render Loop
  // =========================================================

  private render = (): void => {

    requestAnimationFrame(
      this.render
    );

    if (
      this.running
    ) {

      const delta =
        this.clock.getDelta();

      this.update(
        delta
      );
    }

    this.renderer.render(
      this.scene,
      this.camera
    );
  };

    // =========================================================
  // Update
  // =========================================================

  private update(
    delta: number
  ): void {

    if (
      delta <= 0
    ) {
      return;
    }

    // =======================================================
    // Player
    // =======================================================

    this.playerCar.update(
      delta
    );

    // =======================================================
    // Controller
    // =======================================================

    this.carController.update(
      delta
    );

    // =======================================================
    // World
    // =======================================================

    this.world.update(
      this.playerCar.getZ()
    );

    // =======================================================
    // Environment
    // =======================================================

    this.environmentManager.update(
      this.playerCar.getZ()
    );

    // =======================================================
    // Traffic
    // =======================================================

    this.trafficManager.update(
      delta,
      this.playerCar.getZ()
    );

    // =======================================================
    // Traffic Collision
    // =======================================================

    this.trafficCollisionSystem.update();

    // =======================================================
    // Obstacles
    // =======================================================

    this.obstacleManager.update(
      this.playerCar.getZ()
    );

    // =======================================================
    // Obstacle Collision
    // =======================================================

    this.obstacleCollisionSystem.update(
      delta
    );

    // =======================================================
    // Coins
    // =======================================================

    this.coinSpawner.update(
      this.playerCar.getZ()
    );

    // =======================================================
    // Boss
    // =======================================================

    this.updateBoss(
      delta
    );

    // =======================================================
    // Normal Race
    // =======================================================

    if (
      this.normalRaceStarted &&
      !this.normalRaceCompleted
    ) {

      this.updateNormalRace(
        delta
      );
    }

    // =======================================================
    // HUD
    // =======================================================

    this.raceHUD.update();
  }

  // =========================================================
  // Start Engine
  // =========================================================

  public start(): void {

    if (
      this.running
    ) {
      return;
    }

    this.running =
      true;

    this.clock.start();

    this.startRaceRuntime();
  }

  // =========================================================
  // Stop Engine
  // =========================================================

  public stop(): void {

    this.running =
      false;

    this.clock.stop();
  }

  // =========================================================
  // Race Runtime Start
  // =========================================================

  private startRaceRuntime(): void {

    // =======================================================
    // Reset Race Runtime
    // =======================================================

    this.normalRaceStarted =
      false;

    this.normalRaceCompleted =
      false;

    this.normalRaceDistance =
      0;

    this.normalRaceTime =
      0;

    this.normalRaceStartZ =
      this.playerCar.getZ();

    this.normalRaceLastZ =
      this.playerCar.getZ();

    this.normalRaceCompleteSoundPlayed =
      false;

    this.crashSoundPlayed =
      false;

    this.raceCrashed =
      false;

    this.bossDefeatSoundPlayed =
      false;

    this.bossCompleteSoundPlayed =
      false;

    this.bossFailSoundPlayed =
      false;

    // =======================================================
    // Reset Runtime Systems
    // =======================================================

    this.trafficManager.reset();

    this.trafficCollisionSystem.reset();

    this.obstacleManager.reset(
      this.playerCar.getZ()
    );

    this.obstacleCollisionSystem.reset();

    this.coinSpawner.clear();

    this.bossRace.reset();

    this.bossEncounterStarted =
      false;

    this.bossMesh.visible =
      false;

    // =======================================================
    // Start Normal Race
    // =======================================================

    const selectedRaceId =
      this.playerProgress
        .selectedRaceId;

    this.normalRaceId =
      selectedRaceId;

    this.normalRaceStarted =
      true;

    this.raceHUD.setRaceDistance(
      0,
      this.normalRaceFinishDistance,
      true
    );

    // =======================================================
    // Audio
    // =======================================================

    this.audioManager.startMusic();

    // =======================================================
    // Player
    // =======================================================

    this.playerCar.stop();

    this.playerCar.setSpeed(
      0
    );
  }

  // =========================================================
  // Normal Race Update
  // =========================================================

  private updateNormalRace(
    delta: number
  ): void {

    this.normalRaceTime +=
      delta;

    const currentZ =
      this.playerCar.getZ();

    const distanceTravelled =
      Math.abs(
        currentZ -
        this.normalRaceStartZ
      );

    this.normalRaceDistance =
      Math.max(
        this.normalRaceDistance,
        distanceTravelled
      );

    this.raceHUD.setRaceDistance(
      this.normalRaceDistance,
      this.normalRaceFinishDistance,
      true
    );

    // =======================================================
    // Finish Detection
    // =======================================================

    if (
      this.normalRaceDistance >=
      this.normalRaceFinishDistance
    ) {

      this.completeNormalRace();

      return;
    }

    // =======================================================
    // Crash Detection
    // =======================================================

    if (
      this.raceCrashed
    ) {

      this.handleRaceCrash();

      return;
    }

    this.normalRaceLastZ =
      currentZ;
  }

  // =========================================================
  // Normal Race Complete
  // =========================================================

  private completeNormalRace(): void {

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

    // =======================================================
    // M8.4 — WIN Reward
    // =======================================================

    const winReward =
      RaceNovaEngine.NORMAL_RACE_WIN_REWARD;

    const rewardGranted =
      this.economyManager.rewardCoins(
        winReward,
        `Normal Race WIN: ${completedRaceId}`
      );

    const actualReward =
      rewardGranted
        ? winReward
        : 0;

    // =======================================================
    // M8.4 — Persist WIN reward
    // =======================================================

    this.savePlayerData();

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
    // M8.4 owns reward calculation.
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
        actualReward,

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
  // M7.1 — Nitro Keyboard
  // =========================================================

  private handleNitroKeyDown = (
    event: KeyboardEvent
  ): void => {

    if (
      event.code ===
      "Space"
    ) {

      event.preventDefault();

      this.activateNitro();
    }
  };

  // =========================================================
  // Nitro
  // =========================================================

  private activateNitro(): void {

    if (
      !this.running
    ) {
      return;
    }

    this.playerCar.activateNitro();
  }

  // =========================================================
  // Boss Update
  // =========================================================

  private updateBoss(
    delta: number
  ): void {

    if (
      !this.isBossUnlocked()
    ) {
      return;
    }

    if (
      !this.normalRaceStarted ||
      this.normalRaceCompleted
    ) {
      return;
    }

    if (
      !this.bossEncounterStarted
    ) {
      return;
    }

    this.bossRace.update(
      delta
    );
  }

  // =========================================================
  // Boss Unlock
  // =========================================================

  private isBossUnlocked(): boolean {

    const progress:
      BossUnlockProgress = {

      level:
        this.playerProgress
          .unlockedLevel,

      racesCompleted:
        this.playerProgress
          .racesCompleted,

      racesWon:
        this.playerProgress
          .racesWon
    };

    return BossUnlockRules.isUnlocked(
      progress,
      this.bossUnlockConfig
    );
  }

  // =========================================================
  // Boss Encounter
  // =========================================================

  private startBossEncounter(): void {

    if (
      this.bossEncounterStarted
    ) {
      return;
    }

    if (
      !this.isBossUnlocked()
    ) {
      return;
    }

    this.bossEncounterStarted =
      true;

    this.bossMesh.visible =
      true;

    this.bossRace.start();
  }

  // =========================================================
  // Boss Defeat
  // =========================================================

  private handleBossDefeat(): void {

    if (
      !this.bossEncounterStarted
    ) {
      return;
    }

    if (
      !this.bossDefeatSoundPlayed
    ) {

      this.bossDefeatSoundPlayed =
        true;

      this.audioManager.playSFX(
        "bossDefeat"
      );
    }

    this.recordBossDefeat();

    this.bossMesh.visible =
      false;

    this.bossEncounterStarted =
      false;
  }

  // =========================================================
  // Boss Complete
  // =========================================================

  private handleBossComplete(): void {

    if (
      !this.bossCompleteSoundPlayed
    ) {

      this.bossCompleteSoundPlayed =
        true;

      this.audioManager.playSFX(
        "raceComplete"
      );
    }

    const rewardGranted =
      this.economyManager.rewardCoins(
        RaceNovaEngine.BOSS_WIN_REWARD,
        "Boss Race WIN"
      );

    const actualReward =
      rewardGranted
        ? RaceNovaEngine.BOSS_WIN_REWARD
        : 0;

    this.savePlayerData();

    this.bossMesh.visible =
      false;

    this.bossEncounterStarted =
      false;
  }

  // =========================================================
  // Boss Fail
  // =========================================================

  private handleBossFail(): void {

    if (
      !this.bossFailSoundPlayed
    ) {

      this.bossFailSoundPlayed =
        true;

      this.audioManager.playSFX(
        "crash"
      );
    }

    this.bossMesh.visible =
      false;

    this.bossEncounterStarted =
      false;
  }

  // =========================================================
  // Race Crash
  // =========================================================

  private handleRaceCrash(): void {

    if (
      !this.raceCrashed
    ) {
      return;
    }

    // -------------------------------------------------------
    // Crash SFX — play once
    // -------------------------------------------------------

    if (
      !this.crashSoundPlayed
    ) {

      this.crashSoundPlayed =
        true;

      this.audioManager.playSFX(
        "crash"
      );
    }

    // -------------------------------------------------------
    // Crash result
    // -------------------------------------------------------

    const crashedRaceId =
      this.normalRaceId;

    const crashTime =
      this.normalRaceTime;

    // -------------------------------------------------------
    // M8.4 — CRASH reward must remain ZERO.
    // -------------------------------------------------------

    const crashReward =
      0;

    this.raceResult.set({

      raceId:
        crashedRaceId,

      result:
        "CRASH",

      position:
        0,

      time:
        crashTime,

      distance:
        this.normalRaceDistance,

      reward:
        crashReward,

      isBossRace:
        false,

      bossDefeated:
        false,

      nextRaceId:
        null,

      timestamp:
        Date.now()
    });

    // -------------------------------------------------------
    // Persist current account state.
    // No WIN reward is granted.
    // -------------------------------------------------------

    this.savePlayerData();

    // -------------------------------------------------------
    // Stop race
    // -------------------------------------------------------

    this.normalRaceStarted =
      false;

    this.running =
      false;

    this.clock.stop();

    // -------------------------------------------------------
    // Show result
    // -------------------------------------------------------

    this.raceResultUI.show(
      this.raceResult.get()
    );
  }

  // =========================================================
  // Public Crash Notification
  // =========================================================

  public notifyRaceCrash(): void {

    if (
      !this.normalRaceStarted ||
      this.normalRaceCompleted
    ) {
      return;
    }

    this.raceCrashed =
      true;
  }

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

    if (
      this.running
    ) {
      return;
    }

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
  // M10.7.2 / M11.8.8
  // Save Player Data + Runtime Profile Sync
  // =========================================================

  private savePlayerData(): void {

    try {

      // ------------------------------------------------------
      // SaveSystem is permanently bound to this.accountId.
      // ------------------------------------------------------

      const saved =
        this.saveSystem.save(
          this.playerProgress
        );

      if (
        !saved
      ) {

        return;
      }

      // ------------------------------------------------------
      // Read the authoritative gameplay save.
      // ------------------------------------------------------

      const saveData =
        this.saveSystem.readSave();

      if (
        !saveData
      ) {

        return;
      }

      // ------------------------------------------------------
      // Synchronize PlayerSaveData into
      // the active account profile.
      // ------------------------------------------------------

      this.runtimeProfileBridge
        .syncSaveData(
          saveData
        );

    } catch (
      error
    ) {

      console.error(
        "[RaceNova] Save/Profile sync failed:",
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

    this.raceCrashed =
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
    // M8.5 — Reset Player Lane Controller
    // =======================================================

    this.carController.reset();

    // =======================================================
    // Traffic
    // M8.5 — Fresh Race Traffic Reset
    // =======================================================

    this.trafficManager.reset();

    this.trafficCollisionSystem.reset();

    // =======================================================
    // Obstacles
    // =======================================================

    this.obstacleManager.reset(
      0
    );

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

    // =======================================================
    // Stop Runtime
    // =======================================================

    this.running =
      false;

    // =======================================================
    // M10.7.2 / M11.8.8
    // Runtime Profile Cleanup
    // =======================================================

    this.runtimeProfileBridge
      .dispose();

    this.profileManager
      .dispose();

    // =======================================================
    // Clock
    // =======================================================

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
