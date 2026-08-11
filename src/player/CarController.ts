import * as THREE from "three";
import { PlayerCar } from "./PlayerCar";

export interface CarControllerConfig {
  laneWidth?: number;
  laneCount?: number;
  steeringSpeed?: number;

  getRoadCenterX?: (
    worldZ: number
  ) => number;

  getRoadWidth?: () => number;
}

export class CarController {
  private readonly playerCar: PlayerCar;

  private readonly laneWidth: number;
  private readonly laneCount: number;
  private readonly steeringSpeed: number;

  private readonly getRoadCenterX: (
    worldZ: number
  ) => number;

  private readonly getRoadWidth: () => number;

  private currentLane: number;
  private targetLaneOffset: number;

  private leftPressed = false;
  private rightPressed = false;

  private readonly maxSteeringAngle =
    THREE.MathUtils.degToRad(14);

  private readonly steeringRotationSpeed = 10;

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

    this.getRoadCenterX =
      config.getRoadCenterX ??
      (() => 0);

    this.getRoadWidth =
      config.getRoadWidth ??
      (() => 12);

    this.currentLane =
      Math.floor(
        this.laneCount / 2
      );

    this.targetLaneOffset =
      this.getLaneOffset(
        this.currentLane
      );

    const initialZ =
      this.playerCar.getPosition().z;

    const roadCenterX =
      this.getRoadCenterX(
        initialZ
      );

    this.playerCar.setX(
      roadCenterX +
      this.targetLaneOffset
    );

    this.playerCar.setRotationY(0);

    this.attachKeyboardControls();
  }

  // =========================================================
  // Lane offset
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
  // Lane movement
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
  // Road-relative target
  // =========================================================

  private getTargetX(): number {
    const playerZ =
      this.playerCar
        .getPosition()
        .z;

    const roadCenterX =
      this.getRoadCenterX(
        playerZ
      );

    let targetX =
      roadCenterX +
      this.targetLaneOffset;

    // -------------------------------------------------------
    // Safety boundary
    // -------------------------------------------------------

    const roadWidth =
      this.getRoadWidth();

    /*
     * Player car is approximately 2.2 world units wide.
     *
     * Keep half of that width away from
     * the road edge.
     */
    const carHalfWidth = 1.1;

    const safeHalfRoadWidth =
      Math.max(
        0,
        roadWidth / 2 -
          carHalfWidth
      );

    const minimumX =
      roadCenterX -
      safeHalfRoadWidth;

    const maximumX =
      roadCenterX +
      safeHalfRoadWidth;

    targetX =
      THREE.MathUtils.clamp(
        targetX,
        minimumX,
        maximumX
      );

    return targetX;
  }

  // =========================================================
  // Estimate road heading
  // =========================================================

  private getRoadHeading(
    worldZ: number
  ): number {
    const sampleDistance = 1;

    const centerBefore =
      this.getRoadCenterX(
        worldZ +
        sampleDistance
      );

    const centerAfter =
      this.getRoadCenterX(
        worldZ -
        sampleDistance
      );

    /*
     * Approximate dx/dz.
     */
    const slope =
      (
        centerAfter -
        centerBefore
      ) /
      (
        -2 *
        sampleDistance
      );

    return Math.atan(slope);
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

    const currentX =
      position.x;

    const targetX =
      this.getTargetX();

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

    // -------------------------------------------------------
    // Steering rotation
    // -------------------------------------------------------

    const lateralVelocity =
      (
        newX -
        currentX
      ) /
      deltaTime;

    const roadHeading =
      this.getRoadHeading(
        position.z
      );

    /*
     * Lane-change steering.
     *
     * Faster lateral movement =
     * slightly stronger steering angle.
     */
    const laneSteering =
      THREE.MathUtils.clamp(
        lateralVelocity * 0.08,
        -this.maxSteeringAngle,
        this.maxSteeringAngle
      );

    const targetRotation =
      roadHeading +
      laneSteering;

    const currentRotation =
      this.playerCar.getRotationY();

    const newRotation =
      THREE.MathUtils.damp(
        currentRotation,
        targetRotation,
        this.steeringRotationSpeed,
        deltaTime
      );

    this.playerCar.setRotationY(
      newRotation
    );
  }

  // =========================================================
  // Getters
  // =========================================================

  public getCurrentLane(): number {
    return this.currentLane;
  }

  public getTargetX(): number {
    return this.getTargetXInternal();
  }

  private getTargetXInternal(): number {
    return this.getTargetX();
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
