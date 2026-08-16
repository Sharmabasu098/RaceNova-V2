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
    onNitro: () => void,
    parent: HTMLElement = document.body
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
          "0 2px 5px rgba(0,0,0,0.8)"
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
          "0 2px 5px rgba(0,0,0,0.8)",
        whiteSpace: "nowrap"
      }
    );

    this.nitroText.textContent =
      "NITRO";

    this.root.appendChild(
      this.nitroText
    );

    // =====================================================
    // Nitro Button
    // =====================================================

    this.nitroButton =
      document.createElement("button");

    this.nitroButton.type =
      "button";

    this.nitroButton.textContent =
      "NITRO";

    Object.assign(
      this.nitroButton.style,
      {
        position: "absolute",
        right: "20px",
        bottom: "145px",

        width: "92px",
        height: "92px",

        border:
          "3px solid rgba(0,234,255,0.9)",

        borderRadius: "50%",

        background:
          "radial-gradient(circle, #00eaff 0%, #0088cc 55%, #004466 100%)",

        color: "#ffffff",

        fontSize: "17px",
        fontWeight: "900",

        letterSpacing: "1px",

        textShadow:
          "0 2px 5px rgba(0,0,0,0.8)",

        boxShadow:
          "0 0 15px rgba(0,220,255,0.65)",

        cursor: "pointer",

        pointerEvents: "auto",

        touchAction: "manipulation",

        WebkitTapHighlightColor:
          "transparent",

        padding: "0",

        outline: "none",

        appearance: "none",

        transition:
          "transform 0.08s ease, box-shadow 0.08s ease"
      }
    );

    this.root.appendChild(
      this.nitroButton
    );

    // =====================================================
    // Nitro Button - Click
    // =====================================================

    this.nitroButton.addEventListener(
      "click",
      this.handleNitroClick
    );

    // =====================================================
    // Nitro Button - Touch
    // =====================================================

    this.nitroButton.addEventListener(
      "pointerdown",
      this.handleNitroPointerDown
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
  // Nitro Click
  // =========================================================

  private handleNitroClick = (
    event: MouseEvent
  ): void => {
    event.preventDefault();

    this.onNitro();
  };

  // =========================================================
  // Nitro Touch / Pointer
  // =========================================================

  private handleNitroPointerDown = (
    event: PointerEvent
  ): void => {
    event.preventDefault();

    /*
     * Only trigger for primary pointer.
     */
    if (
      event.isPrimary === false
    ) {
      return;
    }

    /*
     * Prevent duplicate click behaviour
     * on touch devices.
     */
    this.nitroButton.setPointerCapture(
      event.pointerId
    );

    this.nitroButton.style.transform =
      "scale(0.92)";

    this.nitroButton.style.boxShadow =
      "0 0 28px rgba(0,234,255,1)";

    this.onNitro();
  };

  // =========================================================
  // Nitro Pointer Up
  // =========================================================

  private handleNitroPointerUp = (): void => {
    this.nitroButton.style.transform =
      "scale(1)";

    this.nitroButton.style.boxShadow =
      "0 0 15px rgba(0,220,255,0.65)";
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

    let nitroPercent = 100;

    if (
      nitroActive &&
      nitroDuration > 0
    ) {
      nitroPercent =
        (
          nitroRemaining /
          nitroDuration
        ) * 100;
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

      this.nitroButton.style.transform =
        "scale(1.05)";

      this.nitroButton.style.boxShadow =
        "0 0 30px rgba(0,234,255,1)";
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

      this.nitroButton.style.transform =
        "scale(1)";

      this.nitroButton.style.boxShadow =
        "0 0 15px rgba(0,220,255,0.65)";
    }

    // =====================================================
    // Nitro Empty State
    // =====================================================

    if (
      !nitroActive &&
      nitroPercent <= 0
    ) {
      this.nitroButton.style.opacity =
        "0.45";

      this.nitroButton.disabled =
        true;
    } else {
      this.nitroButton.style.opacity =
        "1";

      this.nitroButton.disabled =
        false;
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
        // -----------------------------------------------
        // Mobile
        // -----------------------------------------------

        this.nitroContainer.style.width =
          "190px";

        this.speedText.style.fontSize =
          "22px";

        this.nitroText.style.fontSize =
          "14px";

        this.speedText.style.right =
          "14px";

        this.speedText.style.bottom =
          "78px";

        this.nitroButton.style.width =
          "78px";

        this.nitroButton.style.height =
          "78px";

        this.nitroButton.style.right =
          "16px";

        this.nitroButton.style.bottom =
          "135px";

        this.nitroButton.style.fontSize =
          "14px";
      } else {
        // -----------------------------------------------
        // Desktop / Large Screen
        // -----------------------------------------------

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
          "92px";

        this.nitroButton.style.height =
          "92px";

        this.nitroButton.style.right =
          "20px";

        this.nitroButton.style.bottom =
          "145px";

        this.nitroButton.style.fontSize =
          "17px";
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
      "click",
      this.handleNitroClick
    );

    this.nitroButton.removeEventListener(
      "pointerdown",
      this.handleNitroPointerDown
    );

    this.nitroButton.removeEventListener(
      "pointerup",
      this.handleNitroPointerUp
    );

    this.root.remove();
  }
}
