/**
 * ============================================================
 * RaceNova V2
 * Coin Spawner
 * M4
 * ============================================================
 *
 * Responsibilities:
 * - Spawn coins ahead of the player
 * - Keep coins aligned with road lanes
 * - Update coin animation
 * - Detect player collection
 * - Remove coins behind the player
 *
 * EconomyManager is used only after a coin is collected.
 * ============================================================
 */

import * as THREE from "three";

import { CoinPickup } from "./CoinPickup";
import { EconomyManager } from "./EconomyManager";

export interface CoinSpawnerConfig {
  laneWidth?: number;
  laneCount?: number;

  spawnDistance?: number;
  despawnDistance?: number;

  coinSpacing?: number;

  coinHeight?: number;

  maxCoins?: number;

  getRoadCenterX?: (
    worldZ: number
  ) => number;
}

export class CoinSpawner {
  private readonly scene: THREE.Scene;

  private readonly economyManager:
    EconomyManager;

  private readonly laneWidth: number;
  private readonly laneCount: number;

  private readonly spawnDistance: number;
  private readonly despawnDistance: number;

  private readonly coinSpacing: number;
  private readonly coinHeight: number;

  private readonly maxCoins: number;

  private readonly getRoadCenterX:
    (
      worldZ: number
    ) => number;

  private readonly coins:
    CoinPickup[] = [];

  private nextSpawnZ = 0;

  private initialized = false;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    scene: THREE.Scene,
    economyManager: EconomyManager,
    config: CoinSpawnerConfig = {}
  ) {
    this.scene = scene;

    this.economyManager =
      economyManager;

    this.laneWidth =
      Math.max(
        0.1,
        config.laneWidth ?? 4
      );

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          config.laneCount ?? 3
        )
      );

    this.spawnDistance =
      Math.max(
        20,
        config.spawnDistance ?? 180
      );

    this.despawnDistance =
      Math.max(
        20,
        config.despawnDistance ?? 60
      );

    this.coinSpacing =
      Math.max(
        3,
        config.coinSpacing ?? 10
      );

    this.coinHeight =
      Math.max(
        0.5,
        config.coinHeight ?? 1
      );

    this.maxCoins =
      Math.max(
        1,
        Math.floor(
          config.maxCoins ?? 30
        )
      );

    this.getRoadCenterX =
      config.getRoadCenterX ??
      (() => 0);
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number,
    playerPosition: THREE.Vector3
  ): void {
    if (
      deltaTime <= 0 ||
      !Number.isFinite(deltaTime) ||
      !playerPosition
    ) {
      return;
    }

    // -------------------------------------------------------
    // Initial spawn
    // -------------------------------------------------------

    if (!this.initialized) {
  this.nextSpawnZ =
    playerPosition.z -
    this.coinSpacing;

  this.initialized =
    true;
    }
    
    // -------------------------------------------------------
    // Spawn ahead
    // -------------------------------------------------------

    this.spawnAhead(
      playerPosition.z
    );

    // -------------------------------------------------------
    // Update + collect
    // -------------------------------------------------------

    for (
      const coin of this.coins
    ) {
      if (
        coin.isCollected()
      ) {
        continue;
      }

      coin.update(
        deltaTime
      );

      if (
        coin.checkCollection(
          playerPosition
        )
      ) {
        this.collectCoin(
          coin
        );
      }
    }

    // -------------------------------------------------------
    // Remove old coins
    // -------------------------------------------------------

    this.despawnBehind(
      playerPosition.z
    );
  }

  // =========================================================
  // Spawn Ahead
  // =========================================================

  private spawnAhead(
    playerZ: number
  ): void {
    while (
      this.nextSpawnZ >
      playerZ -
        this.spawnDistance
    ) {
      if (
        this.coins.length >=
        this.maxCoins
      ) {
        break;
      }

      this.spawnCoinRow(
        this.nextSpawnZ
      );

      this.nextSpawnZ -=
        this.coinSpacing;
    }
  }

  // =========================================================
  // Spawn Coin Row
  // =========================================================

  private spawnCoinRow(
    worldZ: number
  ): void {
    const lane =
      this.getRandomLane();

    const roadCenterX =
      this.getRoadCenterX(
        worldZ
      );

    const laneOffset =
      this.getLaneOffset(
        lane
      );

    const x =
      roadCenterX +
      laneOffset;

    const coin =
      new CoinPickup({
        x,
        y: this.coinHeight,
        z: worldZ,
        value: 1
      });

    coin.addToScene(
      this.scene
    );

    this.coins.push(
      coin
    );
  }

  // =========================================================
  // Collection
  // =========================================================

  private collectCoin(
    coin: CoinPickup
  ): void {
    const value =
      coin.getValue();

    const success =
      this.economyManager.addCoins(
        value,
        "Road Coin",
        "reward"
      );

    /*
     * Only keep the coin collected
     * when EconomyManager successfully
     * accepts the reward.
     */
    if (!success) {
      return;
    }

    coin.removeFromScene(
      this.scene
    );
  }

  // =========================================================
  // Despawn
  // =========================================================

  private despawnBehind(
    playerZ: number
  ): void {
    for (
      let i =
        this.coins.length - 1;
      i >= 0;
      i--
    ) {
      const coin =
        this.coins[i];

      const coinZ =
        coin.getPosition().z;

      /*
       * Player moves toward -Z.
       *
       * Coins behind the player
       * therefore have a larger Z.
       */
      if (
        coinZ >
        playerZ +
          this.despawnDistance
      ) {
        coin.removeFromScene(
          this.scene
        );

        coin.dispose();

        this.coins.splice(
          i,
          1
        );
      }
    }
  }

  // =========================================================
  // Lane Calculation
  // =========================================================

  private getLaneOffset(
    lane: number
  ): number {
    const centerLane =
      (this.laneCount - 1) /
      2;

    return (
      lane -
      centerLane
    ) *
    this.laneWidth;
  }

  // =========================================================
  // Random Lane
  // =========================================================

  private getRandomLane(): number {
    return Math.floor(
      Math.random() *
        this.laneCount
    );
  }

  // =========================================================
  // Active Coins
  // =========================================================

  public getCoins():
    readonly CoinPickup[] {
    return this.coins;
  }

  public getActiveCoinCount():
    number {
    let count = 0;

    for (
      const coin of this.coins
    ) {
      if (
        !coin.isCollected()
      ) {
        count++;
      }
    }

    return count;
  }

  // =========================================================
  // Reset
  // =========================================================

  public clear(): void {
    for (
      const coin of this.coins
    ) {
      coin.removeFromScene(
        this.scene
      );

      coin.dispose();
    }

    this.coins.length =
      0;

    this.nextSpawnZ = 0;

    this.initialized =
      false;
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    this.clear();
  }
}
