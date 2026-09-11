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

export class RaceNovaEngine {

  private readonly renderer:
    THREE.WebGLRenderer;

  private readonly scene:
    THREE.Scene;

  private readonly camera:
    THREE.PerspectiveCamera;

  private readonly clock:
    THREE.Clock;

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
      });

  };

  private readonly world:
    World;

  private readonly environmentManager:
    EnvironmentManager;

  private readonly obstacleManager:
    ObstacleManager;

  private readonly playerCar:
    PlayerCar;

  private readonly carController:
    CarController;

  private readonly swipeController:
    SwipeController;

  private readonly trafficManager:
    TrafficManager;

  private readonly trafficCollisionSystem:
    TrafficCollisionSystem;

  private readonly obstacleCollisionSystem:
    ObstacleCollisionSystem;

  private readonly economyManager:
    EconomyManager;

  private readonly coinSpawner:
    CoinSpawner;

  private readonly garageManager:
    GarageManager;

  private readonly upgradeSystem:
    UpgradeSystem;

  private readonly saveSystem:
    SaveSystem;

  private readonly raceHUD:
    RaceHUD;

  private readonly garageUI:
    Garage;

  private readonly upgradeScreen:
    UpgradeScreen;

  private readonly bossManager:
    BossManager;

  private readonly bossRace:
    BossRace;

  private readonly raceResult:
    RaceResult;

  private readonly raceResultUI:
    RaceResultUI;

  private running =
    false;

  private normalRaceStarted =
    false;

  private normalRaceCompleted =
    false;

  private normalRaceDistance =
    0;

  private normalRaceTime =
    0;

  private normalRaceId =
    "";

  private readonly normalRaceFinishDistance =
    1500;

  private bossEncounterStarted =
    false;

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

  constructor(
    container:
      HTMLElement
  ) {

    this.renderer =
      new THREE.WebGLRenderer({
        antialias: true,
        alpha: false
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

    container.appendChild(
      this.renderer.domElement
    );

    this.scene =
      new THREE.Scene();

    this.scene.background =
      new THREE.Color(
        0x87ceeb
      );

    this.camera =
      new THREE.PerspectiveCamera(
        60,
        window.innerWidth /
          window.innerHeight,
        0.1,
        2000
      );

    this.camera.position.set(
      0,
      6,
      12
    );

    this.clock =
      new THREE.Clock();

    this.world =
      new World();

    this.environmentManager =
      new EnvironmentManager(
        this.scene,
        this.world
      );

    this.obstacleManager =
      new ObstacleManager(
        this.scene,
        this.world
      );

    this.economyManager =
      new EconomyManager();

    this.garageManager =
      new GarageManager(
        this.economyManager
      );

    this.upgradeSystem =
      new UpgradeSystem(
        this.economyManager
      );

    this.saveSystem =
      new SaveSystem(
        this.economyManager,
        this.garageManager,
        this.upgradeSystem
      );

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

    const selectedCar =
      this.garageManager
        .getSelectedCar();

    const selectedCarStats =
      this.upgradeSystem.getStats(
        selectedCar.id
      );

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

    this.carController =
      new CarController(
        this.playerCar,
        {
          laneWidth: 4,
          laneCount: 3,
          steeringSpeed: 10
        }
      );

    this.swipeController =
      new SwipeController(
        this.carController
      );

    this.trafficManager =
      new TrafficManager(
        this.scene,
        this.world
      );

    this.trafficCollisionSystem =
      new TrafficCollisionSystem(
        this.playerCar
      );

    this.obstacleCollisionSystem =
      new ObstacleCollisionSystem(
        this.playerCar,
        this.obstacleManager
      );

    this.coinSpawner =
      new CoinSpawner(
        this.scene,
        this.economyManager,
        {
          laneWidth: 4,

          laneCount: 3,

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
            (worldZ: number) =>
              this.world
                .getRoadCenterX(
                  worldZ
                ),

          onCoinCollected:
            () => {
              this.savePlayerData();
            }
        }
      );

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
                this.upgradeSystem
                  .getStats(
                    selectedCarId
                  );

              this.playerCar
                .applyCarStats(
                  upgradedStats.maxSpeed,
                  upgradedStats.acceleration,
                  upgradedStats.handling
                );

              this.savePlayerData();
            }
        }
      );

    this.upgradeScreen =
      new UpgradeScreen(
        this.garageManager,
        this.upgradeSystem,
        this.economyManager,
        {
          onChanged:
            () => {

              const selectedCarId =
                this.garageManager
                  .getSelectedCarId();

              const upgradedStats =
                this.upgradeSystem
                  .getStats(
                    selectedCarId
                  );

              this.playerCar
                .applyCarStats(
                  upgradedStats.maxSpeed,
                  upgradedStats.acceleration,
                  upgradedStats.handling
                );

              this.savePlayerData();
            }
        }
      );

    this.bossManager =
      new BossManager();

    this.bossRace =
      new BossRace(
        this.bossManager
      );

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

    this.audioManager =
      new AudioManager();

    window.addEventListener(
      "pointerdown",
      this.handleAudioUnlock,
      {
        passive: true
      }
    );

    window.addEventListener(
      "touchstart",
      this.handleAudioUnlock,
      {
        passive: true
      }
    );

    window.addEventListener(
      "resize",
      this.handleResize
    );

    this.handleResize();

    this.resetRaceState();
}
    private createBossMesh(): THREE.Group {
    return new THREE.Group();
  }

  private async loadBossModel(): Promise<void> {
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

      if (!model) {
        console.error(
          "[RaceNova] Boss GLB loaded without a scene."
        );
        return;
      }

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
                material.needsUpdate = true;
              }
            } else {
              object.material.needsUpdate = true;
            }
          }
        }
      );

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

      void center;

      this.bossMesh.add(
        model
      );

      this.bossMesh.visible =
        this.bossManager.isActive();

    } catch (error) {
      console.error(
        "[RaceNova] Failed to load Boss GLB:",
        error
      );
    }
  }

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

    this.bossMesh.rotation.y =
      Math.PI;
  }

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

    if (
      !this.isBossUnlocked()
    ) {
      return;
    }

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

  public start(): void {
    if (this.running) {
      return;
    }

    this.resetRaceState();

    this.startNormalRace();

    this.running = true;

    this.clock.start();

    this.animate();
  }

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

    this.carController.update(
      deltaTime
    );

    const playerPosition =
      this.playerCar.getPosition();

    const playerZ =
      playerPosition.z;

    this.world.update(
      playerZ
    );

    this.environmentManager.update(
      playerZ
    );

    this.obstacleManager.update(
      playerZ
    );

    this.obstacleCollisionSystem.update(
      deltaTime
    );

    this.trafficManager.update(
      deltaTime,
      playerZ
    );

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

      this.audioManager.playSFX(
        "crash"
      );

      this.running =
        false;

      this.clock.stop();

      window.dispatchEvent(
        new CustomEvent(
          "racenova:traffic-crash"
        )
      );
    }

    if (
      !this.trafficCollisionSystem
        .hasCrashed()
    ) {
      this.coinSpawner.update(
        deltaTime,
        playerPosition
      );
    }

    if (
      !this.bossEncounterStarted
    ) {
      this.startBossEncounter(
        playerZ
      );
    }

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

    if (
      this.bossRace.isBossDefeated()
    ) {
      this.recordBossDefeat();
    }

    this.updateBoss3D();

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

    this.raceHUD.setRaceDistance(
      this.normalRaceDistance,
      this.normalRaceFinishDistance,
      this.normalRaceStarted &&
        !this.normalRaceCompleted
    );

    this.raceHUD.update();

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

  private startNormalRace(): void {
    const progression =
      this.playerProgress.raceProgression;
    let selectedRace =
      progression.races.find(
        (race) =>
          race.raceId ===
          progression.selectedRaceId
      );
    let definition = selectedRace
      ? RACE_DEFINITIONS.find(
          (race) =>
            race.id === selectedRace!.raceId
        )
      : undefined;
    if (
      !selectedRace ||
      !definition ||
      definition.isBoss ||
      selectedRace.status === "locked"
    ) {
      const fallback =
        progression.races.find((race) => {
          if (
            race.status !== "available" &&
            race.status !== "completed"
          ) {
            return false;
          }
          const raceDefinition =
            RACE_DEFINITIONS.find(
              (entry) => entry.id === race.raceId
            );
          return (
            raceDefinition !== undefined &&
            raceDefinition.isBoss !== true
          );
        });
      if (!fallback) {
        return;
      }
      selectedRace = fallback;
      definition = RACE_DEFINITIONS.find(
        (race) => race.id === fallback.raceId
      );
      progression.selectedRaceId =
        fallback.raceId;
      this.playerProgress.selectedRaceId =
        fallback.raceId;
    }
    if (!selectedRace || !definition || definition.isBoss) {
      return;
    }
    this.normalRaceId =
      selectedRace.raceId;
    this.normalRaceStarted = true;
    this.normalRaceCompleted = false;
    this.normalRaceDistance = 0;
    this.normalRaceTime = 0;
  }

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
    const speed =
      this.playerCar.getSpeed();
    if (
      Number.isFinite(speed) &&
      speed > 0
    ) {
      this.normalRaceDistance +=
        (speed / 3.6) * deltaTime;
    }
    this.normalRaceDistance =
      Math.min(
        Math.max(0, this.normalRaceDistance),
        this.normalRaceFinishDistance
      );
    this.normalRaceTime += deltaTime;
    if (
      this.normalRaceDistance >=
      this.normalRaceFinishDistance
    ) {
      this.normalRaceDistance =
        this.normalRaceFinishDistance;
      this.finishNormalRace();
    }
  }

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
    if (
      !this.normalRaceCompleteSoundPlayed
    ) {
      this.normalRaceCompleteSoundPlayed =
        true;
      this.audioManager.playSFX(
        "raceComplete"
      );
    }
    this.completeRace(
      completedRaceId,
      true,
      1,
      completedRaceTime
    );
    this.advanceToNextRace();
    this.normalRaceStarted =
      false;
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
    this.running =
      false;
    this.clock.stop();
    this.raceResultUI.show(
      this.raceResult.get()
    );
  }

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

  public getEconomyManager():
    EconomyManager {
    return this.economyManager;
  }

  public getGarageManager():
    GarageManager {
    return this.garageManager;
  }

  public openGarage(): void {
    this.garageUI.open();
  }

  public closeGarage(): void {
    this.garageUI.hide();
  }

  public isGarageOpen(): boolean {
    return this.garageUI.isVisible();
  }

  public openUpgrades(): void {
    this.upgradeScreen.open();
  }

  public closeUpgrades(): void {
    this.upgradeScreen.hide();
  }

  public isUpgradeScreenOpen(): boolean {
    return this.upgradeScreen.isVisible();
  }

  public getSelectedCarId(): string {
    return this.garageManager
      .getSelectedCarId();
  }

  public getUpgradeSystem():
    UpgradeSystem {
    return this.upgradeSystem;
  }

  public getSaveSystem():
    SaveSystem {
    return this.saveSystem;
  }

  public getBossManager():
    BossManager {
    return this.bossManager;
  }

  public getBossRace():
    BossRace {
    return this.bossRace;
  }

  public isBossActive(): boolean {
    return this.bossManager.isActive();
  }

  public getBossPosition(): {
    x: number;
    z: number;
  } | null {
    return this.bossManager
      .getPosition();
  }

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

  public resetRaceState(): void {
    this.running =
      false;
    this.clock.stop();
    this.raceResultUI.hide();
    this.raceResult.reset();
    this.playerCar.stop();
    this.playerCar.setX(
      0
    );
    this.playerCar.setZ(
      0
    );
    this.environmentManager.reset(
      0
    );
    this.trafficCollisionSystem.reset();
    this.trafficManager.clear();
    this.obstacleCollisionSystem.reset();
    this.obstacleManager.reset(
      0
    );
    this.coinSpawner.clear();
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

    this.raceHUD.update();

    this.renderer.render(
      this.scene,
      this.camera
    );
  }

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

    if (!race) {
      return;
    }

    race.completionCount += 1;

    progression.racesCompleted += 1;

    if (won) {
      race.winCount += 1;
      progression.racesWon += 1;
    }

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

    if (won) {
      race.status =
        "completed";
    }

    const nextRace =
      progression.races.find(
        (entry) =>
          entry.status === "locked"
      );

    if (nextRace) {
      nextRace.status =
        "available";
    }

    const levelTwoUnlocked =
      progression.racesCompleted >= 3 &&
      progression.racesWon >= 2;

    if (levelTwoUnlocked) {
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

    this.savePlayerData();

    this.raceHUD.update();
  }

  private recordBossDefeat(): void {
    const raceId =
      this.bossRace.getRaceId();

    if (!raceId) {
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

  public loadPlayerData():
    boolean {
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

  public resetPlayerData(): void {
    this.saveSystem.resetProgress();

    this.playerProgress =
      createDefaultPlayerProgress(
        RACE_DEFINITIONS
      );
  }

  public dispose(): void {
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

    this.audioManager.dispose();

    this.bossRace.reset();
    this.bossRace.dispose();

    this.bossManager.dispose();

    this.bossMesh.traverse(
      (object) => {
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

    this.swipeController.dispose();
    this.carController.dispose();

    this.trafficManager.dispose();

    this.trafficCollisionSystem
      .dispose();

    this.coinSpawner.dispose();

    this.economyManager.dispose();

    this.garageManager.reset();

    this.upgradeSystem.reset();

    this.saveSystem.dispose();

    this.playerCar.dispose();

    this.world.dispose();

    this.environmentManager
      .dispose();

    this.obstacleManager.dispose();

    this.raceHUD.dispose();

    this.garageUI.dispose();

    this.upgradeScreen.dispose();

    this.raceResultUI.dispose();

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
