// ============================================================
// RaceNova V2
// RaceNovaEngine.ts
// M8.3.2 — PART 1/4
// CORE + PROPERTIES + CONSTRUCTOR
// ============================================================
//
// IMPORTANT:
// - This is PART 1/4.
// - Paste in order.
// - Do not add/remove braces.
// - Do not build until Parts 1–4 are complete.
//
// ============================================================

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


// ============================================================
// M8.3.2 — WORLD SYSTEM
// ============================================================

import { World } from "../world/World";

import {
  EnvironmentManager
} from "../world/EnvironmentManager";


// ============================================================
// M7.9 — OBSTACLE SYSTEM
// ============================================================

import {
  ObstacleManager
} from "../obstacles/ObstacleManager";


// ============================================================
// M5 — PLAYER SYSTEM
// ============================================================

import {
  PlayerCar
} from "../player/PlayerCar";

import {
  CarController
} from "../player/CarController";

import {
  SwipeController
} from "../player/SwipeController";


// ============================================================
// M5 — TRAFFIC SYSTEM
// ============================================================

import {
  TrafficManager
} from "../traffic/TrafficManager";

import {
  TrafficCollisionSystem
} from "../collision/TrafficCollisionSystem";

import {
  ObstacleCollisionSystem
} from "../collision/ObstacleCollisionSystem";


// ============================================================
// M8.3 — UI SYSTEM
// ============================================================

import {
  RaceHUD
} from "../ui/RaceHUD";

import {
  RaceResultUI
} from "../ui/RaceResult";

import {
  Garage
} from "../ui/Garage";

import {
  UpgradeScreen
} from "../ui/UpgradeScreen";


// ============================================================
// M4 — ECONOMY SYSTEM
// ============================================================

import {
  EconomyManager
} from "../economy/EconomyManager";

import {
  CoinSpawner
} from "../economy/CoinSpawner";


// ============================================================
// M4.9 — GARAGE / UPGRADE SYSTEM
// ============================================================

import {
  GarageManager
} from "../garage/GarageManager";

import {
  UpgradeSystem
} from "../garage/UpgradeSystem";


// ============================================================
// M4.9 — SAVE SYSTEM
// ============================================================

import {
  SaveSystem
} from "../save/SaveSystem";


// ============================================================
// M7.1 — AUDIO SYSTEM
// ============================================================

import {
  AudioManager
} from "../audio/AudioManager";


// ============================================================
// M6.9 — PLAYER PROGRESSION / SAVE DATA
// ============================================================

import {
  type PlayerSaveData,
  type PlayerProgress,
  PLAYER_SAVE_VERSION,
  createDefaultPlayerSaveData,
  createDefaultPlayerProgress,
  normalizePlayerProgress,
  isValidPlayerSaveData
} from "../save/PlayerSaveData";


// ============================================================
// M6.9 — RACE DEFINITIONS
// ============================================================

import {
  RACE_DEFINITIONS
} from "../race/RaceDefinitions";


// ============================================================
// M8.3 — RACE RESULT
// ============================================================

import {
  RaceResult
} from "../race/RaceResult";


// ============================================================
// M6.7 — BOSS SYSTEM
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


// ============================================================
// RaceNovaEngine
// ============================================================

export class RaceNovaEngine {

  // ==========================================================
  // M8.3.2 — CORE ENGINE OBJECTS
  // ==========================================================

  private readonly renderer:
    THREE.WebGLRenderer;

  private readonly scene:
    THREE.Scene;

  private readonly camera:
    THREE.PerspectiveCamera;

  private readonly clock:
    THREE.Clock;


  // ==========================================================
  // M7.1 — AUDIO STATE
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
  // M7.1 — AUDIO UNLOCK
  // ==========================================================

  private handleAudioUnlock = (): void => {

    void this.audioManager
      .unlock()
      .then(() => {

        this.audioManager
          .startMusic();

      })
      .catch(() => {

        // Browser audio policy may block
        // automatic audio playback.

      });

  };


  // ==========================================================
  // M8.2 — WORLD
  // ==========================================================

  private readonly world:
    World;


  // ==========================================================
  // M8.2 — ENVIRONMENT
  // ==========================================================

  private readonly environmentManager:
    EnvironmentManager;


  // ==========================================================
  // M7.9 — OBSTACLES
  // ==========================================================

  private readonly obstacleManager:
    ObstacleManager;

  private readonly obstacleCollisionSystem:
    ObstacleCollisionSystem;


  // ==========================================================
  // M5 — PLAYER
  // ==========================================================

  private readonly playerCar:
    PlayerCar;

  private readonly carController:
    CarController;

  private readonly swipeController:
    SwipeController;


  // ==========================================================
  // M5 — TRAFFIC
  // ==========================================================

  private readonly trafficManager:
    TrafficManager;

  private readonly trafficCollisionSystem:
    TrafficCollisionSystem;


  // ==========================================================
  // M4 — ECONOMY
  // ==========================================================

  private readonly economyManager:
    EconomyManager;

  private readonly coinSpawner:
    CoinSpawner;


  // ==========================================================
  // M4.9 — GARAGE
  // ==========================================================

  private readonly garageManager:
    GarageManager;


  // ==========================================================
  // M4.9 — UPGRADE SYSTEM
  // ==========================================================

  private readonly upgradeSystem:
    UpgradeSystem;


  // ==========================================================
  // M4.9 — SAVE SYSTEM
  // ==========================================================

  private readonly saveSystem:
    SaveSystem;


  // ==========================================================
  // M6.9 — PLAYER PROGRESS
  // ==========================================================

  private playerProgress:
    PlayerProgress =
      createDefaultPlayerProgress(
        RACE_DEFINITIONS
      );


  // ==========================================================
  // M8.3 — RACE HUD
  // ==========================================================

  private readonly raceHUD:
    RaceHUD;


  // ==========================================================
  // M8.3 — RACE RESULT SYSTEM
  // ==========================================================

  private readonly raceResult:
    RaceResult;

  private readonly raceResultUI:
    RaceResultUI;


  // ==========================================================
  // M8.3 — GARAGE UI
  // ==========================================================

  private readonly garageUI:
    Garage;


  // ==========================================================
  // M8.3 — UPGRADE UI
  // ==========================================================

