import { PlayerCar } from "../player/PlayerCar";

export class RaceHUD {
  private readonly root: HTMLDivElement;

  private readonly speedText: HTMLDivElement;

  private readonly nitroContainer: HTMLDivElement;
  private readonly nitroFill: HTMLDivElement;
  private readonly nitroText: HTMLDivElement;

  private readonly nitroButton: HTMLButtonElement;

  private readonly playerCar: PlayerCar;

  private nitroAction:
    (() => void) | null = null;

  constructor(
    playerCar: PlayerCar,
    parent: HTMLElement = document.body
  ) {
    this.playerCar = playerCar;

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
        userSelect: "none"
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
        pointerEvents: "none"
      }
    );

    this.nitroText.textContent =
      "NITRO";

    this.root.appendChild(
      this.nitroText
    );

    // =====================================================
    // NITRO BUTTON
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

        right: "22px",
        bottom: "145px",

        width: "68px",
        height: "68px",

        border:
          "3px solid rgba(255,255,255,0.9)",

        borderRadius: "50%",

        background:
          "linear-gradient(145deg, #00cfff, #0066ff)",

        color: "#ffffff",

        fontSize: "30px",

        fontWeight: "900",

        fontFamily:
          "Arial, sans-serif",

        textShadow:
          "0 2px 5px rgba(0,0,0,0.8)",

        boxShadow:
          "0 5px 18px rgba(0,150,255,0.55)",

        cursor: "pointer",

        padding: "0",

        outline: "none",

        WebkitTapHighlightColor:
          "transparent",

        touchAction: "manipulation",

        pointerEvents: "auto",

        zIndex: "1001"
      }
    );

    this.root.appendChild(
      this.nitroButton
    );

    // =====================================================
    // Nitro Button Press
    // =====================================================

    this.nitroButton.addEventListener(
      "pointerdown",
      this.handleNitroButtonDown
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
  // Connect Nitro Action
  // =========================================================

  public setNitroAction(
    action: () => void
  ): void {
    this.nitroAction =
      action;
  }

  // =========================================================
  // Nitro Button
  // =========================================================

  private handleNitroButtonDown =
    (event: PointerEvent): void => {

      event.preventDefault();
      event.stopPropagation();

      if (
        this.nitroAction === null
      ) {
        return;
      }

      this.nitroAction();

      this.nitroButton.style.transform =
        "scale(0.90)";

      window.setTimeout(
        () => {
          this.nitroButton.style.transform =
            "scale(1)";
        },
        100
      );
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
      nitroActive
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
    // Nitro Active Visual
    // =====================================================

    if (
      nitroActive
    ) {
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

      this.nitroButton.style.background =
        "linear-gradient(145deg, #ffffff, #00eaff)";

      this.nitroButton.style.color =
        "#0066ff";

      this.nitroButton.style.boxShadow =
        "0 0 25px rgba(0,234,255,0.95)";
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

      this.nitroButton.style.background =
        "linear-gradient(145deg, #00cfff, #0066ff)";

      this.nitroButton.style.color =
        "#ffffff";

      this.nitroButton.style.boxShadow =
        "0 5px 18px rgba(0,150,255,0.55)";
    }
  }

  // =========================================================
  // Responsive
  // =========================================================

  private updateResponsiveSize =
    (): void => {

      const width =
        window.innerWidth;

      if (
        width <= 480
      ) {
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
          "62px";

        this.nitroButton.style.height =
          "62px";

        this.nitroButton.style.fontSize =
          "27px";

        this.nitroButton.style.right =
          "16px";

        this.nitroButton.style.bottom =
          "132px";
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
          "90px";

        this.nitroButton.style.width =
          "68px";

        this.nitroButton.style.height =
          "68px";

        this.nitroButton.style.fontSize =
          "30px";

        this.nitroButton.style.right =
          "22px";

        this.nitroButton.style.bottom =
          "145px";
      }
    };

  // =========================================================
  // Dispose
  // =========================================================

  public dispose(): void {

    this.nitroButton.removeEventListener(
      "pointerdown",
      this.handleNitroButtonDown
    );

    window.removeEventListener(
      "resize",
      this.updateResponsiveSize
    );

    this.root.remove();
  }
}
