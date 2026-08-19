import * as THREE from "three";

import { World } from "../world/World";
import { PlayerCar } from "../player/PlayerCar";
import { CarController } from "../player/CarController";
import { SwipeController } from "../player/SwipeController";

import { TrafficManager } from "../traffic/TrafficManager";
import { TrafficCollisionSystem } from "../collision/TrafficCollisionSystem";

import { RaceHUD } from "../ui/RaceHUD";

import { EconomyManager } from "../economy/EconomyManager";
import { CoinSpawner } from "../economy/CoinSpawner";

import { GarageManager } from "../garage/GarageManager";
import { UpgradeSystem } from "../garage/UpgradeSystem";

import { SaveSystem } from "../save/SaveSystem";

import {
  type PlayerSaveData,
  type PlayerProgress,
  PLAYER_SAVE_VERSION,
  DEFAULT_PLAYER_PROGRESS,
  createDefaultPlayerSaveData,
  isValidPlayerSaveData
} from "../save/PlayerSaveData";

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
  // Economy
  // =========================================================

  private readonly economyManager:
    EconomyManager;

  private readonly coinSpawner:
    CoinSpawner;

  // =========================================================
  // Garage
  // =========================================================

  /*
   * GarageManager owns:
   * - owned cars
   * - selected car
   * - car unlocks
   */
  private readonly garageManager:
    GarageManager;

  // =========================================================
  // Upgrade System
  // =========================================================

  /*
   * UpgradeSystem owns:
   * - speed upgrades
   * - acceleration upgrades
   * - handling upgrades
   * - upgraded car stats
   */
  private readonly upgradeSystem:
    UpgradeSystem;

  // =========================================================
  // Save System
  // =========================================================

  /*
   * M4.9.1 connects the persistent
   * SaveSystem to the engine.
   *
   * SaveSystem owns browser storage.
   * RaceNovaEngine does not directly
   * access localStorage.
   */
  private readonly saveSystem:
    SaveSystem;

  // =========================================================
  // Player Save / Progress
  // =========================================================

  /*
   * Player progress remains owned by
   * RaceNovaEngine for now.
   *
   * SaveSystem persists the complete
   * PlayerSaveData structure.
   */
  private playerProgress:
    PlayerProgress = {
      ...DEFAULT_PLAYER_PROGRESS
    };

  // =========================================================
  // HUD
  // =========================================================

  private readonly raceHUD:
    RaceHUD;

  // =========================================================
  // Constructor
  // =========================================================

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
    // Economy Manager
    // =====================================================

    /*
     * EconomyManager must be created before
     * GarageManager and UpgradeSystem because
     * both depend on the economy.
     */
    this.economyManager =
      new EconomyManager({
        initialCoins: 0
      });

    // =====================================================
    // Garage Manager
    // =====================================================

    this.garageManager =
      new GarageManager(
        this.economyManager
      );

    // =====================================================
    // Upgrade System
    // =====================================================

    this.upgradeSystem =
      new UpgradeSystem(
        this.economyManager
      );

    // =====================================================
    // Save System
    // =====================================================

    /*
     * M4.9.1
     *
     * SaveSystem receives the existing
     * authoritative manager instances.
     *
     * No gameplay system is replaced.
     */
    this.saveSystem =
      new SaveSystem(
        this.economyManager,
        this.garageManager,
        this.upgradeSystem
      );

    // =====================================================
    // Restore Persistent Save
    // =====================================================

    /*
     * IMPORTANT:
     *
     * Load BEFORE creating PlayerCar.
     *
     * This allows restored Garage +
     * Upgrade state to determine the
     * selected car's initial stats.
     *
     * If no save exists, the default
     * manager states remain unchanged.
     */
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

    // =====================================================
    // Selected Car Stats
    // =====================================================

    /*
     * M4.8 connects the authoritative garage
     * and upgrade data to the initial PlayerCar.
     *
     * Because SaveSystem has already loaded
     * the persistent state above, these stats
     * now reflect the restored state.
     */
    const selectedCar =
      this.garageManager.getSelectedCar();

    const selectedCarStats =
      this.upgradeSystem.getStats(
        selectedCar.id
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

        maxSpeed:
          selectedCarStats.maxSpeed,

        acceleration:
          selectedCarStats.acceleration,

        /*
         * Keep the previous 180 minimum cap
         * while allowing faster cars to use
         * their higher base max speed.
         */
        hardSpeedCap:
          Math.max(
            180,
            selectedCarStats.maxSpeed
          ),

        /*
         * Nitro is allowed above normal
         * max speed but remains inside
         * the hard speed cap.
         */
        nitroSpeed:
          Math.min(
            selectedCarStats.maxSpeed +
              37,
            Math.max(
              180,
              selectedCarStats.maxSpeed
            )
          ),

        nitroDuration: 3
      });

    this.playerCar.addToScene(
      this.scene
    );

    // =====================================================
    // Coin Spawner
    // =====================================================

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
            )
        }
      );

    // =====================================================
    // Race HUD
    // =====================================================

    this.raceHUD =
      new RaceHUD(
        this.playerCar,
        () => {
          this.activateNitro();
        },
        this.economyManager
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

    this.trafficCollisionSystem.update(
      this.trafficManager.getTrafficCars()
    );

    // =====================================================
    // Coin System
    // =====================================================

    if (
      !this.trafficCollisionSystem.hasCrashed()
    ) {
      this.coinSpawner.update(
        deltaTime,
        playerPosition
      );
    }

    // =====================================================
    // Player Progress
    // =====================================================

    /*
     * Distance travelled is tracked in
     * world units converted from the
     * player's actual movement.
     */
    const speed =
      this.playerCar.getSpeed();

    if (
      Number.isFinite(speed) &&
      speed > 0
    ) {
      this.playerProgress.totalDistance +=
        (speed / 3.6) *
        deltaTime;
    }

    // =====================================================
    // HUD
    // =====================================================

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
  // Economy Access
  // =========================================================

  public getCoinBalance(): number {
    return this.economyManager.getCoins();
  }

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
  // Player Progress
  // =========================================================

  public getPlayerProgress():
    PlayerProgress {
    return {
      ...this.playerProgress
    };
  }

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

    this.playerProgress = {
      unlockedLevel:
        Math.max(
          1,
          Math.floor(
            Number.isFinite(
              progress.unlockedLevel
            )
              ? progress.unlockedLevel
              : 1
          )
        ),

      racesCompleted:
        Math.max(
          0,
          Math.floor(
            Number.isFinite(
              progress.racesCompleted
            )
              ? progress.racesCompleted
              : 0
          )
        ),

      racesWon:
        Math.max(
          0,
          Math.floor(
            Number.isFinite(
              progress.racesWon
            )
              ? progress.racesWon
              : 0
          )
        ),

      totalDistance:
        Math.max(
          0,
          Number.isFinite(
            progress.totalDistance
          )
            ? progress.totalDistance
            : 0
        )
    };
  }

  // =========================================================
  // M4.8 Save Snapshot
  // =========================================================

  /*
   * Creates the complete in-memory
   * PlayerSaveData structure.
   *
   * M4.9.1 keeps this method for
   * compatibility with existing callers.
   *
   * No direct localStorage access.
   * No network.
   * No Pi.
   */
  public getPlayerSaveData():
    PlayerSaveData {
    const save =
      createDefaultPlayerSaveData(
        this.economyManager.getState(),
        this.garageManager.getState(),
        this.upgradeSystem.getState()
      );

    return {
      ...save,

      version:
        PLAYER_SAVE_VERSION,

      progress: {
        ...this.playerProgress
      },

      updatedAt:
        Date.now()
    };
  }

  // =========================================================
  // M4.9.1 Save
  // =========================================================

  /*
   * Persists the current complete
   * player state through SaveSystem.
   *
   * PlayerProgress is supplied separately
   * because SaveSystem owns Economy +
   * Garage + Upgrade restoration while
   * RaceNovaEngine owns runtime progress.
   */
  public savePlayerData(): boolean {
    return this.saveSystem.save({
      ...this.playerProgress
    });
  }

  // =========================================================
  // M4.8 Load Snapshot
  // =========================================================

  /*
   * Restores Economy + Garage +
   * Upgrades + Player Progress.
   *
   * Kept for compatibility with existing
   * callers that already provide a
   * PlayerSaveData object.
   *
   * New persistence code should prefer
   * SaveSystem.load().
   */
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

    const economyLoaded =
      this.economyManager.loadState(
        save.economy
      );

    if (!economyLoaded) {
      return false;
    }

    const garageLoaded =
      this.garageManager.loadState(
        save.garage
      );

    if (!garageLoaded) {
      return false;
    }

    const upgradesLoaded =
      this.upgradeSystem.loadState(
        save.upgrades
      );

    if (!upgradesLoaded) {
      return false;
    }

    this.setPlayerProgress(
      save.progress
    );

    return true;
  }

  // =========================================================
  // M4.9.1 Load
  // =========================================================

  /*
   * Loads persistent player data
   * through the authoritative SaveSystem.
   *
   * SaveSystem handles:
   * - localStorage
   * - validation
   * - version checking
   * - Economy restoration
   * - Garage restoration
   * - Upgrade restoration
   *
   * RaceNovaEngine restores its own
   * PlayerProgress from the validated
   * save snapshot.
   */
  public loadPlayerData(): boolean {
    const loaded =
      this.saveSystem.load();

    if (!loaded) {
      return false;
    }

    const savedData =
      this.saveSystem.readSave();

    if (!savedData) {
      return false;
    }

    this.setPlayerProgress(
      savedData.progress
    );

    return true;
  }

  // =========================================================
  // Reset M4 State
  // =========================================================

  public resetPlayerData(): void {
    this.saveSystem.resetProgress();

    this.playerProgress = {
      ...DEFAULT_PLAYER_PROGRESS
    };
  }

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

    // -----------------------------------------------------
    // Coin / Economy
    // -----------------------------------------------------

    this.coinSpawner.dispose();

    this.economyManager.dispose();

    // -----------------------------------------------------
    // Garage / Upgrade
    // -----------------------------------------------------

    this.garageManager.reset();

    this.upgradeSystem.reset();

    // -----------------------------------------------------
    // Save System
    // -----------------------------------------------------

    this.saveSystem.dispose();

    // -----------------------------------------------------
    // Player / World
    // -----------------------------------------------------

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
  