  private readonly upgradeScreen:
    UpgradeScreen;


  // ==========================================================
  // M6.7 — BOSS MANAGER
  // ==========================================================

  private readonly bossManager:
    BossManager;


  // ==========================================================
  // M6.7 — BOSS RACE
  // ==========================================================

  private readonly bossRace:
    BossRace;


  // ==========================================================
  // M6.8.3 — BOSS UNLOCK CONFIG
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
  // M6.7.4 — BOSS 3D
  // ==========================================================

  private readonly bossMesh:
    THREE.Group;

  private bossEncounterStarted:
    boolean = false;


  // ==========================================================
  // M8.3.2 — NORMAL RACE STATE
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
  //
  // The road remains endless.
  // The race has a virtual 1500 metre finish.
  //

  private readonly normalRaceFinishDistance:
    number = 1500;


  // ==========================================================
  // M7.9.10 — ENGINE RUNTIME STATE
  // ==========================================================

  private running:
    boolean = false;


  // ==========================================================
  // M8.3.2 — CONSTRUCTOR
  // ==========================================================

  constructor(
    container: HTMLElement
  ) {


    // ========================================================
    // M8.3.2 — SCENE
    // ========================================================

    this.scene =
      new THREE.Scene();

    this.scene.background =
      new THREE.Color(
        0x87ceeb
      );


    // ========================================================
    // M8.3.2 — CAMERA
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
    // M8.3.2 — RENDERER
    // ========================================================

    this.renderer =
      new THREE.WebGLRenderer({

        antialias:
          true,

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
    // M8.3.2 — CLOCK
    // ========================================================

    this.clock =
      new THREE.Clock();


    // ========================================================
    // M7.1 — AUDIO INITIALIZATION
    // ========================================================

    this.audioManager =
      new AudioManager();

    this.audioManager.initialize();


    // ========================================================
    // M8.3.2 — LIGHTING
    // ========================================================

    this.setupLighting();


    // ========================================================
    // M8.2 — WORLD INITIALIZATION
    // ========================================================

    this.world =
      new World(

        this.scene,

        {

          roadWidth:
            12,

          roadSegmentLength:
            50,

          roadSegmentCount:
            24,

          laneCount:
            3,

          curveStrength:
            8,

          curveFrequency:
            0.008

        }

      );


    // ========================================================
    // M8.2 — ENVIRONMENT INITIALIZATION
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
    // M7.9 — OBSTACLE INITIALIZATION
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
    // M4 — ECONOMY INITIALIZATION
    // ========================================================

    this.economyManager =
      new EconomyManager({

        initialCoins:
          0

      });


    // ========================================================
    // M4.9 — GARAGE MANAGER
    // ========================================================

    this.garageManager =
      new GarageManager(

        this.economyManager

      );


    // ========================================================
    // M4.9 — UPGRADE SYSTEM
    // ========================================================

    this.upgradeSystem =
      new UpgradeSystem(

        this.economyManager

      );


    // ========================================================
    // M4.9 — SAVE SYSTEM
    // ========================================================

    this.saveSystem =
      new SaveSystem(

        this.economyManager,

        this.garageManager,

        this.upgradeSystem

      );


    // ========================================================
    // M4.9 — RESTORE SAVED DATA
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
    // M4.9 — SELECTED CAR
    // ========================================================

    const selectedCar =
      this.garageManager
        .getSelectedCar();

    const selectedCarStats =
      this.upgradeSystem.getStats(
        selectedCar.id
      );


    // ========================================================
    // M5 — PLAYER CAR
    // ========================================================

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

            selectedCarStats.maxSpeed +
              37,

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
    // M7.9.6 — OBSTACLE COLLISION
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
    // M4 — COIN SPAWNER
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
    // M8.3 — RACE HUD
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
    // M8.3 — RACE RESULT
    // ========================================================
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


    // ========================================================
    // M8.3 — GARAGE UI
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


    // ========================================================
    // M8.3 — UPGRADE SCREEN
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
    // M5 — CAR CONTROLLER
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
    // M5 — SWIPE CONTROLLER
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
    // M5 — TRAFFIC MANAGER
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
    // M5 — TRAFFIC COLLISION
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
    // M6.7 — BOSS MANAGER
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
    // M6.7 — BOSS RACE
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
    // M6.7.4 — BOSS 3D MESH
    // ========================================================

    this.bossMesh =
      this.createBossMesh();

    this.bossMesh.visible =
      false;

    this.scene.add(
      this.bossMesh
    );


    // ========================================================
    // M6.7.4 — LOAD BOSS MODEL
    // ========================================================

    void this.loadBossModel();


    // ========================================================
    // M7.1 — AUDIO UNLOCK EVENT
    // ========================================================

    window.addEventListener(

      "pointerdown",

      this.handleAudioUnlock,

      {
        once:
          true
      }

    );


    // ========================================================
    // M7.1 — NITRO KEY EVENT
    // ========================================================

    window.addEventListener(

      "keydown",

      this.handleNitroKeyDown

    );

          // ========================================================
    // M8.3.2 — RESIZE EVENT
    // ========================================================

    window.addEventListener(

      "resize",

      this.handleResize

    );


    // ========================================================
    // M8.3 — INITIAL HUD UPDATE
    // ========================================================

    this.raceHUD.update();

  }

   // ============================================================
// RaceNova V2
// RaceNovaEngine.ts
// M8.3.2 — PART 2/4
// BOSS + NITRO + START + UPDATE
// ============================================================


// ============================================================
// M8.1 — BOSS 3D MODEL CREATION
// ============================================================

private createBossMesh(): THREE.Group {

  const group =
    new THREE.Group();


  // ==========================================================
  // M8.1 — BOSS BODY
  // ==========================================================

  const bodyGeometry =
    new THREE.BoxGeometry(

      2.2,
      0.8,
      4.4

    );

  const bodyMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0x8b0000,

      roughness:
        0.55,

      metalness:
        0.25

    });

  const body =
    new THREE.Mesh(

      bodyGeometry,

      bodyMaterial

    );

  body.position.y =
    0.65;

  body.castShadow =
    true;

  body.receiveShadow =
    true;

  group.add(
    body
  );


  // ==========================================================
  // M8.1 — BOSS CABIN
  // ==========================================================

  const cabinGeometry =
    new THREE.BoxGeometry(

      1.65,
      0.65,
      1.8

    );

  const cabinMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0x202020,

      roughness:
        0.35,

      metalness:
        0.15

    });

  const cabin =
    new THREE.Mesh(

      cabinGeometry,

      cabinMaterial

    );

  cabin.position.set(

    0,
    1.2,
    -0.15

  );

  cabin.castShadow =
    true;

  group.add(
    cabin
  );


  // ==========================================================
  // M8.1 — BOSS FRONT LIGHTS
  // ==========================================================

  const lightGeometry =
    new THREE.BoxGeometry(

      0.42,
      0.18,
      0.12

    );

  const lightMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0xffffff,

      emissive:
        0xffffff,

      emissiveIntensity:
        1.5

    });


  const leftLight =
    new THREE.Mesh(

      lightGeometry,

      lightMaterial

    );

  leftLight.position.set(

    -0.7,
    0.75,
    -2.15

  );

  group.add(
    leftLight
  );


  const rightLight =
    new THREE.Mesh(

      lightGeometry,

      lightMaterial

    );

  rightLight.position.set(

    0.7,
    0.75,
    -2.15

  );

  group.add(
    rightLight
  );


  // ==========================================================
  // M8.1 — BOSS REAR LIGHTS
  // ==========================================================

  const rearLightMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0xff0000,

      emissive:
        0xff0000,

      emissiveIntensity:
        1.2

    });


  const rearLightGeometry =
    new THREE.BoxGeometry(

      0.4,
      0.18,
      0.12

    );


  const rearLeft =
    new THREE.Mesh(

      rearLightGeometry,

      rearLightMaterial

    );

  rearLeft.position.set(

    -0.7,
    0.75,
    2.15

  );

  group.add(
    rearLeft
  );


  const rearRight =
    new THREE.Mesh(

      rearLightGeometry,

      rearLightMaterial

    );

  rearRight.position.set(

    0.7,
    0.75,
    2.15

  );

  group.add(
    rearRight
  );


  // ==========================================================
  // M8.1 — BOSS WHEELS
  // ==========================================================

  const wheelGeometry =
    new THREE.CylinderGeometry(

      0.42,
      0.42,
      0.3,
      20

    );

  const wheelMaterial =
    new THREE.MeshStandardMaterial({

      color:
        0x111111,

      roughness:
        0.8

    });


  const wheelPositions: Array<
    [number, number, number]
  > = [

    [-1.15, 0.42, -1.35],
    [ 1.15, 0.42, -1.35],
    [-1.15, 0.42,  1.35],
    [ 1.15, 0.42,  1.35]

  ];


  for (
    const position of wheelPositions
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

    group.add(
      wheel
    );

  }


  // ==========================================================
  // M8.1 — BOSS INITIAL TRANSFORM
  // ==========================================================

  group.position.set(

    0,
    0,
    -80

  );

  group.rotation.y =
    Math.PI;


  return group;
}


