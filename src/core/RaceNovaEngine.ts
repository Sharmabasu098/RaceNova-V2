// ============================================================
// RaceNova V2
// RaceNovaEngine.ts
// M8.3.2 FINAL — PART 1/4
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

// ============================================================
// RaceNova V2 — ENGINE
// ============================================================

export class RaceNovaEngine {

  // ==========================================================
  // CORE — RENDERER
  // ==========================================================

  private readonly renderer:
    THREE.WebGLRenderer;

  // ==========================================================
  // CORE — SCENE
  // ==========================================================

  private readonly scene:
    THREE.Scene;

  // ==========================================================
  // CORE — CAMERA
  // ==========================================================

  private readonly camera:
    THREE.PerspectiveCamera;

  // ==========================================================
  // CORE — CLOCK
  // ==========================================================

  private readonly clock:
    THREE.Clock;

  // ==========================================================
  // AUDIO
  // ==========================================================

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

  // ==========================================================
  // AUDIO — UNLOCK
  // ==========================================================

  private handleAudioUnlock = (): void => {

    void this.audioManager
      .unlock()
      .then(() => {

        this.audioManager.startMusic();

      })
      .catch(() => {
      });

  };

  // ==========================================================
  // WORLD
  // ==========================================================

  private readonly world:
    World;

  // ==========================================================
  // ENVIRONMENT
  // ==========================================================

  private readonly environmentManager:
    EnvironmentManager;

  // ==========================================================
  // OBSTACLES
  // ==========================================================

  private readonly obstacleManager:
    ObstacleManager;

  private readonly obstacleCollisionSystem:
    ObstacleCollisionSystem;

  // ==========================================================
  // PLAYER
  // ==========================================================

  private readonly playerCar:
    PlayerCar;

  private readonly carController:
    CarController;

  private readonly swipeController:
    SwipeController;

  // ==========================================================
  // TRAFFIC
  // ==========================================================

  private readonly trafficManager:
    TrafficManager;

  private readonly trafficCollisionSystem:
    TrafficCollisionSystem;

  // ==========================================================
  // ECONOMY
  // ==========================================================

  private readonly economyManager:
    EconomyManager;

  private readonly coinSpawner:
    CoinSpawner;

  // ==========================================================
  // GARAGE
  // ==========================================================

  private readonly garageManager:
    GarageManager;

  private readonly upgradeSystem:
    UpgradeSystem;

  // ==========================================================
  // SAVE SYSTEM
  // ==========================================================

  private readonly saveSystem:
    SaveSystem;

  // ==========================================================
  // PLAYER PROGRESS
  // ==========================================================

  private playerProgress:
    PlayerProgress =
      createDefaultPlayerProgress(
        RACE_DEFINITIONS
      );

  // ==========================================================
  // UI — RACE HUD
  // ==========================================================

  private readonly raceHUD:
    RaceHUD;

  // ==========================================================
  // UI — RACE RESULT
  // ==========================================================

  private readonly raceResult:
    RaceResult;

  private readonly raceResultUI:
    RaceResultUI;

  // ==========================================================
  // UI — GARAGE
  // ==========================================================

  private readonly garageUI:
    Garage;

  // ==========================================================
  // UI — UPGRADE
  // ==========================================================

  private readonly upgradeScreen:
    UpgradeScreen;

  // ==========================================================
  // BOSS SYSTEM
  // ==========================================================

  private readonly bossManager:
    BossManager;

  private readonly bossRace:
    BossRace;

  // ==========================================================
  // BOSS UNLOCK CONFIG
  // ==========================================================

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

  // ==========================================================
  // BOSS 3D MODEL
  // ==========================================================

  private readonly bossMesh:
    THREE.Group;

  private bossEncounterStarted:
    boolean = false;

  // ==========================================================
  // NORMAL RACE STATE
  // ==========================================================

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

  // ==========================================================
  // M8.3.2 — NORMAL RACE FINISH DISTANCE
  // ==========================================================

  private readonly normalRaceFinishDistance:
    number = 1500;

  // ==========================================================
  // ENGINE RUNNING STATE
  // ==========================================================

  private running:
    boolean = false;

  // ==========================================================
  // CONSTRUCTOR
  // ==========================================================

