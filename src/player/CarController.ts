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

    this.laneWidth = config.laneWidth ?? 4;
    this.laneCount = Math.max(
      1,
      Math.floor(config.laneCount ?? 3)
    );

    this.steeringSpeed =
      config.steeringSpeed ?? 10;

    this.currentLane =
      Math.floor(this.laneCount / 2);

    this.targetX =
      this.getLaneX(this.currentLane);

    this.playerCar.setX(this.targetX);

    this.attachKeyboardControls();
  }

  private getLaneX(lane: number): number {
    const centerLane =
      (this.laneCount - 1) / 2;

    return (
      (lane - centerLane) *
      this.laneWidth
    );
  }

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
    if (
      event.key === "ArrowLeft" ||
      event.key.toLowerCase() === "a"
    ) {
      event.preventDefault();

      if (!this.leftPressed) {
        this.moveLeft();
      }

      this.leftPressed = true;
    }

    if (
      event.key === "ArrowRight" ||
      event.key.toLowerCase() === "d"
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
    if (
      event.key === "ArrowLeft" ||
      event.key.toLowerCase() === "a"
    ) {
      this.leftPressed = false;
    }

    if (
      event.key === "ArrowRight" ||
      event.key.toLowerCase() === "d"
    ) {
      this.rightPressed = false;
    }
  };

  public moveLeft(): void {
    if (this.currentLane <= 0) {
      return;
    }

    this.currentLane -= 1;

    this.targetX =
      this.getLaneX(this.currentLane);
  }

  public moveRight(): void {
    if (
      this.currentLane >=
      this.laneCount - 1
    ) {
      return;
    }

    this.currentLane += 1;

    this.targetX =
      this.getLaneX(this.currentLane);
  }

  public update(
    deltaTime: number
  ): void {
    if (deltaTime <= 0) {
      return;
    }

    const currentX =
      this.playerCar.getPosition().x;

    const newX =
      THREE.MathUtils.damp(
        currentX,
        this.targetX,
        this.steeringSpeed,
        deltaTime
      );

    this.playerCar.setX(newX);
  }

  public getCurrentLane(): number {
    return this.currentLane;
  }

  public getTargetX(): number {
    return this.targetX;
  }

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