// ============================================================
// M8.1 — LOAD BOSS MODEL
// ============================================================

private async loadBossModel(): Promise<void> {

  const loader =
    new GLTFLoader();


  try {

    const gltf =
      await loader.loadAsync(

        "/assets/models/boss.glb"

      );


    if (
      !gltf.scene
    ) {

      return;

    }


    // ========================================================
    // M8.1 — REPLACE PLACEHOLDER BOSS
    // ========================================================

    const loadedBoss =
      gltf.scene;


    loadedBoss.traverse(

      (
        object
      ) => {

        if (
          object instanceof THREE.Mesh
        ) {

          object.castShadow =
            true;

          object.receiveShadow =
            true;

        }

      }

    );


    loadedBoss.scale.set(

      1,
      1,
      1

    );


    // ========================================================
    // M8.1 — SAFE BOSS MODEL REPLACEMENT
    // ========================================================

    this.bossMesh.clear();

    this.bossMesh.add(
      loadedBoss
    );

    this.bossMesh.position.set(

      0,
      0,
      -80

    );

    this.bossMesh.rotation.y =
      Math.PI;

    this.bossMesh.visible =
      false;

  } catch {

    // ========================================================
    // M8.1 — PLACEHOLDER FALLBACK
    // ========================================================
    //
    // If boss.glb is not available,
    // the procedural Boss mesh remains active.
    //

  }

}


// ============================================================
// M8.1 — UPDATE BOSS 3D
// ============================================================

private updateBoss3D(): void {

  if (
    !this.bossEncounterStarted
  ) {

    this.bossMesh.visible =
      false;

    return;

  }


  const bossState =
    this.bossRace.getState();


  if (
    !bossState.active
  ) {

    this.bossMesh.visible =
      false;

    return;

  }


  this.bossMesh.visible =
    true;


  // ==========================================================
  // M8.1 — BOSS POSITION
  // ==========================================================

  const bossZ =
    bossState.bossDistance -
    this.normalRaceDistance;


  this.bossMesh.position.x =
    bossState.bossLane *
      4;


  this.bossMesh.position.y =
    0;


  this.bossMesh.position.z =
    -bossZ;


  // ==========================================================
  // M8.1 — BOSS ROTATION
  // ==========================================================

  this.bossMesh.rotation.y =
    Math.PI;

}


// ============================================================
// M8.1 — BOSS UNLOCK CHECK
// ============================================================

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
          .racesWon,

      bossesDefeated:
        this.playerProgress
          .bossesDefeated

    };


  return BossUnlockRules.isUnlocked(

    progress,

    this.bossUnlockConfig

  );

}


// ============================================================
// M8.1 — BOSS ENCOUNTER
// ============================================================
//
// IMPORTANT:
// Boss encounter is allowed ONLY when the selected campaign
// race is a Boss race.
//
// This prevents Boss from appearing during normal races.
// ============================================================

private startBossEncounter(
  playerZ: number
): void {

  // ==========================================================
  // M8.1 — SELECTED RACE
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
  // M8.1 — FIND RACE DEFINITION
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
  // M8.1 — BOSS RACE ONLY
  // ==========================================================

  if (
    !selectedRaceDefinition.isBoss
  ) {

    return;

  }


  // ==========================================================
  // M8.1 — UNLOCK CHECK
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
    !this.running
  ) {

    return;

  }


  // ==========================================================
  // M7.1 — NITRO
  // ==========================================================

  this.playerCar.activateNitro();


  // ==========================================================
  // M7.1 — NITRO SFX ONLY
  // ==========================================================
  //
  // IMPORTANT:
  // Nitro must NOT restart music.
  //

  this.audioManager.playSFX(
    "nitro"
  );

}