  constructor(
    container: HTMLElement
  ) {

    // ========================================================
    // CORE — SCENE
    // ========================================================

    this.scene =
      new THREE.Scene();

    this.scene.background =
      new THREE.Color(
        0x87ceeb
      );

    // ========================================================
    // CORE — CAMERA
    // ========================================================

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

    // ========================================================
    // CORE — RENDERER
    // ========================================================

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

    // ========================================================
    // CORE — CLOCK
    // ========================================================

    this.clock =
      new THREE.Clock();

    // ========================================================
    // AUDIO — INITIALIZE
    // ========================================================

    this.audioManager =
      new AudioManager();

    this.audioManager.initialize();

    // ========================================================
    // CORE — LIGHTING
    // ========================================================

    this.setupLighting();

    // ========================================================
    // WORLD — ROAD
    // ========================================================

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

    // ========================================================
    // ENVIRONMENT MANAGER
    // ========================================================

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

    // ========================================================
    // OBSTACLE MANAGER
    // ========================================================

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

    // ========================================================
    // ECONOMY MANAGER
    // ========================================================

    this.economyManager =
      new EconomyManager({

        initialCoins:
          0

      });

    // ========================================================
    // GARAGE MANAGER
    // ========================================================

    this.garageManager =
      new GarageManager(
        this.economyManager
      );

    // ========================================================
    // UPGRADE SYSTEM
    // ========================================================

    this.upgradeSystem =
      new UpgradeSystem(
        this.economyManager
      );

    // ========================================================
    // SAVE SYSTEM
    // ========================================================

    this.saveSystem =
      new SaveSystem(
        this.economyManager,
        this.garageManager,
        this.upgradeSystem
      );

    // ========================================================
    // LOAD SAVED PLAYER DATA
    // ========================================================

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

    // ========================================================
    // SELECTED CAR
    // ========================================================

    const selectedCar =
      this.garageManager
        .getSelectedCar();

    const selectedCarStats =
      this.upgradeSystem.getStats(
        selectedCar.id
      );

    // ========================================================
    // PLAYER CAR
    // ========================================================

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

    // ========================================================
    // M7.9 — OBSTACLE COLLISION SYSTEM
    // ========================================================

    this.obstacleCollisionSystem =
      new ObstacleCollisionSystem(

        this.playerCar,

        this.obstacleManager,

        {
          impactStunDuration:
            0.75
        }

      );

    // ========================================================
    // M4.9 — COIN SPAWNER
    // ========================================================

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

    // ========================================================
    // RACE HUD
    // ========================================================

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

    // ========================================================
    // RACE RESULT DATA
    // ========================================================

    this.raceResult =
      new RaceResult();

    // ========================================================
    // RACE RESULT UI
    // ========================================================

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

    // ========================================================
    // GARAGE UI
    // ========================================================

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
              carId: string
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

    // ========================================================
    // UPGRADE SCREEN
    // ========================================================

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

    // ========================================================
    // CAR CONTROLLER
    // ========================================================

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

    // ========================================================
    // SWIPE CONTROLLER
    // ========================================================

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

    // ========================================================
    // TRAFFIC MANAGER
    // ========================================================

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

    // ========================================================
    // TRAFFIC COLLISION
    // ========================================================

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

    // ========================================================
    // BOSS MANAGER
    // ========================================================

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

    // ========================================================
    // BOSS RACE
    // ========================================================

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

    // ========================================================
    // BOSS 3D MESH
    // ========================================================

    this.bossMesh =
      this.createBossMesh();

    this.bossMesh.visible =
      false;

    this.scene.add(
      this.bossMesh
    );

    // ========================================================
    // BOSS GLB LOAD
    // ========================================================

    void this.loadBossModel();

    // ========================================================
    // AUDIO UNLOCK EVENT
    // ========================================================

    window.addEventListener(

      "pointerdown",

      this.handleAudioUnlock,

      {
        once: true
      }

    );

    // ========================================================
    // NITRO KEY EVENT
    // ========================================================

    window.addEventListener(

      "keydown",

      this.handleNitroKeyDown

    );

    // ========================================================
    // RESIZE EVENT
    // ========================================================

    window.addEventListener(

      "resize",

      this.handleResize

    );

    // ========================================================
    // INITIAL HUD
    // ========================================================

    this.raceHUD.update();

  }

