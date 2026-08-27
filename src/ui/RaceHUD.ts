import { PlayerCar } from "../player/PlayerCar";
import { EconomyManager } from "../economy/EconomyManager";

// ============================================================
// RaceNova V2
// Race HUD
// M6.8.5 — Level + Boss Unlock Status
// ============================================================

export interface RaceHUDProgress {

  level: number;

  racesCompleted: number;

  racesRequired: number;

  racesWon: number;

  winsRequired: number;

  bossUnlocked: boolean;
}

export class RaceHUD {

  // =========================================================
  // Core
  // =========================================================

  private readonly playerCar:
    PlayerCar;

  private readonly economyManager:
    EconomyManager;

  private readonly onNitro:
    () => void;

  private readonly onGarage:
    () => void;

  private readonly getProgress:
    () => RaceHUDProgress;

  // =========================================================
  // HUD Root
  // =========================================================

  private readonly root:
    HTMLDivElement;

  // =========================================================
  // Speed
  // =========================================================

  private readonly speedPanel:
    HTMLDivElement;

  private readonly speedValue:
    HTMLDivElement;

  private readonly speedUnit:
    HTMLDivElement;

  // =========================================================
  // Coins
  // =========================================================

  private readonly coinPanel:
    HTMLDivElement;

  private readonly coinIcon:
    HTMLSpanElement;

  private readonly coinValue:
    HTMLSpanElement;

  // =========================================================
  // Level / Boss
  // =========================================================

  private readonly progressionPanel:
    HTMLDivElement;

  private readonly levelValue:
    HTMLDivElement;

  private readonly bossStatus:
    HTMLDivElement;

  // =========================================================
  // Nitro
  // =========================================================

  private readonly nitroButton:
    HTMLButtonElement;

  private readonly nitroLabel:
    HTMLSpanElement;

  private readonly nitroTimer:
    HTMLSpanElement;

  // =========================================================
  // Garage
  // =========================================================

  private readonly garageButton:
    HTMLButtonElement;

  // =========================================================
  // State
  // =========================================================