// ============================================================
// M7.1 — NITRO KEYBOARD INPUT
// ============================================================

private handleNitroKeyDown =
  (event: KeyboardEvent): void => {

    if (
      event.code ===
      "Space"
    ) {

      event.preventDefault();

      this.activateNitro();

    }

  };


// ============================================================
// CORE — LIGHTING SETUP
// ============================================================

private setupLighting(): void {

  // ==========================================================
  // CORE — AMBIENT LIGHT
  // ==========================================================

  const ambient =
    new THREE.AmbientLight(

      0xffffff,

      1.2

    );

  this.scene.add(
    ambient
  );


  // ==========================================================
  // CORE — SUN LIGHT
  // ==========================================================

  const sun =
    new THREE.DirectionalLight(

      0xffffff,

      2.0

    );

  sun.position.set(

    20,
    40,
    20

  );

  sun.castShadow =
    true;


  sun.shadow.mapSize.width =
    2048;

  sun.shadow.mapSize.height =
    2048;


  this.scene.add(
    sun
  );

}


// ============================================================
// M8.3.2 — START ENGINE
// ============================================================
//
// IMPORTANT:
// start() resets the previous race and explicitly starts
// the selected NORMAL campaign race before the render loop.
// ============================================================

public start(): void {

  if (
    this.running
  ) {

    return;

  }


  // ==========================================================
  // M8.2 — RESET RACE STATE
  // ==========================================================

  this.resetRaceState();


  // ==========================================================
  // M8.3.2 — START NORMAL RACE
  // ==========================================================

  this.startNormalRace();


  // ==========================================================
  // CORE — ENGINE RUNNING
  // ==========================================================

  this.running =
    true;


  // ==========================================================
  // CORE — CLOCK
  // ==========================================================

  this.clock.start();


  // ==========================================================
  // M7.1 — START MUSIC
  // ==========================================================

  this.audioManager.startMusic();


  // ==========================================================
  // CORE — ANIMATION LOOP
  // ==========================================================

  this.animate();

}


// ============================================================
// M8.3.2 — START NORMAL RACE
// ============================================================
//
// The race distance is virtual gameplay distance.
// It is NOT based on endless road segment count.
//
// Finish distance:
// 1500 metres
// ============================================================

private startNormalRace(): void {

  // ==========================================================
  // M8.3.2 — FIND SELECTED RACE
  // ==========================================================

  const progression =
    this.playerProgress
      .raceProgression;


  let selectedRace =
    progression.races.find(

      (race) =>
        race.raceId ===
        progression.selectedRaceId

    );


  // ==========================================================
  // M8.3.2 — FIND DEFINITION
  // ==========================================================

  let selectedDefinition =
    selectedRace
      ? RACE_DEFINITIONS.find(

          (race) =>
            race.id ===
            selectedRace!.raceId

        )
      : undefined;


  // ==========================================================
  // M8.3.2 — BOSS RACE CANNOT USE NORMAL FLOW
  // ==========================================================

  if (
    selectedDefinition?.isBoss
  ) {

    selectedRace =
      progression.races.find(

        (race) => {

          const definition =
            RACE_DEFINITIONS.find(

              (item) =>
                item.id ===
                race.raceId

            );

          return (
            !definition?.isBoss &&
            race.status !==
              "locked"
          );

        }

      );


    selectedDefinition =
      selectedRace
        ? RACE_DEFINITIONS.find(

            (race) =>
              race.id ===
              selectedRace!.raceId

          )
        : undefined;

  }


  // ==========================================================
  // M8.3.2 — FALLBACK RACE
  // ==========================================================

  if (
    !selectedRace ||
    !selectedDefinition
  ) {

    const fallback =
      progression.races.find(

        (race) => {

          const definition =
            RACE_DEFINITIONS.find(

              (item) =>
                item.id ===
                race.raceId

            );

          return (
            Boolean(definition) &&
            !definition!.isBoss &&
            race.status !==
              "locked"
          );

        }

      );


    if (
      !fallback
    ) {

      this.normalRaceStarted =
        false;

      return;

    }


    selectedRace =
      fallback;


    selectedDefinition =
      RACE_DEFINITIONS.find(

        (race) =>
          race.id ===
          selectedRace!.raceId

      );

  }


  // ==========================================================
  // M8.3.2 — FINAL SAFETY CHECK
  // ==========================================================

  if (
    !selectedRace ||
    !selectedDefinition ||
    selectedDefinition.isBoss
  ) {

    this.normalRaceStarted =
      false;

    return;

  }


  // ==========================================================
  // M8.3.2 — INITIALIZE RACE STATE
  // ==========================================================

  this.normalRaceId =
    selectedRace.raceId;

  this.normalRaceDistance =
    0;

  this.normalRaceTime =
    0;

  this.normalRaceStarted =
    true;

  this.normalRaceCompleted =
    false;


  // ==========================================================
  // M8.3.2 — RESET PLAYER POSITION
  // ==========================================================

  this.playerCar.setX(
    0
  );

  this.playerCar.setZ(
    0
  );


  // ==========================================================
  // M8.3.2 — RESET RACE AUDIO FLAGS
  // ==========================================================

  this.crashSoundPlayed =
    false;

  this.normalRaceCompleteSoundPlayed =
    false;


  // ==========================================================
  // M8.3.2 — HUD DISTANCE
  // ==========================================================

  this.raceHUD.setRaceDistance(

    0,

    this.normalRaceFinishDistance,

    true

  );

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
    Math.min(

      this.clock.getDelta(),

      0.05

    );


  this.update(
    deltaTime
  );


  this.renderer.render(

    this.scene,

    this.camera

  );

};


// ============================================================
// M8.3.2 — MAIN UPDATE LOOP
// ============================================================

