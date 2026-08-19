import * as THREE from "three";
import { PlayerCar } from "./PlayerCar";

export interface CarControllerConfig {
  laneWidth?: number;
  laneCount?: number;
  steeringSpeed?: number;
  getRoadCenterX?: (worldZ: number) => number;
}

export class CarController {
  private readonly playerCar: PlayerCar;

  private readonly laneWidth: number;
  private readonly laneCount: number;
  private readonly steeringSpeed: number;

  private readonly getRoadCenterX:
    (worldZ: number) => number;

  private currentLane: number;
  private targetX: number;

  private leftPressed = false;
  private rightPressed = false;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    playerCar: PlayerCar,
    config: CarControllerConfig = {}
  ) {
    this.playerCar =
      playerCar;

    this.laneWidth =
      config.laneWidth ?? 4;

    this.laneCount =
      Math.max(
        1,
        Math.floor(
          config.laneCount ?? 3
        )
      );

    this.steeringSpeed =
      Math.max(
        0.1,
        config.steeringSpeed ?? 10
      );

    this.getRoadCenterX =
      config.getRoadCenterX ??
      (() => 0);

    // =====================================================
    // Start in center lane
    // =====================================================

    this.currentLane =
      Math.floor(
        this.laneCount / 2
      );

    this.targetX =
      this.calculateTargetX();

    this.playerCar.setX(
      this.targetX
    );

    this.attachKeyboardControls();
  }

  // =========================================================
  // Lane Offset
  // =========================================================

  private getLaneOffset(
    lane: number
  ): number {
    const centerLane =
      (this.laneCount - 1) / 2;

    return (
      (lane - centerLane) *
      this.laneWidth
    );
  }

  // =========================================================
  // Target X
  // =========================================================

  private calculateTargetX(): number {
    const playerZ =
      this.playerCar
        .getPosition()
        .z;

    return (
      this.getRoadCenterX(
        playerZ
      ) +
      this.getLaneOffset(
        this.currentLane
      )
    );
  }

  // =========================================================
  // Handling Multiplier
  // =========================================================

  /**
   * Converts the PlayerCar handling stat
   * into a controlled steering multiplier.
   *
   * Handling 5 = 1.0x baseline.
   *
   * Lower handling:
   * - slower steering response
   *
   * Higher handling:
   * - faster steering response
   *
   * The multiplier is clamped so that
   * upgrades cannot make steering unstable.
   */
  private getHandlingMultiplier(): number {
    const handling =
      this.playerCar.getHandling();

    if (
      !Number.isFinite(
        handling
      )
    ) {
      return 1;
    }

    const multiplier =
      handling / 5;

    return THREE.MathUtils.clamp(
      multiplier,
      0.65,
      1.35
    );
  }

  // =========================================================
  // Effective Steering Speed
  // =========================================================

  private calculateEffectiveSteeringSpeed(): number {
    const handlingMultiplier =
      this.getHandlingMultiplier();

    return (
      this.steeringSpeed *
      handlingMultiplier
    );
  }

  // =========================================================
  // Keyboard Controls
  // =========================================================

  private attachKeyboardControls(): void {
    window.addEventListener(
      "keydown",
      this.handleKeyDown
    );

    window.addEventListener(
      "keyup",
      this.handleKeyUp
    );
  }

  private handleKeyDown = (
    event: KeyboardEvent
  ): void => {
    const key =
      event.key.toLowerCase();

    // -----------------------------------------------------
    // Left
    // -----------------------------------------------------

    if (
      event.key === "ArrowLeft" ||
      key === "a"
    ) {
      event.preventDefault();

      if (
        !this.leftPressed
      ) {
        this.moveLeft();
      }

      this.leftPressed =
        true;
    }

    // -----------------------------------------------------
    // Right
    // -----------------------------------------------------

    if (
      event.key === "ArrowRight" ||
      key === "d"
    ) {
      event.preventDefault();

      if (
        !this.rightPressed
      ) {
        this.moveRight();
      }

      this.rightPressed =
        true;
    }
  };

  private handleKeyUp = (
    event: KeyboardEvent
  ): void => {
    const key =
      event.key.toLowerCase();

    if (
      event.key === "ArrowLeft" ||
      key === "a"
    ) {
      this.leftPressed =
        false;
    }

    if (
      event.key === "ArrowRight" ||
      key === "d"
    ) {
      this.rightPressed =
        false;
    }
  };

  // =========================================================
  // Move Left
  // =========================================================

  public moveLeft(): void {
    if (
      this.currentLane <= 0
    ) {
      return;
    }

    this.currentLane -=
      1;

    this.targetX =
      this.calculateTargetX();
  }

  // =========================================================
  // Move Right
  // =========================================================

  public moveRight(): void {
    if (
      this.currentLane >=
      this.laneCount - 1
    ) {
      return;
    }

    this.currentLane +=
      1;

    this.targetX =
      this.calculateTargetX();
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
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

    // =====================================================
    // Recalculate road-relative target
    // =====================================================

    this.targetX =
      this.calculateTargetX();

    // =====================================================
    // Current Position
    // =====================================================

    const currentX =
      this.playerCar
        .getPosition()
        .x;

    // =====================================================
    // Handling-aware Steering
    // =====================================================

    const effectiveSteeringSpeed =
      this.calculateEffectiveSteeringSpeed();

    const newX =
      THREE.MathUtils.damp(
        currentX,
        this.targetX,
        effectiveSteeringSpeed,
        deltaTime
      );

    this.playerCar.setX(
      newX
    );
  }

  // =========================================================
  // Current Lane
  // =========================================================

  public getCurrentLane(): number {
    return this.currentLane;
  }

  // =========================================================
  // Target X
  // =========================================================

  public getTargetX(): number {
    return this.targetX;
  }

  // =========================================================
  // Effective Steering Speed
  // =========================================================

  public getEffectiveSteeringSpeed(): number {
    return this.calculateEffectiveSteeringSpeed();
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    window.removeEventListener(
      "keydown",
      this.handleKeyDown
    );

    window.removeEventListener(
      "keyup",
      this.handleKeyUp
    );
  }
}
