/**
 * ============================================================
 * RaceNova V2
 * Race HUD
 * M4
 * ============================================================
 *
 * Responsibilities:
 * - Display player speed
 * - Display Nitro status
 * - Provide Nitro button
 * - Display live coin balance
 * - Update coin counter after collection
 *
 * RaceNovaEngine provides:
 * 1. PlayerCar
 * 2. Nitro activation callback
 * 3. EconomyManager
 * ============================================================
 */

import { PlayerCar } from "../player/PlayerCar";
import { EconomyManager } from "../economy/EconomyManager";

export class RaceHUD {
  private readonly playerCar: PlayerCar;

  private readonly activateNitro:
    () => void;

  private readonly economyManager:
    EconomyManager;

  // =========================================================
  // HUD Elements
  // =========================================================

  private readonly root:
    HTMLDivElement;

  private readonly speedDisplay:
    HTMLDivElement;

  private readonly nitroDisplay:
    HTMLDivElement;

  private readonly coinDisplay:
    HTMLDivElement;

  private readonly nitroButton:
    HTMLButtonElement;

  // =========================================================
  // Cached values
  // =========================================================

  private lastCoinValue = -1;

  private disposed = false;

  // =========================================================
  // Constructor
  // =========================================================

  constructor(
    playerCar: PlayerCar,
    activateNitro: () => void,
    economyManager: EconomyManager
  ) {
    this.playerCar =
      playerCar;

    this.activateNitro =
      activateNitro;

    this.economyManager =
      economyManager;

    // =======================================================
    // Root
    // =======================================================

    this.root =
      document.createElement(
        "div"
      );

    this.root.style.position =
      "fixed";

    this.root.style.top =
      "0";

    this.root.style.left =
      "0";

    this.root.style.width =
      "100%";

    this.root.style.height =
      "100%";

    this.root.style.pointerEvents =
      "none";

    this.root.style.zIndex =
      "1000";

    this.root.style.fontFamily =
      "Arial, sans-serif";

    // =======================================================
    // Speed Display
    // =======================================================

    this.speedDisplay =
      document.createElement(
        "div"
      );

    this.speedDisplay.style.position =
      "absolute";

    this.speedDisplay.style.top =
      "20px";

    this.speedDisplay.style.right =
      "20px";

    this.speedDisplay.style.minWidth =
      "110px";

    this.speedDisplay.style.padding =
      "10px 14px";

    this.speedDisplay.style.background =
      "rgba(0, 0, 0, 0.65)";

    this.speedDisplay.style.borderRadius =
      "12px";

    this.speedDisplay.style.color =
      "#ffffff";

    this.speedDisplay.style.fontSize =
      "20px";

    this.speedDisplay.style.fontWeight =
      "700";

    this.speedDisplay.style.textAlign =
      "center";

    this.speedDisplay.style.boxSizing =
      "border-box";

    this.speedDisplay.textContent =
      "0 km/h";

    this.root.appendChild(
      this.speedDisplay
    );

    // =======================================================
    // Coin Display
    // =======================================================

    this.coinDisplay =
      document.createElement(
        "div"
      );

    this.coinDisplay.style.position =
      "absolute";

    this.coinDisplay.style.top =
      "20px";

    this.coinDisplay.style.left =
      "20px";

    this.coinDisplay.style.minWidth =
      "110px";

    this.coinDisplay.style.padding =
      "10px 14px";

    this.coinDisplay.style.background =
      "rgba(0, 0, 0, 0.65)";

    this.coinDisplay.style.borderRadius =
      "12px";

    this.coinDisplay.style.color =
      "#ffd700";

    this.coinDisplay.style.fontSize =
      "20px";

    this.coinDisplay.style.fontWeight =
      "700";

    this.coinDisplay.style.textAlign =
      "center";

    this.coinDisplay.style.boxSizing =
      "border-box";

    this.coinDisplay.textContent =
      "🪙 0";

    this.root.appendChild(
      this.coinDisplay
    );

    // =======================================================
    // Nitro Display
    // =======================================================

    this.nitroDisplay =
      document.createElement(
        "div"
      );

    this.nitroDisplay.style.position =
      "absolute";

    this.nitroDisplay.style.top =
      "75px";

    this.nitroDisplay.style.right =
      "20px";

    this.nitroDisplay.style.padding =
      "7px 12px";

    this.nitroDisplay.style.background =
      "rgba(0, 0, 0, 0.60)";

    this.nitroDisplay.style.borderRadius =
      "10px";

    this.nitroDisplay.style.color =
      "#ffffff";

    this.nitroDisplay.style.fontSize =
      "15px";

    this.nitroDisplay.style.fontWeight =
      "700";

    this.nitroDisplay.style.textAlign =
      "center";

    this.nitroDisplay.textContent =
      "NITRO READY";

    this.root.appendChild(
      this.nitroDisplay
    );

    // =======================================================
    // Nitro Button
    // =======================================================

    this.nitroButton =
      document.createElement(
        "button"
      );

    this.nitroButton.type =
      "button";

    this.nitroButton.textContent =
      "NITRO";

    this.nitroButton.style.position =
      "absolute";

    this.nitroButton.style.right =
      "20px";

    this.nitroButton.style.bottom =
      "30px";

    this.nitroButton.style.width =
      "100px";

    this.nitroButton.style.height =
      "58px";

    this.nitroButton.style.border =
      "none";

    this.nitroButton.style.borderRadius =
      "18px";

    this.nitroButton.style.background =
      "#ff4d00";

    this.nitroButton.style.color =
      "#ffffff";

    this.nitroButton.style.fontSize =
      "18px";

    this.nitroButton.style.fontWeight =
      "800";

    this.nitroButton.style.cursor =
      "pointer";

    this.nitroButton.style.pointerEvents =
      "auto";

    this.nitroButton.style.touchAction =
      "manipulation";

    this.root.appendChild(
      this.nitroButton
    );

    // =======================================================
    // Nitro Button Events
    // =======================================================

    this.nitroButton.addEventListener(
      "click",
      this.handleNitroClick
    );

    this.nitroButton.addEventListener(
      "touchstart",
      this.handleNitroTouch,
      {
        passive: true
      }
    );

    // =======================================================
    // Add HUD
    // =======================================================

    document.body.appendChild(
      this.root
    );

    // =======================================================
    // Initial Update
    // =======================================================

    this.update();
  }