private update(
  deltaTime: number
): void {

  // ==========================================================
  // CORE — WORLD UPDATE
  // ==========================================================

  this.world.update(
    this.playerCar.getPosition().z
  );


  // ==========================================================
  // M8.2 — ENVIRONMENT UPDATE
  // ==========================================================

  this.environmentManager.update(

    this.playerCar.getPosition().z

  );


  // ==========================================================
  // M5 — PLAYER UPDATE
  // ==========================================================

  this.playerCar.update(
    deltaTime
  );


  // ==========================================================
  // M5 — CAR CONTROLLER UPDATE
  // ==========================================================

  this.carController.update(
    deltaTime
  );


  // ==========================================================
  // M5 — SWIPE CONTROLLER UPDATE
  // ==========================================================

  this.swipeController.update();


  // ==========================================================
  // M7.9 — OBSTACLE UPDATE
  // ==========================================================

  this.obstacleManager.update(

    this.playerCar.getPosition().z,

    deltaTime

  );


  // ==========================================================
  // M7.9 — OBSTACLE COLLISION
  // ==========================================================

  this.obstacleCollisionSystem.update(
    deltaTime
  );


  // ==========================================================
  // M5 — TRAFFIC UPDATE
  // ==========================================================

  this.trafficManager.update(

    this.playerCar.getPosition().z,

    deltaTime

  );


  // ==========================================================
  // M5 — TRAFFIC COLLISION
  // ==========================================================

  this.trafficCollisionSystem.update(
    deltaTime
  );


  // ==========================================================
  // M4 — COIN UPDATE
  // ==========================================================

  this.coinSpawner.update(

    this.playerCar.getPosition().z,

    deltaTime

  );


  // ==========================================================
  // M8.3.2 — NORMAL RACE DISTANCE
  // ==========================================================
  //
  // Distance is calculated from actual gameplay speed.
  //
  // speed is km/h.
  //
  // metres per second =
  // km/h ÷ 3.6
  //
  // distance += metresPerSecond × deltaTime
  //
  // ==========================================================

  if (
    this.normalRaceStarted &&
    !this.normalRaceCompleted
  ) {

    const speed =
      Math.max(

        0,

        this.playerCar
          .getSpeed()

      );


    const metresPerSecond =
      speed / 3.6;


    this.normalRaceDistance +=

      metresPerSecond *
      deltaTime;


    this.normalRaceTime +=
      deltaTime;


    // ========================================================
    // M8.3.2 — CLAMP DISTANCE
    // ========================================================

    this.normalRaceDistance =
      Math.min(

        this.normalRaceDistance,

        this.normalRaceFinishDistance

      );


    // ========================================================
    // M8.3.2 — UPDATE HUD
    // ========================================================

    this.raceHUD.setRaceDistance(

      this.normalRaceDistance,

      this.normalRaceFinishDistance,

      true

    );


    // ========================================================
    // M8.3.2 — 1500m FINISH CHECK
    // ========================================================

    if (
      this.normalRaceDistance >=
      this.normalRaceFinishDistance
    ) {

      this.finishNormalRace();

      return;

    }

  }


  // ==========================================================
  // M6.7 — BOSS UPDATE
  // ==========================================================

  if (
    this.bossEncounterStarted
  ) {

    this.bossRace.update(

      deltaTime,

      this.playerCar.getPosition().z

    );


    this.updateBoss3D();

  }


  // ==========================================================
  // M8.3 — HUD UPDATE
  // ==========================================================

  this.raceHUD.update();

}


// ============================================================
// END OF PART 2/4
// ============================================================

// ============================================================
// RaceNova V2
// RaceNovaEngine.ts
// M8.3.2 — PART 3/4
// RACE FINISH + RESULT + RESIZE + PUBLIC API
// ============================================================


// ============================================================
// M8.3 — NORMAL RACE FINISH
// ============================================================
//
// Normal campaign race finishes when the virtual race distance
// reaches 1500 metres.
//
// Result:
// - WIN
// - Position 1
// - Reward currently 0
// - Boss flag false
//
// ============================================================

