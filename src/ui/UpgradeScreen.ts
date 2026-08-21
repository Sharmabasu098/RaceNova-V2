/**
 * ============================================================
 * RaceNova V2
 * Upgrade Screen
 * M5.4
 * ============================================================
 *
 * Responsibilities:
 * - Display selected car
 * - Display Speed / Acceleration / Handling
 * - Display current upgrade levels
 * - Display upgrade cost
 * - Purchase upgrades through UpgradeSystem
 * - Refresh UI after successful upgrade
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No localStorage logic
 * - No direct SaveSystem logic
 * - UpgradeSystem remains authoritative
 * - EconomyManager remains authoritative for coins
 * - GarageManager remains authoritative for selected car
 * ============================================================
 */

import {
  GarageManager
} from "../garage/GarageManager";

import {
  UpgradeSystem,
  type UpgradeType
} from "../garage/UpgradeSystem";

import {
  EconomyManager
} from "../economy/EconomyManager";

import {
  type CarId
} from "../garage/CarData";

// ============================================================
// Configuration
// ============================================================

export interface UpgradeScreenConfig {

  /**
   * Called after a successful upgrade.
   *
   * RaceNovaEngine / SaveSystem can
   * persist the updated state.
   */
  onChanged?: () => void;

  /**
   * Called when the screen is closed.
   */
  onClose?: () => void;
}

// ============================================================
// Upgrade Screen
// ============================================================

export class UpgradeScreen {

  private readonly garageManager:
    GarageManager;

  private readonly upgradeSystem:
    UpgradeSystem;

  private readonly economyManager:
    EconomyManager;

  private readonly onChanged:
    () => void;

  private readonly onClose:
    () => void;

  // ==========================================================
  // DOM
  // ==========================================================

  private readonly root:
    HTMLDivElement;

  private readonly coinValue:
    HTMLSpanElement;

  private readonly carName:
    HTMLDivElement;

  private readonly carDescription:
    HTMLDivElement;

  private readonly upgradesContainer:
    HTMLDivElement;

  private readonly closeButton:
    HTMLButtonElement;

