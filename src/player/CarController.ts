import * as THREE from "three";
import { PlayerCar } from "./PlayerCar";

export interface CarControllerConfig {
  laneWidth?: number;
  laneCount?: number;
  steeringSpeed?: number;
}

export class CarController {
  private readonly playerCar: PlayerCar;

  private readonly laneWidth: number;
  private readonly laneCount: number;
  private readonly steeringSpeed: number;

  private currentLane: number;
  private targetX: number;

  private leftPressed = false;
  private rightPressed = false;

  constructor(
    playerCar: PlayerCar,
    config: CarControllerConfig = {}
  ) {
    this.playerCar = playerCar;

    this.laneWidth =
      config.laneWidth ?? 4;

    this.laneCount = Math.max(
      1,
      Math.floor(config.laneCount ?? 3)
    );

    this.steeringSpeed =
      config.steeringSpeed ?? 10;

    // Start in center lane
    this.currentLane =
      Math.floor(this.laneCount / 2);

    this.targetX =
      this.getLaneX(this.currentLane);

    this.playerCar.setX(
      this.targetX
    );

    this.attachKeyboardControls();
  }

  // =========================================================
  // Lane X position
  // =========================================================

  private getLaneX(
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
  // Keyboard controls
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

    if (
      event.key === "ArrowLeft" ||
      key === "a"
    ) {
      event.preventDefault();

      if (!this.leftPressed) {
        this.moveLeft();
      }

      this.leftPressed = true;
    }

    if (
      event.key === "ArrowRight" ||
      key === "d"
    ) {
      event.preventDefault();

      if (!this.rightPressed) {
        this.moveRight();
      }

      this.rightPressed = true;
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
      this.leftPressed = false;
    }

    if (
      event.key === "ArrowRight" ||
      key === "d"
    ) {
      this.rightPressed = false;
    }
  };

  // =========================================================
  // Move left
  // =========================================================

  public moveLeft(): void {
    if (
      this.currentLane <= 0
    ) {
      return;
    }

    this.currentLane -= 1;

    this.targetX =
      this.getLaneX(
        this.currentLane
      );
  }

  // =========================================================
  // Move right
  // =========================================================

  public moveRight(): void {
    if (
      this.currentLane >=
      this.laneCount - 1
    ) {
      return;
    }

    this.currentLane += 1;

    this.targetX =
      this.getLaneX(
        this.currentLane
      );
  }

  // =========================================================
  // Update steering
  // =========================================================

  public update(
    deltaTime: number
  ): void {
    if (
      deltaTime <= 0 ||
      !Number.isFinite(deltaTime)
    ) {
      return;
    }

    const currentX =
      this.playerCar
        .getPosition()
        .x;

    const newX =
      THREE.MathUtils.damp(
        currentX,
        this.targetX,
        this.steeringSpeed,
        deltaTime
      );

    this.playerCar.setX(
      newX
    );
  }

  // =========================================================
  // Current lane
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
  // Lane center X
  // =========================================================

  public getLaneCenterX(
    lane: number
  ): number {
    const safeLane =
      THREE.MathUtils.clamp(
        Math.floor(lane),
        0,
        this.laneCount - 1
      );

    return this.getLaneX(
      safeLane
    );
  }

  // =========================================================
  // Get lane width
  // =========================================================

  public getLaneWidth(): number {
    return this.laneWidth;
  }

  // =========================================================
  // Get lane count
  // =========================================================

  public getLaneCount(): number {
    return this.laneCount;
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
