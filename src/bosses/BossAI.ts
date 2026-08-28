/**
 * ============================================================
 * RaceNova V2
 * Boss AI
 * M6.7.1
 * ============================================================
 *
 * FIXED M6.9:
 *
 * - Boss uses RaceNova forward direction (-Z)
 * - Boss no longer moves from front to back
 * - Player/Boss share the same world direction
 * - Safe lane movement
 * - Player pursuit
 * - Stable speed control
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No localStorage dependency
 * - No SaveSystem dependency
 * - No Economy dependency
 * - No race progression dependency
 *
 * RaceNova world direction:
 *
 *        -Z
 *         ↑
 *         │
 *       BOSS
 *         │
 *       PLAYER
 *
 * Both Player and Boss move toward -Z.
 * ============================================================
 */

// ============================================================
// Boss AI Configuration
// ============================================================

export interface BossAIConfig {

  /**
   * Number of available road lanes.
   *
   * RaceNova uses 3 lanes.
   *
   * 0 = left
   * 1 = center
   * 2 = right
   */
  laneCount?: number;

  /**
   * Distance between lanes.
   */
  laneWidth?: number;

  /**
   * Lateral lane-change speed.
   */
  laneChangeSpeed?: number;

  /**
   * Minimum time between automatic
   * lane changes.
   */
  laneChangeCooldown?: number;

  /**
   * Distance at which Boss notices
   * the player.
   */
  playerAwarenessDistance?: number;

  /**
   * Distance at which Boss starts
   * aggressive lane pursuit.
   */
  pursuitDistance?: number;

  /**
   * Maximum Boss speed in km/h.
   */
  maxSpeed?: number;

  /**
   * Boss acceleration in km/h/s.
   */
  acceleration?: number;
}

// ============================================================
// Boss AI State
// ============================================================

export interface BossAIState {

  /**
   * Current lane.
   */
  currentLane: number;

  /**
   * Desired lane.
   */
  targetLane: number;

  /**
   * Current lateral position.
   */
  x: number;

  /**
   * Current world Z position.
   *
   * RaceNova forward direction = -Z.
   */
  z: number;

  /**
   * Current speed in km/h.
   */
  speed: number;

  /**
   * Whether Boss currently sees
   * and is reacting to the player.
   */
  pursuing: boolean;

  /**
   * Remaining lane-change cooldown.
   */
  laneChangeCooldown: number;
}

// ============================================================
// Defaults
// ============================================================

const DEFAULT_LANE_COUNT =
  3;

const DEFAULT_LANE_WIDTH =
  4;

const DEFAULT_LANE_CHANGE_SPEED =
  8;

const DEFAULT_LANE_CHANGE_COOLDOWN =
  1.25;

const DEFAULT_PLAYER_AWARENESS_DISTANCE =
  90;

const DEFAULT_PURSUIT_DISTANCE =
  45;

const DEFAULT_MAX_SPEED =
  120;

const DEFAULT_ACCELERATION =
  35;

// ============================================================
// Boss AI
// ============================================================

export class BossAI {

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly laneCount:
    number;

  private readonly laneWidth:
    number;

  private readonly laneChangeSpeed:
    number;

  private readonly laneChangeCooldownDuration:
    number;

  private readonly playerAwarenessDistance:
    number;

  private readonly pursuitDistance:
    number;

  private readonly maxSpeed:
    number;

  private readonly acceleration:
    number;

  // ==========================================================
  // State
  // ==========================================================

