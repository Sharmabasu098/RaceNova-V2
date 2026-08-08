import { CarController } from "./CarController";

export interface SwipeControllerConfig {
  swipeThreshold?: number;
  target?: HTMLElement;
}

export class SwipeController {
  private readonly carController: CarController;
  private readonly swipeThreshold: number;
  private readonly target: HTMLElement;

  private startX = 0;
  private startY = 0;
  private tracking = false;

  constructor(
    carController: CarController,
    config: SwipeControllerConfig = {}
  ) {
    this.carController = carController;

    this.swipeThreshold =
      config.swipeThreshold ?? 50;

    this.target =
      config.target ?? document.body;

    this.attachEvents();
  }

  private attachEvents(): void {
    this.target.addEventListener(
      "touchstart",
      this.handleTouchStart,
      { passive: true }
    );

    this.target.addEventListener(
      "touchend",
      this.handleTouchEnd,
      { passive: true }
    );
  }

  private handleTouchStart = (
    event: TouchEvent
  ): void => {
    const touch = event.changedTouches[0];

    if (!touch) {
      return;
    }

    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.tracking = true;
  };

  private handleTouchEnd = (
    event: TouchEvent
  ): void => {
    if (!this.tracking) {
      return;
    }

    const touch = event.changedTouches[0];

    if (!touch) {
      this.tracking = false;
      return;
    }

    const deltaX =
      touch.clientX - this.startX;

    const deltaY =
      touch.clientY - this.startY;

    this.tracking = false;

    // Ignore small movements.
    if (
      Math.abs(deltaX) <
        this.swipeThreshold &&
      Math.abs(deltaY) <
        this.swipeThreshold
    ) {
      return;
    }

    // Only horizontal swipes control steering.
    if (
      Math.abs(deltaX) <=
      Math.abs(deltaY)
    ) {
      return;
    }

    if (deltaX < 0) {
      this.carController.moveLeft();
    } else {
      this.carController.moveRight();
    }
  };

  public dispose(): void {
    this.target.removeEventListener(
      "touchstart",
      this.handleTouchStart
    );

    this.target.removeEventListener(
      "touchend",
      this.handleTouchEnd
    );

    this.tracking = false;
  }
  }
