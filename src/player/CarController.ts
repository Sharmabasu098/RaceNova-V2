import * as THREE from "three";
import { PlayerCar } from "./PlayerCar";

export interface CarControllerConfig {
  laneWidth?: number;
  laneCount?: number;
  steeringSpeed?: number;

  /*
   * Function supplied by World.
   *
   * It returns the road center X
   * at the player's current Z position.
   */
  getRoadCenterX?: (
    worldZ: number
  ) => number;
}

export class CarController {
  private readonly playerCar: PlayerCar;

  private readonly laneWidth: number;
  private readonly laneCount: number;
  private readonly steeringSpeed: number;

  private readonly getRoadCenterX: (
    worldZ: number
  ) => number;

  private currentLane: number;

  /*
   * Lane offset relative to road center.
   *
   * Example for 3 lanes:
   *
   * lane 0 = -4
   * lane 1 =  0
   * lane 2 = +4
   */
  private targetLaneOffset: number;

  private leftPressed = false;
  private rightPressed = false;

  constructor(
    playerCar: PlayerCar,
    config: CarControllerConfig = {}
  ) {
    this.playerCar = playerCar;

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
      config.steeringSpeed ?? 10;

    /*
     * If World is not supplied,
     * use a straight-road fallback.
     */
    this.getRoadCenterX =
      config.getRoadCenterX ??
      (() => 0);

    this.currentLane =
      Math.floor(
        this.laneCount / 2
      );

    this.targetLaneOffset =
      this.getLaneOffset(
        this.currentLane
      );

    /*
     * Start car at the correct
     * center position.
     */
    const initialZ =
      this.playerCar.getPosition().z;

    const initialRoadCenter =
      this.getRoadCenterX(
        initialZ
      );

    this.playerCar.setX(
      initialRoadCenter +
      this.targetLaneOffset
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

  // =========================================================
  // Move Left
  // =========================================================

  public moveLeft(): void {
    if (
      this.currentLane <= 0
    ) {
      return;
    }

    this.currentLane -= 1;

    this.targetLaneOffset =
      this.getLaneOffset(
        this.currentLane
      );
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

    this.currentLane += 1;

    this.targetLaneOffset =
      this.getLaneOffset(
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

    const position =
      this.playerCar.getPosition();

    /*
     * Get the road center at the
     * player's CURRENT Z position.
     */
    const roadCenterX =
      this.getRoadCenterX(
        position.z
      );

    /*
     * Final target position:
     *
     * Road center
     * +
     * selected lane offset
     */
    const targetX =
      roadCenterX +
      this.targetLaneOffset;

    const currentX =
      position.x;

    const newX =
      THREE.MathUtils.damp(
        currentX,
        targetX,
        this.steeringSpeed,
        deltaTime
      );

    this.playerCar.setX(
      newX
    );
  }

  // =========================================================
  // Get Current Lane
  // =========================================================

  public getCurrentLane(): number {
    return this.currentLane;
  }

  // =========================================================
  // Get Target Lane Offset
  // =========================================================

  public getTargetX(): number {
    const playerZ =
      this.playerCar
        .getPosition()
        .z;

    return (
      this.getRoadCenterX(
        playerZ
      ) +
      this.targetLaneOffset
    );
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