  private state:
    BossAIState;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    initialLane: number = 1,
    initialZ: number = -80,
    config: BossAIConfig = {}
  ) {

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          Number.isFinite(
            config.laneCount
          )
            ? config.laneCount!
            : DEFAULT_LANE_COUNT
        )
      );

    this.laneWidth =
      Math.max(
        0.1,
        Number.isFinite(
          config.laneWidth
        )
          ? config.laneWidth!
          : DEFAULT_LANE_WIDTH
      );

    this.laneChangeSpeed =
      Math.max(
        0.1,
        Number.isFinite(
          config.laneChangeSpeed
        )
          ? config.laneChangeSpeed!
          : DEFAULT_LANE_CHANGE_SPEED
      );

    this.laneChangeCooldownDuration =
      Math.max(
        0,
        Number.isFinite(
          config.laneChangeCooldown
        )
          ? config.laneChangeCooldown!
          : DEFAULT_LANE_CHANGE_COOLDOWN
      );

    this.playerAwarenessDistance =
      Math.max(
        0,
        Number.isFinite(
          config.playerAwarenessDistance
        )
          ? config.playerAwarenessDistance!
          : DEFAULT_PLAYER_AWARENESS_DISTANCE
      );

    this.pursuitDistance =
      Math.max(
        0,
        Number.isFinite(
          config.pursuitDistance
        )
          ? config.pursuitDistance!
          : DEFAULT_PURSUIT_DISTANCE
      );

    this.maxSpeed =
      Math.max(
        0,
        Number.isFinite(
          config.maxSpeed
        )
          ? config.maxSpeed!
          : DEFAULT_MAX_SPEED
      );

    this.acceleration =
      Math.max(
        0,
        Number.isFinite(
          config.acceleration
        )
          ? config.acceleration!
          : DEFAULT_ACCELERATION
      );

    const safeLane =
      this.clampLane(
        initialLane
      );

    this.state = {

      currentLane:
        safeLane,

      targetLane:
        safeLane,

      x:
        this.getLaneX(
          safeLane
        ),

      z:
        Number.isFinite(
          initialZ
        )
          ? initialZ!
          : -80,

      speed:
        0,

      pursuing:
        false,

      laneChangeCooldown:
        0
    };
  }

  // ==========================================================
  // Update
  // ==========================================================

  public update(
    deltaTime: number,
    playerX?: number,
    playerZ?: number
  ): void {

    if (
      !Number.isFinite(
        deltaTime
      ) ||
      deltaTime <= 0
    ) {
      return;
    }

    // --------------------------------------------------------
    // Lane-change cooldown
    // --------------------------------------------------------

    this.state.laneChangeCooldown =
      Math.max(
        0,
        this.state.laneChangeCooldown -
          deltaTime
      );

    // --------------------------------------------------------
    // Player awareness
    // --------------------------------------------------------

    if (
      Number.isFinite(playerX) &&
      Number.isFinite(playerZ)
    ) {

      const longitudinalDistance =
        Math.abs(
          playerZ! -
          this.state.z
        );

      this.state.pursuing =
        longitudinalDistance <=
        this.playerAwarenessDistance;

      if (
        this.state.pursuing
      ) {

        this.updatePursuit(
          playerX!,
          playerZ!
        );
      }
    } else {

      this.state.pursuing =
        false;
    }

    // --------------------------------------------------------
    // Boss acceleration
    // --------------------------------------------------------

    this.updateSpeed(
      deltaTime
    );

    // --------------------------------------------------------
    // Boss lane movement
    // --------------------------------------------------------

    this.updateLaneMovement(
      deltaTime
    );

    // --------------------------------------------------------
    // Boss forward movement
    // --------------------------------------------------------
    //
    // CRITICAL FIX:
    //
    // RaceNova PlayerCar moves:
    //
    //   position.z -= speed
    //
    // Therefore Boss must ALSO move:
    //
    //   z -= speed
    //
    // This keeps Boss and Player travelling
    // in the same forward direction.
    // --------------------------------------------------------

    const worldSpeed =
      this.state.speed /
      3.6;

    this.state.z -=
      worldSpeed *
      deltaTime;
  }

  // ==========================================================
  // Pursuit
  // ==========================================================

  private updatePursuit(
    playerX: number,
    playerZ: number
  ): void {

    const distance =
      Math.abs(
        playerZ -
        this.state.z
      );

    const playerLane =
      this.getNearestLane(
        playerX
      );

    // --------------------------------------------------------
    // Close range:
    // aggressively follow player's lane.
    // --------------------------------------------------------

    if (
      distance <=
      this.pursuitDistance
    ) {

      this.setTargetLane(
        playerLane
      );

      return;
    }

    // --------------------------------------------------------
    // Medium range:
    // react to player's lane if different.
    // --------------------------------------------------------

    if (
      playerLane !==
      this.state.currentLane
    ) {

      this.setTargetLane(
        playerLane
      );
    }
  }

  // ==========================================================
  // Speed Update
  // ==========================================================

  private updateSpeed(
    deltaTime: number
  ): void {

    const speedDifference =
      this.maxSpeed -
      this.state.speed;

    if (
      Math.abs(
        speedDifference
      ) < 0.01
    ) {

      this.state.speed =
        this.maxSpeed;

      return;
    }

    const accelerationStep =
      this.acceleration *
      deltaTime;

    if (
      speedDifference > 0
    ) {

      this.state.speed =
        Math.min(
          this.maxSpeed,
          this.state.speed +
            accelerationStep
        );

    } else {

      this.state.speed =
        Math.max(
          this.maxSpeed,
          this.state.speed -
            accelerationStep
        );
    }
  }

  // ==========================================================
  // Lane Movement
  // ==========================================================

  private updateLaneMovement(
    deltaTime: number
  ): void {

    const targetX =
      this.getLaneX(
        this.state.targetLane
      );

    const difference =
      targetX -
      this.state.x;

    if (
      Math.abs(
        difference
      ) < 0.01
    ) {

      this.state.x =
        targetX;

      this.state.currentLane =
        this.state.targetLane;

      return;
    }

    const movement =
      this.laneChangeSpeed *
      deltaTime;

    if (
      Math.abs(
        difference
      ) <= movement
    ) {

      this.state.x =
        targetX;

      this.state.currentLane =
        this.state.targetLane;

      return;
    }

    this.state.x +=
      Math.sign(
        difference
      ) *
      movement;

    this.state.currentLane =
      this.getNearestLane(
        this.state.x
      );
  }

  // ==========================================================
  // Set Target Lane
  // ==========================================================

  public setTargetLane(
    lane: number
  ): boolean {

    const safeLane =
      this.clampLane(
        lane
      );

    if (
      safeLane ===
      this.state.targetLane
    ) {
      return false;
    }

    if (
      this.state.laneChangeCooldown >
      0
    ) {
      return false;
    }

    this.state.targetLane =
      safeLane;

    this.state.laneChangeCooldown =
      this.laneChangeCooldownDuration;

    return true;
  }

  // ==========================================================
  // Force Lane
  // ==========================================================

  public forceLane(
    lane: number
  ): void {

    const safeLane =
      this.clampLane(
        lane
      );

    this.state.currentLane =
      safeLane;

    this.state.targetLane =
      safeLane;

    this.state.x =
      this.getLaneX(
        safeLane
      );

    this.state.laneChangeCooldown =
      0;
  }

  // ==========================================================
  // Set Position
  // ==========================================================

  public setPosition(
    x: number,
    z: number
  ): void {

    if (
      Number.isFinite(x)
    ) {

      this.state.x =
        x;
    }

    if (
      Number.isFinite(z)
    ) {

      this.state.z =
        z;
    }

    this.state.currentLane =
      this.getNearestLane(
        this.state.x
      );

    this.state.targetLane =
      this.state.currentLane;

    this.state.laneChangeCooldown =
      0;
  }

  // ==========================================================
  // Set Speed
  // ==========================================================

  public setSpeed(
    speed: number
  ): void {

    if (
      !Number.isFinite(
        speed
      )
    ) {
      return;
    }

    this.state.speed =
      Math.max(
        0,
        Math.min(
          this.maxSpeed,
          speed
        )
      );
  }

  // ==========================================================
  // Get State
  // ==========================================================

  public getState():
    BossAIState {

    return {
      ...this.state
    };
  }

  // ==========================================================
  // Get X
  // ==========================================================

  public getX(): number {

    return this.state.x;
  }

  // ==========================================================
  // Get Z
  // ==========================================================

  public getZ(): number {

    return this.state.z;
  }

  // ==========================================================
  // Get Speed
  // ==========================================================

  public getSpeed(): number {

    return this.state.speed;
  }

  // ==========================================================
  // Get Current Lane
  // ==========================================================

  public getCurrentLane(): number {

    return this.state.currentLane;
  }

  // ==========================================================
  // Get Target Lane
  // ==========================================================

  public getTargetLane(): number {

    return this.state.targetLane;
  }

  // ==========================================================
  // Is Pursuing
  // ==========================================================

  public isPursuing(): boolean {

    return this.state.pursuing;
  }

  // ==========================================================
  // Get Lane X
  // ==========================================================

  public getLaneX(
    lane: number
  ): number {

    const safeLane =
      this.clampLane(
        lane
      );

    const centerLane =
      (this.laneCount - 1) /
      2;

    return (
      safeLane -
      centerLane
    ) *
    this.laneWidth;
  }

  // ==========================================================
  // Get Nearest Lane
  // ==========================================================

  public getNearestLane(
    x: number
  ): number {

    if (
      !Number.isFinite(x)
    ) {
      return 0;
    }

    let nearestLane =
      0;

    let nearestDistance =
      Number.POSITIVE_INFINITY;

    for (
      let lane = 0;
      lane < this.laneCount;
      lane++
    ) {

      const laneX =
        this.getLaneX(
          lane
        );

      const distance =
        Math.abs(
          x -
          laneX
        );

      if (
        distance <
        nearestDistance
      ) {

        nearestDistance =
          distance;

        nearestLane =
          lane;
      }
    }

    return nearestLane;
  }

  // ==========================================================
  // Clamp Lane
  // ==========================================================

  private clampLane(
    lane: number
  ): number {

    if (
      !Number.isFinite(
        lane
      )
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        this.laneCount - 1,
        Math.floor(
          lane
        )
      )
    );
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(
    lane: number = 1,
    z: number = -80
  ): void {

    const safeLane =
      this.clampLane(
        lane
      );

    this.state = {

      currentLane:
        safeLane,

      targetLane:
        safeLane,

      x:
        this.getLaneX(
          safeLane
        ),

      z:
        Number.isFinite(z)
          ? z
          : -80,

      speed:
        0,

      pursuing:
        false,

      laneChangeCooldown:
        0
    };
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  public dispose(): void {

    /*
     * BossAI owns no external resources.
     *
     * No Three.js resources.
     * No DOM listeners.
     * No timers.
     * No storage.
     *
     * Nothing to dispose.
     */
  }
}