  // =========================================================
  // Nitro Click
  // =========================================================

  private handleNitroClick = (): void => {
    if (
      this.disposed
    ) {
      return;
    }

    this.activateNitro();
  };

  // =========================================================
  // Nitro Touch
  // =========================================================

  private handleNitroTouch = (): void => {
    if (
      this.disposed
    ) {
      return;
    }

    this.activateNitro();
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

    this.updateSpeed();

    this.updateNitro();

    this.updateCoins();
  }

  // =========================================================
  // Speed
  // =========================================================

  private updateSpeed(): void {
    /*
     * PlayerCar's authoritative gameplay speed.
     *
     * effectiveSpeed is the actual current
     * velocity used by gameplay.
     */

    const speed =
      Math.max(
        0,
        this.playerCar.effectiveSpeed
      );

    const roundedSpeed =
      Math.round(
        speed
      );

    this.speedDisplay.textContent =
      `${roundedSpeed} km/h`;
  }

  // =========================================================
  // Nitro
  // =========================================================

  private updateNitro(): void {
    const active =
      this.playerCar.isNitroActive();

    if (
      active
    ) {
      this.nitroDisplay.textContent =
        "🔥 NITRO ACTIVE";

      this.nitroDisplay.style.color =
        "#ff6b00";

      this.nitroButton.textContent =
        "ACTIVE";

      this.nitroButton.disabled =
        true;

      this.nitroButton.style.opacity =
        "0.55";
    } else {
      this.nitroDisplay.textContent =
        "NITRO READY";

      this.nitroDisplay.style.color =
        "#ffffff";

      this.nitroButton.textContent =
        "NITRO";

      this.nitroButton.disabled =
        false;

      this.nitroButton.style.opacity =
        "1";
    }
  }

  // =========================================================
  // Coins
  // =========================================================

  private updateCoins(): void {
    const coins =
      Math.max(
        0,
        Math.floor(
          this.economyManager.getCoins()
        )
      );

    /*
     * Avoid unnecessary DOM updates
     * when balance has not changed.
     */
    if (
      coins ===
      this.lastCoinValue
    ) {
      return;
    }

    this.lastCoinValue =
      coins;

    this.coinDisplay.textContent =
      `🪙 ${coins}`;
  }

  // =========================================================
  // Coin Balance
  // =========================================================

  public getCoinBalance(): number {
    return Math.max(
      0,
      Math.floor(
        this.economyManager.getCoins()
      )
    );
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

    // -------------------------------------------------------
    // Events
    // -------------------------------------------------------

    this.nitroButton.removeEventListener(
      "click",
      this.handleNitroClick
    );

    this.nitroButton.removeEventListener(
      "touchstart",
      this.handleNitroTouch
    );

    // -------------------------------------------------------
    // DOM
    // -------------------------------------------------------

    if (
      this.root.parentElement
    ) {
      this.root.parentElement.removeChild(
        this.root
      );
    }
  }
}
