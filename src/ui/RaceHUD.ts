import { PlayerCar } from "../player/PlayerCar";
import { EconomyManager } from "../economy/EconomyManager";

export class RaceHUD {
  private readonly playerCar: PlayerCar;
  private readonly economyManager: EconomyManager;

  private readonly onNitro: () => void;
  private readonly onGarage: () => void;

  // =========================================================
  // HUD Elements
  // =========================================================

  private readonly root: HTMLDivElement;

  private readonly speedPanel: HTMLDivElement;
  private readonly speedValue: HTMLDivElement;
  private readonly speedUnit: HTMLDivElement;

  private readonly coinPanel: HTMLDivElement;
  private readonly coinIcon: HTMLSpanElement;
  private readonly coinValue: HTMLSpanElement;

  private readonly nitroButton: HTMLButtonElement;
  private readonly nitroLabel: HTMLSpanElement;
  private readonly nitroTimer: HTMLSpanElement;

  // =========================================================
  // Garage Button
  // =========================================================

  private readonly garageButton: HTMLButtonElement;

  private disposed = false;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    playerCar: PlayerCar,
    onNitro: () => void,
    economyManager: EconomyManager,
    onGarage: () => void = () => undefined
  ) {
    this.playerCar =
      playerCar;

    this.onNitro =
      onNitro;

    this.economyManager =
      economyManager;

    this.onGarage =
      onGarage;

    // =====================================================
    // Root
    // =====================================================

    this.root =
      document.createElement("div");

    this.root.id =
      "racenova-hud";

    Object.assign(
      this.root.style,
      {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "1000",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        userSelect: "none",
        WebkitUserSelect: "none"
      }
    );

    // =====================================================
    // Speed Panel
    // =====================================================

    this.speedPanel =
      document.createElement("div");

    Object.assign(
      this.speedPanel.style,
      {
        position: "absolute",
        left: "16px",
        bottom: "18px",
        minWidth: "100px",
        padding: "8px 12px",
        borderRadius: "14px",
        background:
          "rgba(0, 0, 0, 0.58)",
        color: "#ffffff",
        textAlign: "center",
        boxSizing: "border-box",
        backdropFilter:
          "blur(6px)",
        WebkitBackdropFilter:
          "blur(6px)"
      }
    );

    // =====================================================
    // Speed Value
    // =====================================================

    this.speedValue =
      document.createElement("div");

    Object.assign(
      this.speedValue.style,
      {
        fontSize: "30px",
        lineHeight: "32px",
        fontWeight: "800",
        letterSpacing: "1px"
      }
    );

    this.speedValue.textContent =
      "0";

    // =====================================================
    // Speed Unit
    // =====================================================

    this.speedUnit =
      document.createElement("div");

    Object.assign(
      this.speedUnit.style,
      {
        marginTop: "2px",
        fontSize: "11px",
        lineHeight: "13px",
        fontWeight: "600",
        opacity: "0.75",
        letterSpacing: "1px"
      }
    );

    this.speedUnit.textContent =
      "KM/H";

    this.speedPanel.appendChild(
      this.speedValue
    );

    this.speedPanel.appendChild(
      this.speedUnit
    );

    // =====================================================
    // Coin Panel
    // =====================================================

    this.coinPanel =
      document.createElement("div");

    Object.assign(
      this.coinPanel.style,
      {
        position: "absolute",
        top: "18px",
        right: "16px",
        minWidth: "92px",
        padding: "8px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "7px",
        borderRadius: "16px",
        background:
          "rgba(0, 0, 0, 0.58)",
        color: "#ffffff",
        boxSizing: "border-box",
        backdropFilter:
          "blur(6px)",
        WebkitBackdropFilter:
          "blur(6px)"
      }
    );

    // =====================================================
    // Coin Icon
    // =====================================================

    this.coinIcon =
      document.createElement("span");

    Object.assign(
      this.coinIcon.style,
      {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        background:
          "#ffd54a",
        color: "#7a4d00",
        fontSize: "14px",
        fontWeight: "900",
        boxShadow:
          "0 1px 5px rgba(0,0,0,0.35)"
      }
    );

    this.coinIcon.textContent =
      "C";

    // =====================================================
    // Coin Value
    // =====================================================

    this.coinValue =
      document.createElement("span");

    Object.assign(
      this.coinValue.style,
      {
        fontSize: "19px",
        lineHeight: "24px",
        fontWeight: "800",
        minWidth: "28px",
        textAlign: "left"
      }
    );

    this.coinValue.textContent =
      "0";

    this.coinPanel.appendChild(
      this.coinIcon
    );

    this.coinPanel.appendChild(
      this.coinValue
    );

    // =====================================================
    // Garage Button
    // =====================================================

    this.garageButton =
      document.createElement("button");

    Object.assign(
      this.garageButton.style,
      {
        position: "absolute",

        /*
         * IMPORTANT:
         *
         * Nitro = bottom 18px
         * Garage = bottom 124px
         *
         * This keeps the two buttons
         * clearly separated.
         */
        right: "18px",
        bottom: "124px",

        width: "92px",
        height: "48px",

        border:
          "1px solid rgba(255,255,255,0.25)",

        borderRadius: "14px",

        background:
          "linear-gradient(135deg, #3478ff, #2253c9)",

        color: "#ffffff",

        fontFamily:
          "Arial, Helvetica, sans-serif",

        fontSize: "13px",

        fontWeight: "900",

        letterSpacing: "0.5px",

        boxShadow:
          "0 5px 18px rgba(0,0,0,0.35)",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        padding: "0",

        margin: "0",

        pointerEvents: "auto",

        touchAction: "manipulation",

        WebkitTapHighlightColor:
          "transparent",

        cursor: "pointer"
      }
    );

    this.garageButton.textContent =
      "GARAGE";

    // =====================================================
    // Nitro Button
    // =====================================================

    this.nitroButton =
      document.createElement("button");

    Object.assign(
      this.nitroButton.style,
      {
        position: "absolute",
        right: "18px",
        bottom: "18px",

        width: "92px",
        height: "92px",

        border:
          "2px solid rgba(255,255,255,0.35)",

        borderRadius: "50%",

        background:
          "linear-gradient(145deg, #ff5a1f, #d71900)",

        color: "#ffffff",

        display: "flex",

        flexDirection: "column",

        alignItems: "center",

        justifyContent: "center",

        gap: "2px",

        padding: "0",

        margin: "0",

        fontFamily:
          "Arial, Helvetica, sans-serif",

        boxShadow:
          "0 5px 18px rgba(0,0,0,0.35)",

        pointerEvents: "auto",

        touchAction: "manipulation",

        WebkitTapHighlightColor:
          "transparent",

        cursor: "pointer"
      }
    );

    // =====================================================
    // Nitro Label
    // =====================================================

    this.nitroLabel =
      document.createElement("span");

    Object.assign(
      this.nitroLabel.style,
      {
        fontSize: "15px",
        lineHeight: "18px",
        fontWeight: "900",
        letterSpacing: "1px"
      }
    );

    this.nitroLabel.textContent =
      "NITRO";

    // =====================================================
    // Nitro Timer
    // =====================================================

    this.nitroTimer =
      document.createElement("span");

    Object.assign(
      this.nitroTimer.style,
      {
        fontSize: "11px",
        lineHeight: "14px",
        fontWeight: "700",
        opacity: "0.9"
      }
    );

    this.nitroTimer.textContent =
      "READY";

    this.nitroButton.appendChild(
      this.nitroLabel
    );

    this.nitroButton.appendChild(
      this.nitroTimer
    );

    // =====================================================
    // Add HUD To DOM
    // =====================================================

    this.root.appendChild(
      this.speedPanel
    );

    this.root.appendChild(
      this.coinPanel
    );

    this.root.appendChild(
      this.garageButton
    );

    this.root.appendChild(
      this.nitroButton
    );

    document.body.appendChild(
      this.root
    );

    // =====================================================
    // Garage Button Event
    // =====================================================

    this.garageButton.addEventListener(
      "pointerdown",
      this.handleGaragePointerDown
    );

    this.garageButton.addEventListener(
      "click",
      this.handleGarageClick
    );

    // =====================================================
    // Nitro Button Events
    // =====================================================

    this.nitroButton.addEventListener(
      "pointerdown",
      this.handleNitroPointerDown
    );

    this.nitroButton.addEventListener(
      "click",
      this.handleNitroClick
    );

    // =====================================================
    // Initial Update
    // =====================================================

    this.update();
  }

  // =========================================================
  // Garage Pointer
  // =========================================================

  private handleGaragePointerDown = (
    event: PointerEvent
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    this.onGarage();
  };

  // =========================================================
  // Garage Click
  // =========================================================

  private handleGarageClick = (
    event: MouseEvent
  ): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  // =========================================================
  // Nitro Pointer
  // =========================================================

  private handleNitroPointerDown = (
    event: PointerEvent
  ): void => {
    event.preventDefault();
    event.stopPropagation();

    this.onNitro();
  };

  // =========================================================
  // Nitro Click
  // =========================================================

  private handleNitroClick = (
    event: MouseEvent
  ): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  // =========================================================
  // Update
  // =========================================================

  public update(): void {
    if (
      this.disposed
    ) {
      return;
    }

    // =====================================================
    // Speed
    // =====================================================

    const speed =
      this.playerCar.getSpeed();

    const safeSpeed =
      Number.isFinite(speed)
        ? Math.max(0, speed)
        : 0;

    this.speedValue.textContent =
      Math.round(
        safeSpeed
      ).toString();

    // =====================================================
    // Coins
    // =====================================================

    const coins =
      this.economyManager.getCoins();

    const safeCoins =
      Number.isFinite(coins)
        ? Math.max(0, coins)
        : 0;

    this.coinValue.textContent =
      Math.floor(
        safeCoins
      ).toString();

    // =====================================================
    // Nitro
    // =====================================================

    const nitroActive =
      this.playerCar.isNitroActive();

    const nitroRemaining =
      this.playerCar.getNitroTimeRemaining();

    const nitroDuration =
      this.playerCar.getNitroDuration();

    if (
      nitroActive
    ) {
      this.nitroLabel.textContent =
        "NITRO";

      this.nitroTimer.textContent =
        `${nitroRemaining.toFixed(1)}s`;

      this.nitroButton.style.opacity =
        "0.95";

      this.nitroButton.style.transform =
        "scale(1.05)";
    } else {
      this.nitroLabel.textContent =
        "NITRO";

      this.nitroTimer.textContent =
        nitroDuration > 0
          ? "READY"
          : "OFF";

      this.nitroButton.style.opacity =
        "1";

      this.nitroButton.style.transform =
        "scale(1)";
    }
  }

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    if (
      this.disposed
    ) {
      return;
    }

    this.disposed =
      true;

    // =====================================================
    // Garage Events
    // =====================================================

    this.garageButton.removeEventListener(
      "pointerdown",
      this.handleGaragePointerDown
    );

    this.garageButton.removeEventListener(
      "click",
      this.handleGarageClick
    );

    // =====================================================
    // Nitro Events
    // =====================================================

    this.nitroButton.removeEventListener(
      "pointerdown",
      this.handleNitroPointerDown
    );

    this.nitroButton.removeEventListener(
      "click",
      this.handleNitroClick
    );

    // =====================================================
    // Remove HUD
    // =====================================================

    if (
      this.root.parentElement
    ) {
      this.root.parentElement.removeChild(
        this.root
      );
    }
  }
}