private finishNormalRace(): void {

  // ==========================================================
  // M8.3 — FINISH GUARD
  // ==========================================================

  if (
    !this.normalRaceStarted ||
    this.normalRaceCompleted
  ) {

    return;

  }


  // ==========================================================
  // M8.3 — CAPTURE RACE DATA
  // ==========================================================

  const completedRaceId =
    this.normalRaceId;

  const completedRaceTime =
    this.normalRaceTime;

  const completedDistance =
    this.normalRaceDistance;


  // ==========================================================
  // M8.3 — MARK RACE COMPLETE
  // ==========================================================

  this.normalRaceCompleted =
    true;

  this.normalRaceStarted =
    false;


  // ==========================================================
  // M8.3 — STOP PLAYER
  // ==========================================================

  this.playerCar.stop();


  // ==========================================================
  // M8.3 — RACE COMPLETE SFX
  // ==========================================================

  if (
    !this.normalRaceCompleteSoundPlayed
  ) {

    this.audioManager.playSFX(
      "raceComplete"
    );

    this.normalRaceCompleteSoundPlayed =
      true;

  }


  // ==========================================================
  // M8.3 — COMPLETE CAMPAIGN RACE
  // ==========================================================

  this.completeRace(

    completedRaceId,

    true,

    1,

    completedRaceTime

  );


  // ==========================================================
  // M8.3 — FIND NEXT RACE
  // ==========================================================

  const nextRaceId =
    this.getNextRaceId(
      completedRaceId
    );


  // ==========================================================
  // M8.3 — ADVANCE CAMPAIGN
  // ==========================================================

  this.advanceToNextRace();


  // ==========================================================
  // M8.3 — CREATE RESULT
  // ==========================================================

  this.raceResult.setResult({

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
  // M8.3 — STOP ENGINE LOOP
  // ==========================================================

  this.running =
    false;

  this.clock.stop();


  // ==========================================================
  // M8.3 — SHOW RESULT UI
  // ==========================================================

  this.raceResultUI.show(
    this.raceResult.getResult()
  );

}


// ============================================================
// M8.3 — GET NEXT RACE ID
// ============================================================

private getNextRaceId(
  currentRaceId: string
): string | null {

  // ==========================================================
  // M8.3 — FIND CURRENT RACE INDEX
  // ==========================================================

  const currentIndex =
    RACE_DEFINITIONS.findIndex(

      (race) =>
        race.id ===
        currentRaceId

    );


  if (
    currentIndex < 0
  ) {

    return null;

  }


  // ==========================================================
  // M8.3 — FIND NEXT RACE
  // ==========================================================

  const nextRace =
    RACE_DEFINITIONS[
      currentIndex + 1
    ];


  if (
    !nextRace
  ) {

    return null;

  }


  return nextRace.id;

}


// ============================================================
// M8.3 — ADVANCE TO NEXT RACE
// ============================================================
//
// Unlocks and selects the next campaign race when available.
//
// ============================================================

private advanceToNextRace(): void {

  // ==========================================================
  // M8.3 — CURRENT RACE
  // ==========================================================

  const currentRaceId =
    this.normalRaceId;


  // ==========================================================
  // M8.3 — NEXT RACE
  // ==========================================================

  const nextRaceId =
    this.getNextRaceId(
      currentRaceId
    );


  if (
    !nextRaceId
  ) {

    this.savePlayerData();

    return;

  }


  // ==========================================================
  // M8.3 — FIND NEXT PROGRESS
  // ==========================================================

  const nextRace =
    this.playerProgress
      .raceProgression
      .races.find(

        (race) =>
          race.raceId ===
          nextRaceId

      );


  if (
    !nextRace
  ) {

    this.savePlayerData();

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
      "unlocked";

  }


  // ==========================================================
  // M8.3 — SELECT NEXT RACE
  // ==========================================================

  this.playerProgress
    .raceProgression
    .selectedRaceId =
      nextRaceId;


  // ==========================================================
  // M8.3 — SAVE PROGRESSION
  // ==========================================================

  this.savePlayerData();

}


// ============================================================
// M8.3 — COMPLETE RACE
// ============================================================
//
// Updates:
// - completion count
// - win count
// - best position
// - best time
// - race status
// - player level
// - legacy progression fields
//
// ============================================================

private completeRace(

  raceId: string,

  won: boolean,

  position: number,

  time: number

): void {

  // ==========================================================
  // M8.3 — FIND RACE PROGRESS
  // ==========================================================

  const raceProgress =
    this.playerProgress
      .raceProgression
      .races.find(

        (race) =>
          race.raceId ===
          raceId

      );


  if (
    !raceProgress
  ) {

    return;

  }


  // ==========================================================
  // M8.3 — COMPLETION COUNT
  // ==========================================================

  raceProgress.completionCount +=
    1;


  // ==========================================================
  // M8.3 — WIN COUNT
  // ==========================================================

  if (
    won
  ) {

    raceProgress.winCount +=
      1;

  }


  // ==========================================================
  // M8.3 — BEST POSITION
  // ==========================================================

  if (
    raceProgress.bestPosition <= 0 ||
    position <
      raceProgress.bestPosition
  ) {

    raceProgress.bestPosition =
      position;

  }


  // ==========================================================
  // M8.3 — BEST TIME
  // ==========================================================

  if (
    time > 0 &&
    (
      raceProgress.bestTime <= 0 ||
      time <
        raceProgress.bestTime
    )
  ) {

    raceProgress.bestTime =
      time;

  }


  // ==========================================================
  // M8.3 — RACE STATUS
  // ==========================================================

  raceProgress.status =
    "completed";


  // ==========================================================
  // M6.9 — GLOBAL COMPLETION
  // ==========================================================

  this.playerProgress.racesCompleted +=
    1;


  // ==========================================================
  // M6.9 — GLOBAL WINS
  // ==========================================================

  if (
    won
  ) {

    this.playerProgress.racesWon +=
      1;

  }


  // ==========================================================
  // M6.9 — LEVEL PROGRESSION
  // ==========================================================

  const completedDefinition =
    RACE_DEFINITIONS.find(

      (race) =>
        race.id ===
        raceId

    );


  if (
    completedDefinition
  ) {

    this.playerProgress.unlockedLevel =
      Math.max(

        this.playerProgress
          .unlockedLevel,

        completedDefinition.level

      );

  }


  // ==========================================================
  // M6.9 — UNLOCK FIRST LOCKED RACE
  // ==========================================================

  const nextLockedRace =
    this.playerProgress
      .raceProgression
      .races.find(

        (race) =>
          race.status ===
          "locked"

      );


  if (
    nextLockedRace
  ) {

    nextLockedRace.status =
      "unlocked";

  }


  // ==========================================================
  // M6.9 — SAVE
  // ==========================================================

  this.savePlayerData();

}


// ============================================================
// CORE — RESIZE
// ============================================================

private handleResize = (): void => {

  // ==========================================================
  // CORE — VIEWPORT
  // ==========================================================

  const width =
    window.innerWidth;

  const height =
    window.innerHeight;


  // ==========================================================
  // CORE — INVALID HEIGHT GUARD
  // ==========================================================

  if (
    height <= 0
  ) {

    return;

  }


  // ==========================================================
  // CORE — CAMERA ASPECT
  // ==========================================================

  this.camera.aspect =
    width /
    height;


  this.camera.updateProjectionMatrix();


  // ==========================================================
  // CORE — RENDERER SIZE
  // ==========================================================

  this.renderer.setSize(

    width,

    height

  );

};


// ============================================================
// PUBLIC API — GET SCENE
// ============================================================

public getScene():
  THREE.Scene {

  return this.scene;

}


// ============================================================
// PUBLIC API — GET CAMERA
// ============================================================

public getCamera():
  THREE.PerspectiveCamera {

  return this.camera;

}


// ============================================================
// PUBLIC API — GET RENDERER
// ============================================================

public getRenderer():
  THREE.WebGLRenderer {

  return this.renderer;

}


// ============================================================
// PUBLIC API — GET PLAYER
// ============================================================

public getPlayerCar():
  PlayerCar {

  return this.playerCar;

}


// ============================================================
// PUBLIC API — GET ECONOMY
// ============================================================

public getEconomyManager():
  EconomyManager {

  return this.economyManager;

}


// ============================================================
// PUBLIC API — GET GARAGE
// ============================================================

public getGarageManager():
  GarageManager {

  return this.garageManager;

}


// ============================================================
// PUBLIC API — GET UPGRADE SYSTEM
// ============================================================

public getUpgradeSystem():
  UpgradeSystem {

  return this.upgradeSystem;

}


// ============================================================
// PUBLIC API — GET PLAYER PROGRESS
// ============================================================

public getPlayerProgress():
  PlayerProgress {

  return this.playerProgress;

}


// ============================================================
// M8.3.2 — GET NORMAL RACE DISTANCE
// ============================================================

public getNormalRaceDistance():
  number {

  return this.normalRaceDistance;

}


// ============================================================
// M8.3.2 — GET NORMAL RACE FINISH DISTANCE
// ============================================================

public getNormalRaceFinishDistance():
  number {

  return this.normalRaceFinishDistance;

}


// ============================================================
// M8.3.2 — GET NORMAL RACE ID
// ============================================================

public getNormalRaceId():
  string {

  return this.normalRaceId;

}


// ============================================================
// M8.3.2 — IS NORMAL RACE ACTIVE
// ============================================================

public isNormalRaceActive():
  boolean {

  return (
    this.normalRaceStarted &&
    !this.normalRaceCompleted
  );

}


// ============================================================
// M8.3 — GET RACE RESULT
// ============================================================

public getRaceResult():
  RaceResult {

  return this.raceResult;

}


// ============================================================
// M6.7 — GET BOSS RACE
// ============================================================

public getBossRace():
  BossRace {

  return this.bossRace;

}


// ============================================================
// M8.3.2 — IS ENGINE RUNNING
// ============================================================

public isRunning():
  boolean {

  return this.running;

}


// ============================================================
// END OF PART 3/4
// ============================================================

// ============================================================
// RaceNova V2
// RaceNovaEngine.ts
// M8.3.2 — PART 4/4 — FINAL
// RESET + SAVE + BOSS + DISPOSE
// ============================================================


// ============================================================
// M8.2 — RESET RACE STATE
// ============================================================
//
// This method is the central race reset.
//
// It is called when:
// - START RACE is pressed again
// - Traffic crash returns to Main Menu
// - Race Result returns to Main Menu
// - A new race starts
//
// IMPORTANT:
// Environment reset is included here so environment props
// correctly return after restart.
//
// ============================================================

public resetRaceState(): void {

  // ==========================================================
  // M8.2 — STOP CURRENT RACE
  // ==========================================================

  this.running =
    false;

  this.clock.stop();


  // ==========================================================
  // M8.2 — RESET NORMAL RACE
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
  // M8.2 — RESET RACE RESULT
  // ==========================================================

  this.raceResult.reset();

  this.raceResultUI.hide();


  // ==========================================================
  // M8.2 — RESET PLAYER
  // ==========================================================

  this.playerCar.stop();

  this.playerCar.setX(
    0
  );

  this.playerCar.setZ(
    0
  );


  // ==========================================================
  // M8.2 — RESET PLAYER CONTROLLER
  // ==========================================================

  this.carController.reset();


  // ==========================================================
  // M8.2 — RESET OBSTACLE COLLISION
  // ==========================================================

  this.obstacleCollisionSystem.reset();


  // ==========================================================
  // M8.2 — RESET TRAFFIC COLLISION
  // ==========================================================

  this.trafficCollisionSystem.reset();


  // ==========================================================
  // M8.2 — CLEAR TRAFFIC
  // ==========================================================

  this.trafficManager.clear();


  // ==========================================================
  // M8.2 — RESET OBSTACLES
  // ==========================================================

  this.obstacleManager.reset();


  // ==========================================================
  // M8.2 — RESET COINS
  // ==========================================================

  this.coinSpawner.reset();


  // ==========================================================
  // M8.2 — RESET BOSS RACE
  // ==========================================================

  this.bossRace.reset();


  // ==========================================================
  // M8.2 — RESET BOSS ENCOUNTER
  // ==========================================================

  this.bossEncounterStarted =
    false;


  // ==========================================================
  // M8.2 — RESET BOSS 3D
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
  // M8.2 — RESET ENVIRONMENT
  // ==========================================================

  this.environmentManager.reset(
    0
  );


  // ==========================================================
  // M7.1 — RESET AUDIO FLAGS
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
  // M8.3 — RESET HUD DISTANCE
  // ==========================================================

  this.raceHUD.setRaceDistance(

    0,

    this.normalRaceFinishDistance,

    false

  );


  // ==========================================================
  // M8.3 — RESET HUD
  // ==========================================================

  this.raceHUD.update();

}


// ============================================================
// M8.3 — CREATE SAVE SNAPSHOT
// ============================================================
//
// SaveSystem remains the ONLY layer that communicates with
// browser storage.
//
// RaceNovaEngine only creates the current game state.
//
// ============================================================

private createSaveSnapshot():
  PlayerSaveData {

  // ==========================================================
  // M8.3 — DEFAULT SAVE STRUCTURE
  // ==========================================================

  const saveData =
    createDefaultPlayerSaveData();


  // ==========================================================
  // M8.3 — SAVE VERSION
  // ==========================================================

  saveData.version =
    PLAYER_SAVE_VERSION;


  // ==========================================================
  // M8.3 — SAVE TIMESTAMP
  // ==========================================================

  saveData.timestamp =
    Date.now();


  // ==========================================================
  // M8.3 — ECONOMY
  // ==========================================================

  saveData.economy =
    this.economyManager
      .getSaveData();


  // ==========================================================
  // M8.3 — GARAGE
  // ==========================================================

  saveData.garage =
    this.garageManager
      .getSaveData();


  // ==========================================================
  // M8.3 — UPGRADES
  // ==========================================================

  saveData.upgrades =
    this.upgradeSystem
      .getSaveData();


  // ==========================================================
  // M6.9 — PLAYER PROGRESS
  // ==========================================================

  saveData.progress =
    normalizePlayerProgress(

      this.playerProgress,

      RACE_DEFINITIONS

    );


  return saveData;

}


// ============================================================
// M8.3 — SAVE PLAYER DATA
// ============================================================

private savePlayerData(): void {

  // ==========================================================
  // M8.3 — CREATE SNAPSHOT
  // ==========================================================

  const snapshot =
    this.createSaveSnapshot();


  // ==========================================================
  // M8.3 — SAVE
  // ==========================================================

  this.saveSystem.save(
    snapshot
  );

}


// ============================================================
// M6.9 — SET PLAYER PROGRESS
// ============================================================

private setPlayerProgress(
  progress: PlayerProgress
): void {

  // ==========================================================
  // M6.9 — VALIDATE
  // ==========================================================

  this.playerProgress =
    normalizePlayerProgress(

      progress,

      RACE_DEFINITIONS

    );


  // ==========================================================
  // M6.9 — SELECT DEFAULT RACE
  // ==========================================================

  if (
    !this.playerProgress
      .raceProgression
      .selectedRaceId
  ) {

    const firstRace =
      RACE_DEFINITIONS[0];


    if (
      firstRace
    ) {

      this.playerProgress
        .raceProgression
        .selectedRaceId =
          firstRace.id;

    }

  }

}


// ============================================================
// M6.9 — RECORD BOSS DEFEAT
// ============================================================
//
// Boss defeat is saved independently so the achievement
// survives reload.
//
// ============================================================

private recordBossDefeat(): void {

  // ==========================================================
  // M6.9 — FIND BOSS RACE PROGRESS
  // ==========================================================

  const bossRaceProgress =
    this.playerProgress
      .raceProgression
      .races.find(

        (race) =>
          race.raceId ===
          this.bossUnlockConfig.bossId

      );


  // ==========================================================
  // M6.9 — MARK BOSS DEFEATED
  // ==========================================================

  if (
    bossRaceProgress
  ) {

    bossRaceProgress.bossDefeated =
      true;

  }


  // ==========================================================
  // M6.9 — GLOBAL BOSS COUNT
  // ==========================================================

  this.playerProgress.bossesDefeated +=
    1;


  // ==========================================================
  // M6.9 — SAVE
  // ==========================================================

  this.savePlayerData();

}


// ============================================================
// M8.3 — LOAD PLAYER SAVE
// ============================================================
//
// Safe restore helper.
//
// ============================================================

private loadPlayerData(): void {

  // ==========================================================
  // M8.3 — READ SAVE
  // ==========================================================

  const loaded =
    this.saveSystem.readSave();


  if (
    !loaded
  ) {

    return;

  }


  // ==========================================================
  // M8.3 — VALIDATE SAVE
  // ==========================================================

  if (
    !isValidPlayerSaveData(
      loaded
    )
  ) {

    return;

  }


  // ==========================================================
  // M8.3 — RESTORE PROGRESS
  // ==========================================================

  this.setPlayerProgress(

    loaded.progress

  );


  // ==========================================================
  // M8.3 — UPDATE HUD
  // ==========================================================

  this.raceHUD.update();

}


// ============================================================
// M8.3 — PUBLIC SAVE
// ============================================================

public save(): void {

  this.savePlayerData();

}


// ============================================================
// M8.3 — PUBLIC LOAD
// ============================================================

public load(): void {

  this.loadPlayerData();

}


// ============================================================
// M8.3 — PUBLIC RESET
// ============================================================
//
// Resets gameplay state but does NOT erase permanent player
// progression or economy data.
//
// ============================================================

public reset(): void {

  this.resetRaceState();

}


// ============================================================
// CORE — DISPOSE
// ============================================================
//
// Completely releases runtime resources.
//
// ============================================================

public dispose(): void {

  // ==========================================================
  // CORE — STOP ENGINE
  // ==========================================================

  this.running =
    false;

  this.clock.stop();


  // ==========================================================
  // M7.1 — REMOVE AUDIO EVENTS
  // ==========================================================

  window.removeEventListener(

    "pointerdown",

    this.handleAudioUnlock

  );


  window.removeEventListener(

    "keydown",

    this.handleNitroKeyDown

  );


  // ==========================================================
  // CORE — REMOVE RESIZE EVENT
  // ==========================================================

  window.removeEventListener(

    "resize",

    this.handleResize

  );


  // ==========================================================
  // M5 — DISPOSE SWIPE
  // ==========================================================

  this.swipeController.dispose();


  // ==========================================================
  // M5 — DISPOSE TRAFFIC COLLISION
  // ==========================================================

  this.trafficCollisionSystem.dispose();


  // ==========================================================
  // M7.9 — DISPOSE OBSTACLE COLLISION
  // ==========================================================

  this.obstacleCollisionSystem.dispose();


  // ==========================================================
  // M8.3 — DISPOSE RESULT UI
  // ==========================================================

  this.raceResultUI.dispose();


  // ==========================================================
  // M8.3 — HIDE GARAGE
  // ==========================================================

  this.garageUI.hide();


  // ==========================================================
  // M8.3 — HIDE UPGRADES
  // ==========================================================

  this.upgradeScreen.hide();


  // ==========================================================
  // M8.3 — DISPOSE HUD
  // ==========================================================

  this.raceHUD.dispose();


  // ==========================================================
  // M4 — DISPOSE COINS
  // ==========================================================

  this.coinSpawner.dispose();


  // ==========================================================
  // M5 — DISPOSE TRAFFIC
  // ==========================================================

  this.trafficManager.dispose();


  // ==========================================================
  // M7.9 — DISPOSE OBSTACLES
  // ==========================================================

  this.obstacleManager.dispose();


  // ==========================================================
  // M8.2 — DISPOSE ENVIRONMENT
  // ==========================================================

  this.environmentManager.dispose();


  // ==========================================================
  // M8.2 — DISPOSE WORLD
  // ==========================================================

  this.world.dispose();


  // ==========================================================
  // M7.1 — DISPOSE AUDIO
  // ==========================================================

  this.audioManager.dispose();


  // ==========================================================
  // CORE — REMOVE BOSS
  // ==========================================================

  this.scene.remove(
    this.bossMesh
  );


  // ==========================================================
  // CORE — REMOVE PLAYER
  // ==========================================================

  this.scene.remove(

    this.playerCar.getGroup()

  );


  // ==========================================================
  // CORE — DISPOSE RENDERER
  // ==========================================================

  this.renderer.dispose();


  // ==========================================================
  // CORE — REMOVE CANVAS
  // ==========================================================

  const canvas =
    this.renderer.domElement;


  if (
    canvas.parentElement
  ) {

    canvas.parentElement
      .removeChild(
        canvas
      );

  }


  // ==========================================================
  // CORE — CLEAR SCENE
  // ==========================================================

  this.scene.clear();

}


// ============================================================
// RaceNovaEngine.ts
// M8.3.2 — ALL 4 PARTS COMPLETE
// ============================================================
