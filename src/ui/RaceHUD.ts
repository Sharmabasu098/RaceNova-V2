import { PlayerCar } from "../player/PlayerCar";

export class RaceHUD {
  private readonly root: HTMLDivElement;

  private readonly speedText: HTMLDivElement;

  private readonly nitroContainer: HTMLDivElement;
  private readonly nitroFill: HTMLDivElement;
  private readonly nitroText: HTMLDivElement;

  private readonly nitroButton: HTMLButtonElement;

  private readonly playerCar: PlayerCar;

  private readonly onNitroRequest: () => void;

  constructor(
    playerCar: PlayerCar,
    onNitroRequest: () => void,
    parent: HTMLElement = document.body
  ) {
    this.playerCar = playerCar;
    this.onNitroRequest = onNitroRequest;

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
        bottom: "120px",
        minWidth: "120px",
        textAlign: "right",
        fontSize: "26px",
        fontWeight: "700",
        color: "#ffffff",
        textShadow:
          "0 2px 5px rgba(0,0,0,0.8)"
      }
    );

    this.speedText.textContent =
      "0 km/h";

    this.root.appendChild(
      this.speedText
    );

    // =====================================================
    // Nitro Bar
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
        boxSizing: "border-box"
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
          "width 0.08s linear"
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
          "0 2px 5px rgba(0,0,0,0.8)"
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

    this.nitroButton.textContent =
      "N";

    Object.assign(
      this.nitroButton.style,
      {
        position: "absolute",

        right: "20px",
        bottom: "24px",

        width: "72px",
        height: "72px",

        borderRadius: "50%",

        border:
          "3px solid rgba(255,255,255,0.95)",

        background:
          "linear-gradient(145deg, #00cfff, #0066ff)",

        color: "#ffffff",

        fontSize: "30px",
        fontWeight: "900",

        lineHeight: "1",

        boxShadow:
          "0 5px 18px rgba(0,0,0,0.45), 0 0 18px rgba(0,200,255,0.45)",

        cursor: "pointer",

        pointerEvents: "auto",

        touchAction: "manipulation",

        WebkitTapHighlightColor:
          "transparent",

        padding: "0",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        transition:
          "transform 0.08s ease, filter 0.08s ease"
      }
    );

    // =====================================================
    // Nitro Button Touch / Click
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

    this.nitroButton.addEventListener(
      "click",
      this.handleNitroClick
    );

    this.root.appendChild(
      this.nitroButton
    );

    // =====================================================
    // Add HUD
    // =====================================================

    parent.appendChild(
      this.root
    );

    // =====================================================
    // Responsive sizing
    // =====================================================

    this.updateResponsiveSize();

    window.addEventListener(
      "resize",
      this.updateResponsiveSize
    );
  }

  // =========================================================
  // Nitro Pointer
  // =========================================================

  private handleNitroPointerDown = (
    event: PointerEvent
  ): void => {
    event.preventDefault();

    this.nitroButton.style.transform =
      "scale(0.92)";

    this.nitroButton.style.filter =
      "brightness(1.25)";
  };

  private handleNitroPointerUp = (
    event: PointerEvent
  ): void => {
    event.preventDefault();

    this.nitroButton.style.transform =
      "scale(1)";

    this.nitroButton.style.filter =
      "brightness(1)";
  };

  // =========================================================
  // Nitro Click
  // =========================================================

  private handleNitroClick = (
    event: MouseEvent
  ): void => {
    event.preventDefault();

    this.onNitroRequest();
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

    if (nitroActive) {
      nitroPercent =
        (nitroRemaining /
          nitroDuration) *
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
    // Nitro Active Visual
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

      this.nitroButton.textContent =
        "🔥";

      this.nitroButton.style.background =
        "linear-gradient(145deg, #ffffff, #00cfff)";

      this.nitroButton.style.boxShadow =
        "0 5px 22px rgba(0,0,0,0.45), 0 0 28px rgba(0,235,255,0.9)";
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

      this.nitroButton.textContent =
        "N";

      this.nitroButton.style.background =
        "linear-gradient(145deg, #00cfff, #0066ff)";

      this.nitroButton.style.boxShadow =
        "0 5px 18px rgba(0,0,0,0.45), 0 0 18px rgba(0,200,255,0.45)";
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
        this.nitroContainer.style.width =
          "190px";

        this.speedText.style.fontSize =
          "22px";

        this.nitroText.style.fontSize =
          "14px";

        this.speedText.style.right =
          "14px";

        this.speedText.style.bottom =
          "112px";

        this.nitroButton.style.width =
          "68px";

        this.nitroButton.style.height =
          "68px";

        this.nitroButton.style.right =
          "16px";

        this.nitroButton.style.bottom =
          "20px";

        this.nitroButton.style.fontSize =
          "28px";
      } else {
        this.nitroContainer.style.width =
          "240px";

        this.speedText.style.fontSize =
          "26px";

        this.nitroText.style.fontSize =
          "16px";

        this.speedText.style.right =
          "20px";

        this.speedText.style.bottom =
          "120px";

        this.nitroButton.style.width =
          "72px";

        this.nitroButton.style.height =
          "72px";

        this.nitroButton.style.right =
          "20px";

        this.nitroButton.style.bottom =
          "24px";

        this.nitroButton.style.fontSize =
          "30px";
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

    this.nitroButton.removeEventListener(
      "click",
      this.handleNitroClick
    );

    this.root.remove();
  }
}