  private disposed =
    false;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    garageManager: GarageManager,
    upgradeSystem: UpgradeSystem,
    economyManager: EconomyManager,
    config: UpgradeScreenConfig = {}
  ) {

    this.garageManager =
      garageManager;

    this.upgradeSystem =
      upgradeSystem;

    this.economyManager =
      economyManager;

    this.onChanged =
      config.onChanged ??
      (() => undefined);

    this.onClose =
      config.onClose ??
      (() => undefined);

    // ========================================================
    // Root
    // ========================================================

    this.root =
      document.createElement("div");

    this.root.id =
      "racenova-upgrade-screen";

    Object.assign(
      this.root.style,
      {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        zIndex: "2100",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        background:
          "linear-gradient(180deg, #10151d 0%, #070a0f 100%)",
        color: "#ffffff",
        fontFamily:
          "Arial, Helvetica, sans-serif",
        overflow: "hidden",
        userSelect: "none",
        WebkitUserSelect: "none"
      }
    );

    // ========================================================
    // Header
    // ========================================================

    const header =
      document.createElement("div");

    Object.assign(
      header.style,
      {
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding:
          "14px 18px",
        boxSizing: "border-box",
        borderBottom:
          "1px solid rgba(255,255,255,0.10)",
        background:
          "rgba(0,0,0,0.28)"
      }
    );

    // ========================================================
    // Title
    // ========================================================

    const title =
      document.createElement("div");

    Object.assign(
      title.style,
      {
        fontSize: "23px",
        lineHeight: "28px",
        fontWeight: "900",
        letterSpacing: "1px"
      }
    );

    title.textContent =
      "UPGRADES";

    // ========================================================
    // Header Right
    // ========================================================

    const headerRight =
      document.createElement("div");

    Object.assign(
      headerRight.style,
      {
        display: "flex",
        alignItems: "center",
        gap: "10px"
      }
    );

    // ========================================================
    // Coin Panel
    // ========================================================

    const coinPanel =
      document.createElement("div");

    Object.assign(
      coinPanel.style,
      {
        display: "flex",
        alignItems: "center",
        gap: "7px",
        padding:
          "7px 11px",
        borderRadius: "14px",
        background:
          "rgba(255,213,74,0.12)",
        border:
          "1px solid rgba(255,213,74,0.28)"
      }
    );

    const coinIcon =
      document.createElement("span");

    Object.assign(
      coinIcon.style,
      {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        background:
          "#ffd54a",
        color:
          "#704700",
        fontSize: "13px",
        fontWeight: "900"
      }
    );

    coinIcon.textContent =
      "C";

    this.coinValue =
      document.createElement("span");

    Object.assign(
      this.coinValue.style,
      {
        fontSize: "17px",
        fontWeight: "800"
      }
    );

    this.coinValue.textContent =
      "0";

    coinPanel.appendChild(
      coinIcon
    );

    coinPanel.appendChild(
      this.coinValue
    );

    // ========================================================
    // Close Button
    // ========================================================

    this.closeButton =
      document.createElement("button");

    Object.assign(
      this.closeButton.style,
      {
        width: "42px",
        height: "42px",
        border:
          "1px solid rgba(255,255,255,0.18)",
        borderRadius: "12px",
        background:
          "rgba(255,255,255,0.08)",
        color:
          "#ffffff",
        fontSize: "22px",
        fontWeight: "700",
        cursor: "pointer",
        touchAction:
          "manipulation"
      }
    );

    this.closeButton.textContent =
      "×";

    this.closeButton.addEventListener(
      "click",
      this.handleClose
    );

    headerRight.appendChild(
      coinPanel
    );

    headerRight.appendChild(
      this.closeButton
    );

    header.appendChild(
      title
    );

    header.appendChild(
      headerRight
    );

    // ========================================================
    // Car Information
    // ========================================================

    const carInfo =
      document.createElement("div");

    Object.assign(
      carInfo.style,
      {
        flex: "0 0 auto",
        padding:
          "18px",
        borderBottom:
          "1px solid rgba(255,255,255,0.08)",
        background:
          "rgba(255,255,255,0.025)"
      }
    );

    this.carName =
      document.createElement("div");

    Object.assign(
      this.carName.style,
      {
        fontSize: "24px",
        fontWeight: "900",
        marginBottom:
          "5px"
      }
    );

    this.carDescription =
      document.createElement("div");

    Object.assign(
      this.carDescription.style,
      {
        fontSize: "13px",
        lineHeight: "18px",
        color:
          "rgba(255,255,255,0.62)"
      }
    );

    carInfo.appendChild(
      this.carName
    );

    carInfo.appendChild(
      this.carDescription
    );

    // ========================================================
    // Upgrade Container
    // ========================================================

    this.upgradesContainer =
      document.createElement("div");

    Object.assign(
      this.upgradesContainer.style,
      {
        flex: "1 1 auto",
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(270px, 1fr))",
        alignContent:
          "start",
        gap: "14px",
        padding:
          "16px",
        boxSizing:
          "border-box",
        overflowY:
          "auto",
        WebkitOverflowScrolling:
          "touch"
      }
    );

    // ========================================================
    // Add To DOM
    // ========================================================

    this.root.appendChild(
      header
    );

    this.root.appendChild(
      carInfo
    );

    this.root.appendChild(
      this.upgradesContainer
    );

    document.body.appendChild(
      this.root
    );

    // ========================================================
    // Initial Render
    // ========================================================

    this.render();
  }

  // ==========================================================
  // Render
  // ==========================================================

  public render(): void {

    if (
      this.disposed
    ) {
      return;
    }

    const coins =
      this.economyManager.getCoins();

    this.coinValue.textContent =
      Math.floor(
        Math.max(
          0,
          Number.isFinite(coins)
            ? coins
            : 0
        )
      ).toString();

    const selectedCar =
      this.garageManager.getSelectedCar();

    if (!selectedCar) {

      this.carName.textContent =
        "NO CAR SELECTED";

      this.carDescription.textContent =
        "Select a car from the Garage first.";

      this.upgradesContainer.innerHTML =
        "";

      return;
    }

    this.carName.textContent =
      selectedCar.name;

    this.carDescription.textContent =
      selectedCar.description;

    this.upgradesContainer.innerHTML =
      "";

    this.upgradesContainer.appendChild(
      this.createUpgradeCard(
        selectedCar.id,
        "speed",
        "SPEED",
        selectedCar.stats.maxSpeed,
        "KM/H"
      )
    );

    this.upgradesContainer.appendChild(
      this.createUpgradeCard(
        selectedCar.id,
        "acceleration",
        "ACCELERATION",
        selectedCar.stats.acceleration,
        ""
      )
    );

    this.upgradesContainer.appendChild(
      this.createUpgradeCard(
        selectedCar.id,
        "handling",
        "HANDLING",
        selectedCar.stats.handling,
        ""
      )
    );
  }

  // ==========================================================
  // Upgrade Card
  // ==========================================================

  private createUpgradeCard(
    carId: CarId,
    type: UpgradeType,
    label: string,
    baseValue: number,
    unit: string
  ): HTMLDivElement {

    const card =
      document.createElement("div");

    Object.assign(
      card.style,
      {
        display: "flex",
        flexDirection: "column",
        gap: "13px",
        padding: "17px",
        borderRadius: "18px",
        boxSizing: "border-box",
        background:
          "rgba(255,255,255,0.055)",
        border:
          "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          "0 5px 18px rgba(0,0,0,0.20)"
      }
    );

    // ========================================================
    // Header
    // ========================================================

    const cardHeader =
      document.createElement("div");

    Object.assign(
      cardHeader.style,
      {
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: "10px"
      }
    );

    const title =
      document.createElement("div");

    Object.assign(
      title.style,
      {
        fontSize: "17px",
        fontWeight: "900",
        letterSpacing:
          "0.5px"
      }
    );

    title.textContent =
      label;

    const level =
      this.upgradeSystem.getUpgradeLevel(
        carId,
        type
      );

    const maxLevel =
      this.upgradeSystem.getMaxLevel();

    const levelText =
      document.createElement("div");

    Object.assign(
      levelText.style,
      {
        fontSize: "12px",
        fontWeight: "800",
        color:
          "rgba(255,255,255,0.65)"
      }
    );

    levelText.textContent =
      `LV ${level}/${maxLevel}`;

    cardHeader.appendChild(
      title
    );

    cardHeader.appendChild(
      levelText
    );

    // ========================================================
    // Current Stat
    // ========================================================

    const stats =
      this.upgradeSystem.getStats(
        carId
      );

    let currentValue =
      baseValue;

    if (
      type === "speed"
    ) {
      currentValue =
        stats.maxSpeed;
    } else if (
      type === "acceleration"
    ) {
      currentValue =
        stats.acceleration;
    } else if (
      type === "handling"
    ) {
      currentValue =
        stats.handling;
    }

    const valueRow =
      document.createElement("div");

    Object.assign(
      valueRow.style,
      {
        display: "flex",
        alignItems: "baseline",
        gap: "6px"
      }
    );

    const value =
      document.createElement("span");

    Object.assign(
      value.style,
      {
        fontSize: "30px",
        lineHeight: "34px",
        fontWeight: "900"
      }
    );

    value.textContent =
      Number.isFinite(
        currentValue
      )
        ? currentValue.toString()
        : "0";

    const unitElement =
      document.createElement("span");

    Object.assign(
      unitElement.style,
      {
        fontSize: "12px",
        fontWeight: "700",
        opacity: "0.55"
      }
    );

    unitElement.textContent =
      unit;

    valueRow.appendChild(
      value
    );

    if (unit) {
      valueRow.appendChild(
        unitElement
      );
    }

    // ========================================================
    // Level Bar
    // ========================================================

    const track =
      document.createElement("div");

    Object.assign(
      track.style,
      {
        width: "100%",
        height: "7px",
        borderRadius: "99px",
        overflow: "hidden",
        background:
          "rgba(255,255,255,0.10)"
      }
    );

    const fill =
      document.createElement("div");

    const percentage =
      maxLevel > 0
        ? Math.min(
            100,
            Math.max(
              0,
              (level /
                maxLevel) *
                100
            )
          )
        : 0;

    Object.assign(
      fill.style,
      {
        width:
          `${percentage}%`,
        height: "100%",
        borderRadius:
          "99px",
        background:
          "rgba(80,145,255,0.90)"
      }
    );

    track.appendChild(
      fill
    );

    // ========================================================
    // Cost
    // ========================================================

    const cost =
      this.upgradeSystem.getUpgradeCost(
        carId,
        type
      );

    const canUpgrade =
      this.upgradeSystem.canUpgrade(
        carId,
        type
      );

    const costText =
      document.createElement("div");

    Object.assign(
      costText.style,
      {
        fontSize: "12px",
        fontWeight: "800",
        color:
          level >= maxLevel
            ? "#66d68a"
            : canUpgrade
              ? "#ffd54a"
              : "#ff8b8b"
      }
    );

    if (
      level >= maxLevel
    ) {

      costText.textContent =
        "MAX LEVEL";

    } else {

      costText.textContent =
        `UPGRADE COST: ${cost} COINS`;
    }

    // ========================================================
    // Upgrade Button
    // ========================================================

    const button =
      document.createElement("button");

    Object.assign(
      button.style,
      {
        width: "100%",
        minHeight: "46px",
        border: "0",
        borderRadius: "13px",
        color: "#ffffff",
        fontSize: "14px",
        fontWeight: "900",
        letterSpacing:
          "0.4px",
        cursor:
          "pointer",
        touchAction:
          "manipulation"
      }
    );

    if (
      level >= maxLevel
    ) {

      button.textContent =
        "MAX LEVEL";

      button.disabled =
        true;

      button.style.background =
        "rgba(80,145,255,0.30)";

      button.style.cursor =
        "default";

    } else if (
      !canUpgrade
    ) {

      button.textContent =
        `NEED ${cost} COINS`;

      button.disabled =
        true;

      button.style.background =
        "rgba(255,255,255,0.10)";

      button.style.cursor =
        "not-allowed";

    } else {

      button.textContent =
        `UPGRADE — ${cost} COINS`;

      button.style.background =
        "linear-gradient(135deg, #3478ff, #2253c9)";

      button.addEventListener(
        "click",
        () => {

          this.purchaseUpgrade(
            carId,
            type
          );
        }
      );
    }

    // ========================================================
    // Assemble Card
    // ========================================================

    card.appendChild(
      cardHeader
    );

    card.appendChild(
      valueRow
    );

    card.appendChild(
      track
    );

    card.appendChild(
      costText
    );

    card.appendChild(
      button
    );

    return card;
  }

  // ==========================================================
  // Purchase Upgrade
  // ==========================================================

  private purchaseUpgrade(
    carId: CarId,
    type: UpgradeType
  ): void {

    if (
      this.disposed
    ) {
      return;
    }

    const result =
      this.upgradeSystem.upgrade(
        carId,
        type
      );

    if (
      !result.success
    ) {

      this.render();

      return;
    }

    /*
     * UpgradeSystem has already:
     *
     * 1. Validated the car
     * 2. Checked level
     * 3. Calculated cost
     * 4. Charged EconomyManager
     * 5. Increased upgrade level
     *
     * UI only informs the external
     * persistence layer.
     */

    this.onChanged();

    this.render();
  }

  // ==========================================================
  // Open
  // ==========================================================

  public open(): void {

    if (
      this.disposed
    ) {
      return;
    }

    this.root.style.display =
      "flex";

    this.render();
  }

  // ==========================================================
  // Hide
  // ==========================================================

  public hide(): void {

    if (
      this.disposed
    ) {
      return;
    }

    this.root.style.display =
      "none";
  }

  // ==========================================================
  // Visibility
  // ==========================================================

  public isVisible(): boolean {

    return (
      !this.disposed &&
      this.root.style.display !==
        "none"
    );
  }

  // ==========================================================
  // Close
  // ==========================================================

  private handleClose = (
    event: MouseEvent
  ): void => {

    event.preventDefault();
    event.stopPropagation();

    this.onClose();
  };

  // ==========================================================
  // Dispose
  // ==========================================================

  public dispose(): void {

    if (
      this.disposed
    ) {
      return;
    }

    this.disposed =
      true;

    this.closeButton.removeEventListener(
      "click",
      this.handleClose
    );

    if (
      this.root.parentElement
    ) {

      this.root.parentElement.removeChild(
        this.root
      );
    }
  }
}
