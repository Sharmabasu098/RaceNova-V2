import { PlayerCar } from "../player/PlayerCar";

export class RaceHUD {
  private readonly root: HTMLDivElement;

  private readonly speedText: HTMLDivElement;

  private readonly nitroContainer: HTMLDivElement;
  private readonly nitroFill: HTMLDivElement;
  private readonly nitroText: HTMLDivElement;

  private readonly nitroButton: HTMLButtonElement;

  private readonly playerCar: PlayerCar;

  private readonly onNitro: () => void;

  constructor(
    playerCar: PlayerCar,
    parent: HTMLElement = document.body,
    onNitro: () => void = () => {}
  ) {
    this.playerCar = playerCar;
    this.onNitro = onNitro;

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
        pointerEvents: "none",
        zIndex: "1000",
        fontFamily:
          "Arial, sans-serif",
        userSelect: "none",
        WebkitUserSelect: "none"
      }
    );

    // =====================================================
    // Speed
    // =====================================================

    this.speedText =
      document.createElement("div");

    Object.assign(
      this.speedText.style,
      {
        position: "absolute",
        right: "20px",
        bottom: "90px",
        minWidth: "120px",
        textAlign: "right",
        fontSize: "26px",
        fontWeight: "700",
        color: "#ffffff",
        textShadow:
          "0 2px 5px rgba(0,0,0,0.8)",
        pointerEvents: "none"
      }
    );

    this.speedText.textContent =
      "0 km/h";

    this.root.appendChild(
      this.speedText
    );

    // =====================================================
    // Nitro Container
    // =====================================================

    this.nitroContainer =
      document.createElement("div");

    Object.assign(
      this.nitroContainer.style,
      {
        position: "absolute",
        left: "50%",
        bottom: "28px",
        transform:
          "translateX(-50%)",
        width: "240px",
        height: "22px",
        border:
          "2px solid rgba(255,255,255,0.8)",
        borderRadius: "12px",
        background:
          "rgba(0,0,0,0.55)",
        overflow: "hidden",
        boxSizing: "border-box",
        pointerEvents: "none"
      }
    );

    this.root.appendChild(
      this.nitroContainer
    );

    // =====================================================
    // Nitro Fill
    // =====================================================

    this.nitroFill =
      document.createElement("div");

    Object.assign(
      this.nitroFill.style,
      {
        width: "100%",
        height: "100%",
        borderRadius: "10px",
        background:
          "linear-gradient(90deg, #00aaff, #00eaff)",
        transition:
          "width 0.08s linear",
        pointerEvents: "none"
      }
    );

    this.nitroContainer.appendChild(
      this.nitroFill
    );

    // =====================================================
    // Nitro Label
    // =====================================================

    this.nitroText =
      document.createElement("div");

    Object.assign(
      this.nitroText.style,
      {
        position: "absolute",
        left: "50%",
        bottom: "55px",
        transform:
          "translateX(-50%)",
        fontSize: "16px",
        fontWeight: "800",
        color: "#ffffff",
        letterSpacing: "2px",
        textShadow:
          "0 2px 5px rgba(0,0,0,0.8)",
        pointerEvents: "none"
      }
    );

    this.nitroText.textContent =
      "NITRO";

    this.root.appendChild(
      this.nitroText
    );

    // =====================================================
    // MOBILE NITRO BUTTON
    // =====================================================

    this.nitroButton =
      document.createElement("button");

    this.nitroButton.type =
      "button";

    this.nitroButton.setAttribute(
      "aria-label",
      "Activate Nitro"
    );

    this.nitroButton.textContent =
      "N";

    Object.assign(
      this.nitroButton.style,
      {
        position: "absolute",

        right: "20px",
        bottom: "24px",

        width: "68px",
        height: "68px",

        border: "3px solid rgba(255,255,255,0.9)",
        borderRadius: "50%",

        background:
          "linear-gradient(145deg, #00cfff, #0066ff)",

        color: "#ffffff",

        fontSize: "30px",
        fontWeight: "900",

        fontFamily:
          "Arial, sans-serif",

        textAlign: "center",

        lineHeight: "62px",

        padding: "0",

        margin: "0",

        boxSizing: "border-box",

        cursor: "pointer",

        pointerEvents: "auto",

        touchAction: "manipulation",

        WebkitTapHighlightColor:
          "transparent",

        userSelect: "none",
        WebkitUserSelect: "none",

        boxShadow:
          "0 5px 15px rgba(0,0,0,0.45), 0 0 12px rgba(0,200,255,0.55)",

        textShadow:
          "0 2px 4px rgba(0,0,0,0.6)"
      }
    );

    this.root.appendChild(
      this.nitroButton
    );

    // =====================================================
    // Nitro Button Events
    // =====================================================

    this.nitroButton.addEventListener(
      "pointerdown",
      this.handleNitroPointerDown
    );

    this.nitroButton.addEventListener(
      "pointerup",
      this.handleNitroPointerUp
    );

    this.nitroButton.addEventListener(
      "pointercancel",
      this.handleNitroPointerUp
    );

    this.nitroButton.addEventListener(
      "pointerleave",
      this.handleNitroPointerUp
    );

    // Prevent normal button behaviour
    // from affecting the game.
    this.nitroButton.addEventListener(
      "contextmenu",
      (event) => {
        event.preventDefault();
      }
    );

    // =====================================================
    // Add HUD
    // =====================================================

    parent.appendChild(
      this.root
    );

    // =====================================================
    // Responsive
    // =====================================================

    this.updateResponsiveSize();

    window.addEventListener(
      "resize",
      this.updateResponsiveSize
    );
  }

  // =========================================================
  // Nitro Pointer Down
  // =========================================================

  private handleNitroPointerDown =
    (event: PointerEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      this.nitroButton.style.transform =
        "scale(0.92)";

      this.nitroButton.style.boxShadow =
        "0 2px 8px rgba(0,0,0,0.45), 0 0 20px rgba(0,230,255,0.9)";

      /*
       * Engine decides whether Nitro
       * is actually allowed.
       */
      this.onNitro();
    };

  // =========================================================
  // Nitro Pointer Up
  // =========================================================

  private handleNitroPointerUp =
    (event: PointerEvent): void => {
      event.preventDefault();
      event.stopPropagation();

      this.nitroButton.style.transform =
        "scale(1)";

      this.nitroButton.style.boxShadow =
        "0 5px 15px rgba(0,0,0,0.45), 0 0 12px rgba(0,200,255,0.55)";
    };

  // =========================================================
  // Update
  // =========================================================

  public update(): void {
    const speed =
      this.playerCar.getSpeed();

    const nitroDuration =
      this.playerCar.getNitroDuration();

    const nitroRemaining =
      this.playerCar.getNitroTimeRemaining();

    const nitroActive =
      this.playerCar.isNitroActive();

    // =====================================================
    // Speed
    // =====================================================

    this.speedText.textContent =
      `${Math.round(speed)} km/h`;

    // =====================================================
    // Nitro Percentage
    // =====================================================

    let nitroPercent =
      100;

    if (
      nitroActive &&
      nitroDuration > 0
    ) {
      nitroPercent =
        (
          nitroRemaining /
          nitroDuration
        ) *
        100;
    }

    nitroPercent =
      Math.max(
        0,
        Math.min(
          100,
          nitroPercent
        )
      );

    this.nitroFill.style.width =
      `${nitroPercent}%`;

    // =====================================================
    // Nitro Active
    // =====================================================

    if (nitroActive) {
      this.nitroText.textContent =
        "NITRO ACTIVE";

      this.nitroText.style.transform =
        "translateX(-50%) scale(1.08)";

      this.nitroText.style.color =
        "#00eaff";

      this.speedText.style.color =
        "#00eaff";

      this.nitroFill.style.background =
        "linear-gradient(90deg, #00aaff, #ffffff, #00eaff)";

      this.nitroButton.style.opacity =
        "0.72";

      this.nitroButton.style.filter =
        "brightness(1.25)";

      this.nitroButton.textContent =
        "N";

    } else {
      this.nitroText.textContent =
        "NITRO";

      this.nitroText.style.transform =
        "translateX(-50%) scale(1)";

      this.nitroText.style.color =
        "#ffffff";

      this.speedText.style.color =
        "#ffffff";

      this.nitroFill.style.background =
        "linear-gradient(90deg, #00aaff, #00eaff)";

      this.nitroButton.style.opacity =
        "1";

      this.nitroButton.style.filter =
        "brightness(1)";

      this.nitroButton.textContent =
        "N";
    }
  }

  // =========================================================
  // Responsive
  // =========================================================

  private updateResponsiveSize =
    (): void => {
      const width =
        window.innerWidth;

      if (width <= 480) {
        // -------------------------------------------------
        // Mobile
        // -------------------------------------------------

        this.nitroContainer.style.width =
          "190px";

        this.speedText.style.fontSize =
          "22px";

        this.nitroText.style.fontSize =
          "14px";

        this.speedText.style.right =
          "14px";

        this.speedText.style.bottom =
          "105px";

        this.nitroButton.style.width =
          "64px";

        this.nitroButton.style.height =
          "64px";

        this.nitroButton.style.lineHeight =
          "58px";

        this.nitroButton.style.fontSize =
          "28px";

        this.nitroButton.style.right =
          "14px";

        this.nitroButton.style.bottom =
          "18px";

      } else {
        // -------------------------------------------------
        // Desktop / Tablet
        // -------------------------------------------------

        this.nitroContainer.style.width =
          "240px";

        this.speedText.style.fontSize =
          "26px";

        this.nitroText.style.fontSize =
          "16px";

        this.speedText.style.right =
          "20px";

        this.speedText.style.bottom =
          "90px";

        this.nitroButton.style.width =
          "68px";

        this.nitroButton.style.height =
          "68px";

        this.nitroButton.style.lineHeight =
          "62px";

        this.nitroButton.style.fontSize =
          "30px";

        this.nitroButton.style.right =
          "20px";

        this.nitroButton.style.bottom =
          "24px";
      }
    };

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {
    window.removeEventListener(
      "resize",
      this.updateResponsiveSize
    );

    this.nitroButton.removeEventListener(
      "pointerdown",
      this.handleNitroPointerDown
    );

    this.nitroButton.removeEventListener(
      "pointerup",
      this.handleNitroPointerUp
    );

    this.nitroButton.removeEventListener(
      "pointercancel",
      this.handleNitroPointerUp
    );

    this.nitroButton.removeEventListener(
      "pointerleave",
      this.handleNitroPointerUp
    );

    this.root.remove();
  }
}
