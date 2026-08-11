import * as THREE from "three";
import { PlayerCar } from "./PlayerCar";

export interface CarControllerConfig {
  laneWidth?: number;
  laneCount?: number;
  steeringSpeed?: number;

  // Current road center X at player's Z position
  getRoadCenterX?: (worldZ: number) => number;
}

export class CarController {
  private readonly playerCar: PlayerCar;

  private readonly laneWidth: number;
  private readonly laneCount: number;
  private readonly steeringSpeed: number;

  private readonly getRoadCenterX:
    | ((worldZ: number) => number)
    | null;

  private currentLane: number;

  private targetRoadOffsetX = 0;
  private targetX = 0;

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
      Math.floor(
        config.laneCount ?? 3
      )
    );

    this.steeringSpeed =
      config.steeringSpeed ?? 10;

    this.getRoadCenterX =
      config.getRoadCenterX ?? null;

    // Start in center lane
    this.currentLane =
      Math.floor(
        this.laneCount / 2
      );

    this.targetRoadOffsetX =
      this.getLaneOffsetX(
        this.currentLane
      );

    const initialRoadCenterX =
      this.getCurrentRoadCenterX();

    this.targetX =
      initialRoadCenterX +
      this.targetRoadOffsetX;

    this.playerCar.setX(
      this.targetX
    );

    this.attachKeyboardControls();
  }

  // =========================================================
  // Lane offset relative to road center
  // =========================================================

  private getLaneOffsetX(
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
  // Current road center
  // =========================================================

  private getCurrentRoadCenterX(): number {
    if (!this.getRoadCenterX) {
      return 0;
    }

    const playerZ =
      this.playerCar.getPosition().z;

    const roadCenterX =
      this.getRoadCenterX(
        playerZ
      );

    return Number.isFinite(
      roadCenterX
    )
      ? roadCenterX
      : 0;
  }

  // =========================================================
  // Keyboard
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

    this.targetRoadOffsetX =
      this.getLaneOffsetX(
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

    this.targetRoadOffsetX =
      this.getLaneOffsetX(
        this.currentLane
      );
  }

  // =========================================================
  // Update
  // =========================================================

  public update(
    deltaTime: number
  ): void {
    if (
      deltaTime <= 0
    ) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Road center moves when the road curves.
     *
     * Therefore target X must be recalculated
     * every frame.
     */
    const roadCenterX =
      this.getCurrentRoadCenterX();

    this.targetX =
      roadCenterX +
      this.targetRoadOffsetX;

    const currentX =
      this.playerCar.getPosition().x;

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
  // Getters
  // =========================================================

  public getCurrentLane(): number {
    return this.currentLane;
  }

  public getTargetX(): number {
    return this.targetX;
  }

  public getTargetRoadOffsetX(): number {
    return this.targetRoadOffsetX;
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
