import { PlayerCar } from "../player/PlayerCar";

export class RaceHUD {
  private readonly root: HTMLDivElement;

  private readonly speedText: HTMLDivElement;
  private readonly nitroContainer: HTMLDivElement;
  private readonly nitroFill: HTMLDivElement;
  private readonly nitroText: HTMLDivElement;

  private readonly playerCar: PlayerCar;

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
          "Arial, sans-serif"
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
    // Nitro container
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
    // Nitro fill
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
    // Nitro label
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
  // Update
  // =========================================================

  public update(): void {
    const speed =
      this.playerCar.getSpeed();

    const maxSpeed =
      this.playerCar.getMaxSpeed();

    const nitroSpeed =
      this.playerCar.getNitroSpeed();

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
    // Nitro percentage
    // =====================================================

    let nitroPercent = 100;

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
    // Nitro active visual
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
    }

    // =====================================================
    // Prevent unused configuration warnings
    // =====================================================

    void maxSpeed;
    void nitroSpeed;
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
          "78px";
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

    this.root.remove();
  }
}
