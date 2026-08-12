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
  private readonly getRoadCenterX: (worldZ: number) => number;

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

    this.getRoadCenterX =
      config.getRoadCenterX ?? (() => 0);

    this.currentLane =
      Math.floor(this.laneCount / 2);

    this.targetX =
      this.calculateTargetX();

    this.playerCar.setX(this.targetX);

    this.attachKeyboardControls();
  }

  private getLaneOffset(lane: number): number {
    const centerLane =
      (this.laneCount - 1) / 2;

    return (
      (lane - centerLane) *
      this.laneWidth
    );
  }

  private calculateTargetX(): number {
    const playerZ =
      this.playerCar.getPosition().z;

    return (
      this.getRoadCenterX(playerZ) +
      this.getLaneOffset(this.currentLane)
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
    const key = event.key.toLowerCase();

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
    const key = event.key.toLowerCase();

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

  public moveLeft(): void {
    if (this.currentLane <= 0) {
      return;
    }

    this.currentLane -= 1;
    this.targetX =
      this.calculateTargetX();
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
      this.calculateTargetX();
  }

  public update(deltaTime: number): void {
    if (deltaTime <= 0) {
      return;
    }

    this.targetX =
      this.calculateTargetX();

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