  private disposed =
    false;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(

    playerCar:
      PlayerCar,

    onNitro:
      () => void,

    economyManager:
      EconomyManager,

    onGarage:
      () => void =
        () => undefined,

    getProgress:
      () => RaceHUDProgress =
        () => ({

          level:
            1,

          racesCompleted:
            0,

          racesRequired:
            3,

          racesWon:
            0,

          winsRequired:
            2,

          bossUnlocked:
            false
        })
  ) {

    this.playerCar =
      playerCar;

    this.onNitro =
      onNitro;

    this.economyManager =
      economyManager;

    this.onGarage =
      onGarage;

    this.getProgress =
      getProgress;

    // =====================================================
    // Root
    // =====================================================

    this.root =
      document.createElement(
        "div"
      );

    this.root.id =
      "racenova-hud";

    Object.assign(
      this.root.style,
      {
        position: "fixed",

        inset: "0",

        width: "100%",

        height: "100%",

        pointerEvents:
          "none",

        zIndex: "1000",

        fontFamily:
          "Arial, Helvetica, sans-serif",

        userSelect:
          "none",

        WebkitUserSelect:
          "none"
      }
    );

    // =====================================================
    // Speed Panel
    // =====================================================

    this.speedPanel =
      document.createElement(
        "div"
      );

    Object.assign(
      this.speedPanel.style,
      {
        position: "absolute",

        left: "16px",

        bottom: "18px",

        minWidth: "100px",

        padding:
          "8px 12px",

        borderRadius:
          "14px",

        background:
          "rgba(0, 0, 0, 0.58)",

        color:
          "#ffffff",

        textAlign:
          "center",

        boxSizing:
          "border-box",

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
      document.createElement(
        "div"
      );

    Object.assign(
      this.speedValue.style,
      {
        fontSize:
          "30px",

        lineHeight:
          "32px",

        fontWeight:
          "800",

        letterSpacing:
          "1px"
      }
    );

    this.speedValue.textContent =
      "0";

    // =====================================================
    // Speed Unit
    // =====================================================

    this.speedUnit =
      document.createElement(
        "div"
      );

    Object.assign(
      this.speedUnit.style,
      {
        marginTop:
          "2px",

        fontSize:
          "11px",

        lineHeight:
          "13px",

        fontWeight:
          "600",

        opacity:
          "0.75",

        letterSpacing:
          "1px"
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
      document.createElement(
        "div"
      );

    Object.assign(
      this.coinPanel.style,
      {
        position: "absolute",

        top: "18px",

        right: "16px",

        minWidth: "92px",

        padding:
          "8px 12px",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap: "7px",

        borderRadius:
          "16px",

        background:
          "rgba(0, 0, 0, 0.58)",

        color:
          "#ffffff",

        boxSizing:
          "border-box",

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
      document.createElement(
        "span"
      );

    Object.assign(
      this.coinIcon.style,
      {
        display:
          "inline-flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        width:
          "24px",

        height:
          "24px",

        borderRadius:
          "50%",

        background:
          "#ffd54a",

        color:
          "#7a4d00",

        fontSize:
          "14px",

        fontWeight:
          "900",

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
      document.createElement(
        "span"
      );

    Object.assign(
      this.coinValue.style,
      {
        fontSize:
          "19px",

        lineHeight:
          "24px",

        fontWeight:
          "800",

        minWidth:
          "28px",

        textAlign:
          "left"
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
    // Level / Boss Progress Panel
    // =====================================================

    this.progressionPanel =
      document.createElement(
        "div"
      );

    Object.assign(
      this.progressionPanel.style,
      {
        position: "absolute",

        top: "62px",

        right: "16px",

        minWidth:
          "145px",

        maxWidth:
          "190px",

        padding:
          "8px 12px",

        borderRadius:
          "14px",

        background:
          "rgba(0, 0, 0, 0.58)",

        color:
          "#ffffff",

        boxSizing:
          "border-box",

        textAlign:
          "left",

        backdropFilter:
          "blur(6px)",

        WebkitBackdropFilter:
          "blur(6px)"
      }
    );

    // =====================================================
    // Level
    // =====================================================

    this.levelValue =
      document.createElement(
        "div"
      );

    Object.assign(
      this.levelValue.style,
      {
        fontSize:
          "16px",

        lineHeight:
          "20px",

        fontWeight:
          "900",

        letterSpacing:
          "0.5px"
      }
    );

    this.levelValue.textContent =
      "LEVEL 1";

    // =====================================================
    // Boss Status
    // =====================================================

    this.bossStatus =
      document.createElement(
        "div"
      );

    Object.assign(
      this.bossStatus.style,
      {
        marginTop:
          "3px",

        fontSize:
          "11px",

        lineHeight:
          "15px",

        fontWeight:
          "700",

        opacity:
          "0.9",

        whiteSpace:
          "normal"
      }
    );

    this.bossStatus.textContent =
      "BOSS LOCKED";

    this.progressionPanel.appendChild(
      this.levelValue
    );

    this.progressionPanel.appendChild(
      this.bossStatus
    );

    // =====================================================
    // Garage Button
    // =====================================================

    this.garageButton =
      document.createElement(
        "button"
      );

    Object.assign(
      this.garageButton.style,
      {
        position:
          "absolute",

        right:
          "18px",

        bottom:
          "124px",

        width:
          "92px",

        height:
          "48px",

        border:
          "1px solid rgba(255,255,255,0.25)",

        borderRadius:
          "14px",

        background:
          "linear-gradient(135deg, #3478ff, #2253c9)",

        color:
          "#ffffff",

        fontFamily:
          "Arial, Helvetica, sans-serif",

        fontSize:
          "13px",

        fontWeight:
          "900",

        letterSpacing:
          "0.5px",

        boxShadow:
          "0 5px 18px rgba(0,0,0,0.35)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          "0",

        margin:
          "0",

        pointerEvents:
          "auto",

        touchAction:
          "manipulation",

        WebkitTapHighlightColor:
          "transparent",

        cursor:
          "pointer"
      }
    );

    this.garageButton.textContent =
      "GARAGE";

    // =====================================================
    // Nitro Button
    // =====================================================

    this.nitroButton =
      document.createElement(
        "button"
      );

    Object.assign(
      this.nitroButton.style,
      {
        position:
          "absolute",

        right:
          "18px",

        bottom:
          "18px",

        width:
          "92px",

        height:
          "92px",

        border:
          "2px solid rgba(255,255,255,0.35)",

        borderRadius:
          "50%",

        background:
          "linear-gradient(145deg, #ff5a1f, #d71900)",

        color:
          "#ffffff",

        display:
          "flex",

        flexDirection:
          "column",

        alignItems:
          "center",

        justifyContent:
          "center",

        gap:
          "2px",

        padding:
          "0",

        margin:
          "0",

        fontFamily:
          "Arial, Helvetica, sans-serif",

        boxShadow:
          "0 5px 18px rgba(0,0,0,0.35)",

        pointerEvents:
          "auto",

        touchAction:
          "manipulation",

        WebkitTapHighlightColor:
          "transparent",

        cursor:
          "pointer"
      }
    );

    // =====================================================
    // Nitro Label
    // =====================================================

    this.nitroLabel =
      document.createElement(
        "span"
      );

    Object.assign(
      this.nitroLabel.style,
      {
        fontSize:
          "15px",

        lineHeight:
          "18px",

        fontWeight:
          "900",

        letterSpacing:
          "1px"
      }
    );

    this.nitroLabel.textContent =
      "NITRO";

    // =====================================================
    // Nitro Timer
    // =====================================================

    this.nitroTimer =
      document.createElement(
        "span"
      );

    Object.assign(
      this.nitroTimer.style,
      {
        fontSize:
          "11px",

        lineHeight:
          "14px",

        fontWeight:
          "700",

        opacity:
          "0.9"
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
      this.progressionPanel
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
    // Garage Button Events
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

  private handleGaragePointerDown =
    (
      event: PointerEvent
    ): void => {

      event.preventDefault();

      event.stopPropagation();

      this.onGarage();
    };

  // =========================================================
  // Garage Click
  // =========================================================

  private handleGarageClick =
    (
      event: MouseEvent
    ): void => {

      event.preventDefault();

      event.stopPropagation();
    };

  // =========================================================
  // Nitro Pointer
  // =========================================================

  private handleNitroPointerDown =
    (
      event: PointerEvent
    ): void => {

      event.preventDefault();

      event.stopPropagation();

      this.onNitro();
    };

  // =========================================================
  // Nitro Click
  // =========================================================

  private handleNitroClick =
    (
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
        ? Math.max(
            0,
            speed
          )
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
        ? Math.max(
            0,
            coins
          )
        : 0;

    this.coinValue.textContent =
      Math.floor(
        safeCoins
      ).toString();

    // =====================================================
    // Level / Boss Status
    // =====================================================

    const progress =
      this.getProgress();

    const safeLevel =
      Number.isFinite(
        progress.level
      )
        ? Math.max(
            1,
            Math.floor(
              progress.level
            )
          )
        : 1;

    const safeRacesCompleted =
      Number.isFinite(
        progress.racesCompleted
      )
        ? Math.max(
            0,
            Math.floor(
              progress.racesCompleted
            )
          )
        : 0;

    const safeRacesRequired =
      Number.isFinite(
        progress.racesRequired
      )
        ? Math.max(
            0,
            Math.floor(
              progress.racesRequired
            )
          )
        : 0;

    const safeRacesWon =
      Number.isFinite(
        progress.racesWon
      )
        ? Math.max(
            0,
            Math.floor(
              progress.racesWon
            )
          )
        : 0;

    const safeWinsRequired =
      Number.isFinite(
        progress.winsRequired
      )
        ? Math.max(
            0,
            Math.floor(
              progress.winsRequired
            )
          )
        : 0;

    this.levelValue.textContent =
      `LEVEL ${safeLevel}`;

    if (
      progress.bossUnlocked
    ) {

      this.bossStatus.textContent =
        "BOSS UNLOCKED";

    } else {

      this.bossStatus.textContent =
        `BOSS LOCKED · Races ${safeRacesCompleted}/${safeRacesRequired} · Wins ${safeRacesWon}/${safeWinsRequired}`;
    }

    // =====================================================
    // Nitro
    // =====================================================

    const nitroActive =
      this.playerCar.isNitroActive();

    const nitroRemaining =
      this.playerCar
        .getNitroTimeRemaining();

    const nitroDuration =
      this.playerCar
        .getNitroDuration();

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
  