  // ============================================================
// RaceNovaEngine.ts — PART 2/4
// M8.3.2 — BOSS + NITRO + GAME LOOP
// ============================================================


// ============================================================
// M8.1 — BOSS 3D MESH CREATION
// ============================================================

private createBossMesh(): THREE.Group {

  const group =
    new THREE.Group();

  return group;
}


// ============================================================
// M8.1 — BOSS MODEL LOADER
// ============================================================

private async loadBossModel(): Promise<void> {

  const loader =
    new GLTFLoader();

  const modelUrl =
    "/RaceNova-V2/assets/cars/bosscar.glb";

  try {

    const gltf =
      await loader.loadAsync(modelUrl);

    const model =
      gltf.scene;

    model.traverse(
      (object) => {

        if (
          object instanceof THREE.Mesh
        ) {

          object.castShadow = true;
          object.receiveShadow = true;

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


    // ========================================================
    // M8.1 — BOSS MODEL SCALE
    // ========================================================

    const box =
      new THREE.Box3()
        .setFromObject(model);

    const size =
      new THREE.Vector3();

    box.getSize(size);

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


    // ========================================================
    // M8.1 — BOSS MODEL CENTERING
    // ========================================================

    const scaledBox =
      new THREE.Box3()
        .setFromObject(model);

    const center =
      new THREE.Vector3();

    scaledBox.getCenter(center);

    model.position.x -=
      center.x;

    model.position.z -=
      center.z;


    // ========================================================
    // M8.1 — BOSS MODEL FLOOR ALIGNMENT
    // ========================================================

    const finalBox =
      new THREE.Box3()
        .setFromObject(model);

    model.position.y -=
      finalBox.min.y;


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
// M8.1 — UPDATE BOSS 3D POSITION
// ============================================================

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


  // ==========================================================
  // M8.1 — ROAD CENTER ALIGNMENT
  // ==========================================================

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
// M8.1 — BOSS UNLOCK CHECK
// ============================================================

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


// ============================================================
// M8.1 — BOSS ENCOUNTER RESTRICTION
// Boss can start ONLY on a Boss campaign race.
// ============================================================

private startBossEncounter(
  playerZ: number
): void {

  if (
    this.bossEncounterStarted
  ) {

    return;

  }


  if (
    !Number.isFinite(playerZ)
  ) {

    return;

  }


  // ==========================================================
  // M8.1 — GET SELECTED RACE
  // ==========================================================

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


  // ==========================================================
  // M8.1 — GET RACE DEFINITION
  // ==========================================================

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


  // ==========================================================
  // M8.1 — IMPORTANT
  // RaceProgress DOES NOT contain isBoss.
  // isBoss comes from RaceDefinition.
  // ==========================================================

  if (
    !selectedRaceDefinition.isBoss
  ) {

    return;

  }


  // ==========================================================
  // M8.1 — BOSS UNLOCK REQUIREMENT
  // ==========================================================

  if (
    !this.isBossUnlocked()
  ) {

    return;

  }


  // ==========================================================
  // M8.1 — START BOSS RACE
  // ==========================================================

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
// M7.1 — NITRO ACTIVATION
// ============================================================

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


// ============================================================
// M7.1 — NITRO KEY HANDLER
// ============================================================

private handleNitroKeyDown =
  (event: KeyboardEvent): void => {

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
// CORE — LIGHTING SETUP
// ============================================================

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


// ============================================================
// CORE — START GAME
// ============================================================

public start(): void {

  if (
    this.running
  ) {

    return;

  }


  // ==========================================================
  // M8.2 — RESET ALL RACE STATE
  // ==========================================================

  this.resetRaceState();


  // ==========================================================
  // M8.3.2 — START NORMAL RACE
  // This initializes the 1500m race distance.
  // ==========================================================

  this.startNormalRace();


  this.running =
    true;


  this.clock.start();


  this.animate();

}


// ============================================================
// CORE — ANIMATION LOOP
// ============================================================

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


// ============================================================
// CORE — MAIN UPDATE LOOP
// ============================================================

private update(
  deltaTime: number
): void {

  if (
    !Number.isFinite(
      deltaTime
    ) ||
    deltaTime <= 0
  ) {

    return;

  }


  // ==========================================================
  // TRAFFIC CRASH STATE
  // ==========================================================

  const trafficCrashed =
    this.trafficCollisionSystem
      .hasCrashed();


  // ==========================================================
  // PLAYER MOVEMENT
  // ==========================================================

  if (
    !trafficCrashed &&
    !this.obstacleCollisionSystem
      .isFrozen()
  ) {

    this.playerCar.update(
      deltaTime
    );

  }


  // ==========================================================
  // PLAYER LANE CONTROL
  // ==========================================================

  this.carController.update(
    deltaTime
  );


  // ==========================================================
  // PLAYER POSITION
  // ==========================================================

  const playerPosition =
    this.playerCar.getPosition();

  const playerZ =
    playerPosition.z;


  // ==========================================================
  // WORLD UPDATE
  // ==========================================================

  this.world.update(
    playerZ
  );


  // ==========================================================
  // ENVIRONMENT UPDATE
  // ==========================================================

  this.environmentManager.update(
    playerZ
  );


  // ==========================================================
  // OBSTACLE UPDATE
  // ==========================================================

  this.obstacleManager.update(
    playerZ
  );


  // ==========================================================
  // OBSTACLE COLLISION
  // ==========================================================

  this.obstacleCollisionSystem.update(
    deltaTime
  );


  // ==========================================================
  // TRAFFIC UPDATE
  // ==========================================================

  this.trafficManager.update(
    deltaTime,
    playerZ
  );


  // ==========================================================
  // TRAFFIC COLLISION
  // IMPORTANT:
  // TrafficCollisionSystem.update() takes ONE argument.
  // ==========================================================

  this.trafficCollisionSystem.update(
    this.trafficManager.getTrafficCars()
  );


  // ==========================================================
  // TRAFFIC CRASH DETECTION
  // ==========================================================

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


  // ==========================================================
  // TRAFFIC CRASH → STOP GAME
  // ==========================================================

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


  // ==========================================================
  // COIN UPDATE
  // ==========================================================

  if (
    !nowTrafficCrashed
  ) {

    this.coinSpawner.update(
      deltaTime,
      playerPosition
    );

  }


  // ==========================================================
  // M8.1 — START BOSS ENCOUNTER
  // ==========================================================

  if (
    !this.bossEncounterStarted
  ) {

    this.startBossEncounter(
      playerZ
    );

  }


  // ==========================================================
  // M8.1 — BOSS RACE UPDATE
  // ==========================================================

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


  // ==========================================================
  // M8.1 — BOSS DEFEAT SOUND
  // ==========================================================

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


  // ==========================================================
  // M8.1 — BOSS COMPLETE SOUND
  // ==========================================================

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


  // ==========================================================
  // M8.1 — BOSS FAIL SOUND
  // ==========================================================

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


  // ==========================================================
  // M8.1 — RECORD BOSS DEFEAT
  // ==========================================================

  if (
    this.bossRace.isBossDefeated()
  ) {

    this.recordBossDefeat();

  }


  // ==========================================================
  // M8.1 — UPDATE BOSS 3D
  // ==========================================================

  this.updateBoss3D();


  // ==========================================================
  // CORE — TOTAL DISTANCE
  // ==========================================================

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
        (currentSpeed / 3.6) *
        deltaTime;

  }


  // ==========================================================
  // M8.3.2 — NORMAL RACE DISTANCE
  // ==========================================================

  if (
    this.normalRaceStarted &&
    !this.normalRaceCompleted &&
    !nowTrafficCrashed
  ) {

    this.updateNormalRace(
      deltaTime
    );

  }


  // ==========================================================
  // HUD — DISTANCE
  // ==========================================================

  this.raceHUD.setRaceDistance(
    this.normalRaceDistance,
    this.normalRaceFinishDistance,
    this.normalRaceStarted &&
      !this.normalRaceCompleted
  );


  // ==========================================================
  // HUD — UPDATE
  // ==========================================================

  this.raceHUD.update();


  // ==========================================================
  // CAMERA FOLLOW
  // ==========================================================

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
// RaceNovaEngine.ts — PART 3/4
// M8.3.2 — NORMAL RACE + 1500m FINISH
// M8.3 — RACE RESULT + NEXT RACE
// ============================================================


// ============================================================
// M8.3.2 — START NORMAL RACE
// ============================================================

private startNormalRace(): void {

  const progression =
    this.playerProgress
      .raceProgression;


  // ==========================================================
  // M8.3.2 — FIND SELECTED RACE
  // ==========================================================

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


  // ==========================================================
  // M8.1 — BOSS RACE CANNOT START AS NORMAL RACE
  // ==========================================================

  if (
    !selectedRace ||
    !selectedRaceDefinition ||
    selectedRaceDefinition.isBoss ||
    selectedRace.status === "locked"
  ) {

    // ========================================================
    // M8.3.2 — FALLBACK TO FIRST AVAILABLE NON-BOSS RACE
    // ========================================================

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


  // ==========================================================
  // M8.3.2 — FINAL VALIDATION
  // ==========================================================

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


  // ==========================================================
  // M8.3.2 — INITIALIZE NORMAL RACE
  // ==========================================================

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


  // ==========================================================
  // M8.3.2 — RESET HUD DISTANCE
  // ==========================================================

  this.raceHUD.setRaceDistance(
    0,
    this.normalRaceFinishDistance,
    true
  );


  this.raceHUD.update();

}


// ============================================================
// M8.3.2 — UPDATE NORMAL RACE
// ============================================================
//
// Distance is calculated from the player's real gameplay speed.
//
// PlayerCar speed is km/h.
// Convert km/h → metres/second:
// km/h ÷ 3.6
//
// Finish distance = 1500 metres.
// ============================================================

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


  // ==========================================================
  // M8.3.2 — GET REAL PLAYER SPEED
  // ==========================================================

  const speed =
    this.playerCar.getSpeed();


  if (
    Number.isFinite(speed) &&
    speed > 0
  ) {

    const metresPerSecond =
      speed / 3.6;


    this.normalRaceDistance +=
      metresPerSecond *
      deltaTime;

  }


  // ==========================================================
  // M8.3.2 — RACE TIMER
  // ==========================================================

  this.normalRaceTime +=
    deltaTime;


  // ==========================================================
  // M8.3.2 — CLAMP DISTANCE
  // ==========================================================

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


  // ==========================================================
  // M8.3.2 — 1500m FINISH CHECK
  // ==========================================================

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
// M8.3 — NORMAL RACE FINISH
// ============================================================

private finishNormalRace(): void {

  if (
    !this.normalRaceStarted ||
    this.normalRaceCompleted
  ) {

    return;

  }


  // ==========================================================
  // M8.3 — CAPTURE RESULT DATA
  // ==========================================================

  const completedRaceId =
    this.normalRaceId;


  const completedRaceTime =
    this.normalRaceTime;


  const completedDistance =
    this.normalRaceDistance;


  // ==========================================================
  // M8.3 — MARK RACE COMPLETED
  // ==========================================================

  this.normalRaceCompleted =
    true;


  // ==========================================================
  // M8.3 — RACE COMPLETE SOUND
  // ==========================================================

  if (
    !this.normalRaceCompleteSoundPlayed
  ) {

    this.normalRaceCompleteSoundPlayed =
      true;


    this.audioManager.playSFX(
      "raceComplete"
    );

  }


  // ==========================================================
  // M8.3 — SAVE RACE PROGRESS
  // ==========================================================

  this.completeRace(
    completedRaceId,
    true,
    1,
    completedRaceTime
  );


  // ==========================================================
  // M8.3 — ADVANCE PROGRESSION
  // ==========================================================

  this.advanceToNextRace();


  this.normalRaceStarted =
    false;


  // ==========================================================
  // M8.3 — GET NEXT RACE
  // ==========================================================

  const nextRaceId =
    this.getNextRaceId(
      completedRaceId
    );


  // ==========================================================
  // M8.3 — CREATE RACE RESULT
  // ==========================================================

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


  // ==========================================================
  // M8.3 — STOP GAME LOOP
  // ==========================================================

  this.running =
    false;


  this.clock.stop();


  // ==========================================================
  // M8.3 — SHOW RESULT SCREEN
  // ==========================================================

  this.raceResultUI.show(
    this.raceResult.get()
  );

}


// ============================================================
// M8.3 — ADVANCE TO NEXT RACE
// ============================================================

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


  // ==========================================================
  // M8.3 — UNLOCK NEXT RACE
  // ==========================================================

  if (
    nextRace.status ===
    "locked"
  ) {

    nextRace.status =
      "available";

  }


  progression.selectedRaceId =
    nextRace.raceId;


  this.playerProgress
    .selectedRaceId =
      nextRace.raceId;


  // ==========================================================
  // M8.3 — SAVE PROGRESSION
  // ==========================================================

  this.savePlayerData();

}


// ============================================================
// M8.3 — GET NEXT RACE ID
// ============================================================

private getNextRaceId(
  raceId: string
): string | null {

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
// CORE — RESIZE HANDLER
// ============================================================

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


  // ==========================================================
  // CORE — CAMERA ASPECT
  // ==========================================================

  this.camera.aspect =
    width / height;


  this.camera.updateProjectionMatrix();


  // ==========================================================
  // CORE — RENDERER SIZE
  // ==========================================================

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
// PUBLIC API — GARAGE
// ============================================================

public getGarageManager():
  GarageManager {

  return this.garageManager;

}


// ============================================================
// PUBLIC API — OPEN GARAGE
// ============================================================

public openGarage(): void {

  this.garageUI.open();

}


// ============================================================
// PUBLIC API — CLOSE GARAGE
// ============================================================

public closeGarage(): void {

  this.garageUI.hide();

}


// ============================================================
// PUBLIC API — GARAGE STATE
// ============================================================

public isGarageOpen(): boolean {

  return this.garageUI.isVisible();

}


// ============================================================
// PUBLIC API — OPEN UPGRADES
// ============================================================

public openUpgrades(): void {

  this.upgradeScreen.open();

}


// ============================================================
// PUBLIC API — CLOSE UPGRADES
// ============================================================

public closeUpgrades(): void {

  this.upgradeScreen.hide();

}


// ============================================================
// PUBLIC API — UPGRADE SCREEN STATE
// ============================================================

public isUpgradeScreenOpen(): boolean {

  return this.upgradeScreen.isVisible();

}


// ============================================================
// PUBLIC API — SELECTED CAR
// ============================================================

public getSelectedCarId(): string {

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
// RaceNovaEngine.ts — PART 4/4
// M8.2 — RESET
// M8.3 — SAVE + PROGRESSION
// CORE — PUBLIC STATE
// DISPOSE
// ============================================================


// ============================================================
// PUBLIC API — BOSS MANAGER
// ============================================================

public getBossManager():
  BossManager {

  return this.bossManager;

}


// ============================================================
// PUBLIC API — BOSS RACE
// ============================================================

public getBossRace():
  BossRace {

  return this.bossRace;

}


// ============================================================
// PUBLIC API — BOSS ACTIVE STATE
// ============================================================

public isBossActive(): boolean {

  return this.bossManager.isActive();

}


// ============================================================
// PUBLIC API — BOSS POSITION
// ============================================================

public getBossPosition():
  { x: number; z: number } | null {

  return this.bossManager.getPosition();

}


// ============================================================
// PUBLIC API — GET PLAYER PROGRESS
// ============================================================

public getPlayerProgress():
  PlayerProgress {

  return {

    ...this.playerProgress,

    raceProgression: {

      ...this.playerProgress
        .raceProgression,

      races:
        this.playerProgress
          .raceProgression
          .races
          .map(
            (race) => ({
              ...race
            })
          )

    }

  };

}


// ============================================================
// PUBLIC API — SET PLAYER PROGRESS
// ============================================================

public setPlayerProgress(
  progress: PlayerProgress
): void {

  if (
    !progress ||
    typeof progress !== "object"
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

      ...normalized
        .raceProgression,

      races:
        normalized
          .raceProgression
          .races
          .map(
            (race) => ({
              ...race
            })
          )

    }

  };


  // ==========================================================
  // M8.3 — REFRESH HUD AFTER PROGRESS CHANGE
  // ==========================================================

  this.raceHUD.update();

}


// ============================================================
// M8.2 — RESET RACE STATE
// ============================================================
//
// IMPORTANT:
// This resets the CURRENT RACE state only.
//
// Persistent player data such as:
// - coins
// - unlocked cars
// - upgrades
// - campaign progress
//
// is NOT deleted here.
// ============================================================

public resetRaceState(): void {

  // ==========================================================
  // CORE — STOP GAME LOOP
  // ==========================================================

  this.running =
    false;


  this.clock.stop();


  // ==========================================================
  // M8.3 — RESET RESULT SCREEN
  // ==========================================================

  this.raceResultUI.hide();

  this.raceResult.reset();


  // ==========================================================
  // PLAYER — RESET POSITION
  // ==========================================================

  this.playerCar.stop();

  this.playerCar.setX(
    0
  );

  this.playerCar.setZ(
    0
  );


  // ==========================================================
  // M8.2 — RESET ENVIRONMENT
  // ==========================================================

  this.environmentManager.reset(
    0
  );


  // ==========================================================
  // TRAFFIC COLLISION RESET
  // ==========================================================

  this.trafficCollisionSystem.reset();


  // ==========================================================
  // TRAFFIC RESET
  // ==========================================================

  this.trafficManager.clear();


  // ==========================================================
  // OBSTACLE COLLISION RESET
  // ==========================================================

  this.obstacleCollisionSystem.reset();


  // ==========================================================
  // OBSTACLE RESET
  // ==========================================================

  this.obstacleManager.reset(
    0
  );


  // ==========================================================
  // COIN RESET
  // ==========================================================

  this.coinSpawner.clear();


  // ==========================================================
  // BOSS RACE RESET
  // ==========================================================

  this.bossRace.reset();


  this.bossEncounterStarted =
    false;


  // ==========================================================
  // BOSS 3D RESET
  // ==========================================================

  this.bossMesh.visible =
    false;


  this.bossMesh.position.set(
    0,
    0,
    -80
  );


  this.bossMesh.rotation.y =
    Math.PI;


  // ==========================================================
  // M8.3.2 — NORMAL RACE RESET
  // ==========================================================

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


  // ==========================================================
  // AUDIO FLAGS RESET
  // ==========================================================

  this.crashSoundPlayed =
    false;

  this.bossDefeatSoundPlayed =
    false;

  this.bossCompleteSoundPlayed =
    false;

  this.bossFailSoundPlayed =
    false;

  this.normalRaceCompleteSoundPlayed =
    false;


  // ==========================================================
  // CAMERA RESET
  // ==========================================================

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


  // ==========================================================
  // HUD RESET
  // ==========================================================

  this.raceHUD.setRaceDistance(
    0,
    this.normalRaceFinishDistance,
    false
  );


  this.raceHUD.update();


  // ==========================================================
  // RENDER RESET STATE
  // ==========================================================

  this.renderer.render(
    this.scene,
    this.camera
  );

}


// ============================================================
// M8.3 — CREATE PLAYER SAVE DATA
// ============================================================

public getPlayerSaveData():
  PlayerSaveData {

  const saveData =
    createDefaultPlayerSaveData(
      this.economyManager,
      this.garageManager,
      this.upgradeSystem,
      RACE_DEFINITIONS
    );


  return {

    ...saveData,

    version:
      PLAYER_SAVE_VERSION,

    progress:
      this.getPlayerProgress(),

    updatedAt:
      Date.now()

  };

}


// ============================================================
// M8.3 — COMPLETE RACE
// ============================================================

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
      (item) =>
        item.raceId ===
        raceId
    );


  if (
    !race
  ) {

    return;

  }


  // ==========================================================
  // M8.3 — COMPLETION COUNT
  // ==========================================================

  race.completionCount +=
    1;


  // ==========================================================
  // M8.3 — WIN COUNT
  // ==========================================================

  if (
    won
  ) {

    race.winCount +=
      1;

  }


  // ==========================================================
  // M8.3 — BEST POSITION
  // ==========================================================

  if (
    Number.isFinite(position) &&
    position > 0
  ) {

    if (
      race.bestPosition <= 0 ||
      position <
        race.bestPosition
    ) {

      race.bestPosition =
        position;

    }

  }


  // ==========================================================
  // M8.3 — BEST TIME
  // ==========================================================

  if (
    Number.isFinite(time) &&
    time > 0
  ) {

    if (
      race.bestTime <= 0 ||
      time <
        race.bestTime
    ) {

      race.bestTime =
        time;

    }

  }


  // ==========================================================
  // M8.3 — MARK RACE COMPLETED
  // ==========================================================

  if (
    won
  ) {

    race.status =
      "completed";

  }


  // ==========================================================
  // M8.3 — UNLOCK FIRST LOCKED RACE
  // ==========================================================

  const nextLockedRace =
    progression.races.find(
      (item) =>
        item.status ===
        "locked"
    );


  if (
    nextLockedRace &&
    won
  ) {

    nextLockedRace.status =
      "available";

  }


  // ==========================================================
  // M8.3 — LEVEL 2 UNLOCK
  // ==========================================================

  if (
    this.playerProgress
      .racesCompleted >= 3 &&
    this.playerProgress
      .racesWon >= 2
  ) {

    if (
      this.playerProgress
        .unlockedLevel < 2
    ) {

      this.playerProgress
        .unlockedLevel = 2;

    }

  }


  // ==========================================================
  // M8.3 — RECALCULATE LEGACY PROGRESS
  // ==========================================================

  let racesCompleted =
    0;

  let racesWon =
    0;


  for (
    const item
    of progression.races
  ) {

    racesCompleted +=
      item.completionCount;

    racesWon +=
      item.winCount;

  }


  this.playerProgress
    .racesCompleted =
      racesCompleted;


  this.playerProgress
    .racesWon =
      racesWon;


  // ==========================================================
  // M8.3 — SAVE
  // ==========================================================

  this.savePlayerData();


  this.raceHUD.update();

}


// ============================================================
// M8.1 / M8.3 — RECORD BOSS DEFEAT
// ============================================================

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
      (item) =>
        item.raceId ===
        raceId
    );


  if (
    !race
  ) {

    return;

  }


  // ==========================================================
  // PREVENT DUPLICATE BOSS REWARDS/COUNTS
  // ==========================================================

  if (
    race.bossDefeated
  ) {

    return;

  }


  race.bossDefeated =
    true;


  this.playerProgress
    .bossesDefeated +=
      1;


  // ==========================================================
  // SAVE BOSS PROGRESS
  // ==========================================================

  this.savePlayerData();


  this.raceHUD.update();

}


// ============================================================
// M8.3 — SAVE PLAYER DATA
// ============================================================

public savePlayerData(): boolean {

  try {

    const progress =
      this.getPlayerProgress();


    return this.saveSystem.save({

      ...progress,

      raceProgression: {

        ...progress
          .raceProgression,

        races:
          progress
            .raceProgression
            .races
            .map(
              (race) => ({
                ...race
              })
            )

      }

    });

  } catch (
    error
  ) {

    console.error(
      "RaceNovaEngine: save failed",
      error
    );


    return false;

  }

}


// ============================================================
// M8.3 — LOAD PLAYER SAVE DATA
// ============================================================

public loadPlayerSaveData(
  save: PlayerSaveData
): boolean {

  if (
    !isValidPlayerSaveData(
      save
    )
  ) {

    return false;

  }


  try {

    this.economyManager
      .loadState(
        save.economy
      );


    this.garageManager
      .loadState(
        save.garage
      );


    this.upgradeSystem
      .loadState(
        save.upgrades
      );


    this.setPlayerProgress(
      save.progress
    );


    return true;

  } catch (
    error
  ) {

    console.error(
      "RaceNovaEngine: load save failed",
      error
    );


    return false;

  }

}


// ============================================================
// M8.3 — LOAD PLAYER DATA FROM SAVE SYSTEM
// ============================================================

public loadPlayerData(): boolean {

  try {

    const loaded =
      this.saveSystem.load();


    if (
      !loaded
    ) {

      return false;

    }


    const saveData =
      this.saveSystem.readSave();


    if (
      !saveData
    ) {

      return false;

    }


    return this.loadPlayerSaveData(
      saveData
    );

  } catch (
    error
  ) {

    console.error(
      "RaceNovaEngine: loadPlayerData failed",
      error
    );


    return false;

  }

}


// ============================================================
// M8.3 — RESET PLAYER DATA
// ============================================================
//
// WARNING:
// This is different from resetRaceState().
//
// resetRaceState():
//     resets only current race.
//
// resetPlayerData():
//     resets persistent player progress.
// ============================================================

public resetPlayerData(): void {

  this.saveSystem.resetProgress();


  this.playerProgress =
    createDefaultPlayerProgress(
      RACE_DEFINITIONS
    );


  this.resetRaceState();


  this.raceHUD.update();

}


// ============================================================
// CORE — DISPOSE
// ============================================================

public dispose(): void {

  // ==========================================================
  // CORE — STOP LOOP
  // ==========================================================

  this.running =
    false;


  this.clock.stop();


  // ==========================================================
  // CORE — REMOVE EVENT LISTENERS
  // ==========================================================

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


  // ==========================================================
  // AUDIO
  // ==========================================================

  this.audioManager.dispose();


  // ==========================================================
  // BOSS
  // ==========================================================

  this.bossRace.reset();

  this.bossRace.dispose();

  this.bossManager.dispose();


  // ==========================================================
  // BOSS MESH DISPOSAL
  // ==========================================================

  this.bossMesh.traverse(
    (object) => {

      if (
        object instanceof THREE.Mesh
      ) {

        object.geometry.dispose();


        if (
          Array.isArray(
            object.material
          )
        ) {

          object.material.forEach(
            (material) => {

              material.dispose();

            }
          );

        } else {

          object.material.dispose();

        }

      }

    }
  );


  this.scene.remove(
    this.bossMesh
  );


  // ==========================================================
  // PLAYER / CONTROL
  // ==========================================================

  this.swipeController.dispose();

  this.carController.dispose();


  // ==========================================================
  // TRAFFIC
  // ==========================================================

  this.trafficManager.dispose();

  this.trafficCollisionSystem.dispose();


  // ==========================================================
  // ECONOMY / COINS
  // ==========================================================

  this.coinSpawner.dispose();

  this.economyManager.dispose();


  // ==========================================================
  // GARAGE / UPGRADES
  // ==========================================================

  this.garageManager.reset();

  this.upgradeSystem.reset();


  // ==========================================================
  // SAVE SYSTEM
  // ==========================================================

  this.saveSystem.dispose();


  // ==========================================================
  // PLAYER
  // ==========================================================

  this.playerCar.dispose();


  // ==========================================================
  // WORLD
  // ==========================================================

  this.world.dispose();

  this.environmentManager.dispose();

  this.obstacleManager.dispose();


  // ==========================================================
  // UI
  // ==========================================================

  this.raceHUD.dispose();

  this.garageUI.dispose();

  this.upgradeScreen.dispose();

  this.raceResultUI.dispose();


  // ==========================================================
  // RENDERER
  // ==========================================================

  this.renderer.dispose();


  // ==========================================================
  // REMOVE CANVAS
  // ==========================================================

  const parent =
    this.renderer
      .domElement
      .parentElement;


  if (
    parent
  ) {

    parent.removeChild(
      this.renderer.domElement
    );

  }

}

     
