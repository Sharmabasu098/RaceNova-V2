/**
 * ============================================================
 * RaceNova V2
 * Garage UI
 * M5.4
 * ============================================================
 *
 * Responsibilities:
 * - Display all available cars
 * - Show owned / locked state
 * - Show car stats
 * - Buy / unlock cars
 * - Select owned cars
 * - Display upgrade UI
 * - Purchase Speed / Acceleration / Handling upgrades
 * - Notify external systems about changes
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No localStorage logic
 * - No direct SaveSystem logic
 * - GarageManager remains authoritative for ownership
 * - EconomyManager remains authoritative for coins
 * - UpgradeSystem remains authoritative for upgrades
 * ============================================================
 */

import {
  GarageManager
} from "../garage/GarageManager";

import {
  type CarId,
  type CarDefinition
} from "../garage/CarData";

import {
  EconomyManager
} from "../economy/EconomyManager";

import {
  UpgradeSystem,
  type UpgradeType
} from "../garage/UpgradeSystem";

// ============================================================
// Configuration
// ============================================================

export interface GarageUIConfig {

  /**
   * Called after:
   * - successful car purchase
   * - car selection
   * - successful upgrade
   *
   * RaceNovaEngine uses this to
   * persist through SaveSystem.
   */
  onChanged?: () => void;

  /**
   * Called when the player selects
   * a car.
   *
   * M5.3 runtime car switching uses
   * this callback.
   */
  onCarSelected?: (
    carId: CarId
  ) => void;

  /**
   * UpgradeSystem is authoritative
   * for upgrade levels, costs and stats.
   */
  upgradeSystem?: UpgradeSystem;

  /**
   * Optional close callback.
   */
  onClose?: () => void;
}

  /**
   * Called when the player wants to upgrade
   * the currently selected car.
   */
  onUpgrade?: (
    carId: CarId
  ) => void;

// ============================================================
// Garage UI
// ============================================================

export class Garage {

  // ==========================================================
  // Managers
  // ==========================================================

  private readonly garageManager:
    GarageManager;

  private readonly economyManager:
    EconomyManager;

  private readonly upgradeSystem:
    UpgradeSystem | undefined;

  // ==========================================================
  // Callbacks
  // ==========================================================

  private readonly onChanged:
    () => void;

  private readonly onCarSelected:
    (carId: CarId) => void;

  private readonly onClose:
    () => void;
  
  private readonly onUpgrade:
    (carId: CarId) => void;

  // ==========================================================
  // DOM
  // ==========================================================

  private readonly root:
    HTMLDivElement;

  private readonly header:
    HTMLDivElement;

  private readonly coinValue:
    HTMLSpanElement;

  private readonly carsContainer:
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
    economyManager: EconomyManager,
    config: GarageUIConfig = {}
  ) {

    this.garageManager =
      garageManager;

    this.economyManager =
      economyManager;

    this.upgradeSystem =
      config.upgradeSystem;

    this.onChanged =
      config.onChanged ??
      (() => undefined);

    this.onCarSelected =
      config.onCarSelected ??
      (() => undefined);

    this.onClose =
      config.onClose ??
      (() => undefined);

    this.onUpgrade =
      config.onUpgrade ??
      (() => undefined);

    // ========================================================
    // Root
    // ========================================================

    this.root =
      document.createElement(
        "div"
      );

    this.root.id =
      "racenova-garage";

    Object.assign(
      this.root.style,
      {
        position: "fixed",
        inset: "0",
        width: "100%",
        height: "100%",
        zIndex: "2000",
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
        WebkitUserSelect:
          "none"
      }
    );

    // ========================================================
    // Header
    // ========================================================

    this.header =
      document.createElement(
        "div"
      );

    Object.assign(
      this.header.style,
      {
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: "12px",
        padding:
          "16px 18px",
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
      document.createElement(
        "div"
      );

    Object.assign(
      title.style,
      {
        fontSize: "24px",
        lineHeight: "28px",
        fontWeight: "900",
        letterSpacing: "1px"
      }
    );

    title.textContent =
      "GARAGE";

    // ========================================================
    // Header Right
    // ========================================================

    const headerRight =
      document.createElement(
        "div"
      );

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
      document.createElement(
        "div"
      );

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

    // ========================================================
    // Coin Icon
    // ========================================================

    const coinIcon =
      document.createElement(
        "span"
      );

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

    // ========================================================
    // Coin Value
    // ========================================================

    this.coinValue =
      document.createElement(
        "span"
      );

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
      document.createElement(
        "button"
      );

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
        color: "#ffffff",
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

    this.header.appendChild(
      title
    );

    this.header.appendChild(
      headerRight
    );

    // ========================================================
    // Cars Container
    // ========================================================

    this.carsContainer =
      document.createElement(
        "div"
      );

    Object.assign(
      this.carsContainer.style,
      {
        flex: "1 1 auto",
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(270px, 1fr))",
        gap: "14px",
        padding: "16px",
        boxSizing: "border-box",
        overflowY: "auto",
        WebkitOverflowScrolling:
          "touch"
      }
    );

    // ========================================================
    // Add To DOM
    // ========================================================

    this.root.appendChild(
      this.header
    );

    this.root.appendChild(
      this.carsContainer
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

    // --------------------------------------------------------
    // Coins
    // --------------------------------------------------------

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

    // --------------------------------------------------------
    // Clear Cars
    // --------------------------------------------------------

    this.carsContainer.innerHTML =
      "";

    // --------------------------------------------------------
    // Cars
    // --------------------------------------------------------

    const cars =
      this.garageManager.getAllCars();

    for (
      const car of cars
    ) {

      this.carsContainer.appendChild(
        this.createCarCard(
          car
        )
      );
    }
  }

  // ==========================================================
  // Create Car Card
  // ==========================================================

  private createCarCard(
    car: CarDefinition
  ): HTMLDivElement {

    const owned =
      this.garageManager.ownsCar(
        car.id
      );

    const selected =
      this.garageManager
        .getSelectedCarId() ===
      car.id;

    const card =
      document.createElement(
        "div"
      );

    Object.assign(
      card.style,
      {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "16px",
        borderRadius: "18px",
        boxSizing: "border-box",
        background:
          selected
            ? "rgba(55,120,255,0.16)"
            : "rgba(255,255,255,0.055)",
        border:
          selected
            ? "2px solid rgba(80,145,255,0.75)"
            : "1px solid rgba(255,255,255,0.10)",
        boxShadow:
          selected
            ? "0 8px 24px rgba(0,0,0,0.28)"
            : "0 5px 18px rgba(0,0,0,0.20)"
      }
    );

    // ========================================================
    // Car Name
    // ========================================================

    const name =
      document.createElement(
        "div"
      );

    Object.assign(
      name.style,
      {
        fontSize: "21px",
        fontWeight: "900"
      }
    );

    name.textContent =
      car.name;

    card.appendChild(
      name
    );

    // ========================================================
    // Description
    // ========================================================

    const description =
      document.createElement(
        "div"
      );

    Object.assign(
      description.style,
      {
        minHeight: "38px",
        color:
          "rgba(255,255,255,0.68)",
        fontSize: "13px",
        lineHeight: "18px"
      }
    );

    description.textContent =
      car.description;

    card.appendChild(
      description
    );

    // ========================================================
    // Base / Effective Stats
    // ========================================================

    const stats =
      document.createElement(
        "div"
      );

    Object.assign(
      stats.style,
      {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
      }
    );

    let speed =
      car.stats.maxSpeed;

    let acceleration =
      car.stats.acceleration;

    let handling =
      car.stats.handling;

    if (
      owned &&
      this.upgradeSystem
    ) {

      const effectiveStats =
        this.upgradeSystem.getStats(
          car.id
        );

      speed =
        effectiveStats.maxSpeed;

      acceleration =
        effectiveStats.acceleration;

      handling =
        effectiveStats.handling;
    }

    stats.appendChild(
      this.createStatRow(
        "SPEED",
        speed,
        200
      )
    );

    stats.appendChild(
      this.createStatRow(
        "ACCELERATION",
        acceleration,
        70
      )
    );

    stats.appendChild(
      this.createStatRow(
        "HANDLING",
        handling,
        10
      )
    );

    card.appendChild(
      stats
    );

    // ========================================================
    // Status
    // ========================================================

    const status =
      document.createElement(
        "div"
      );

    Object.assign(
      status.style,
      {
        fontSize: "12px",
        fontWeight: "800",
        letterSpacing: "0.8px",
        minHeight: "16px"
      }
    );

    if (
      selected
    ) {

      status.textContent =
        "SELECTED";

      status.style.color =
        "#65a0ff";

    } else if (
      owned
    ) {

      status.textContent =
        "OWNED";

      status.style.color =
        "#66d68a";

    } else {

      status.textContent =
        "LOCKED";

      status.style.color =
        "rgba(255,255,255,0.55)";
    }

    card.appendChild(
      status
    );

    // ========================================================
    // M5.4 Upgrade Panel
    // ========================================================

    if (
      owned &&
      this.upgradeSystem
    ) {

      card.appendChild(
        this.createUpgradePanel(
          car.id
        )
      );
    }

        // ========================================================
    // Action Button
    // ========================================================

    const button =
      document.createElement(
        "button"
      );

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
        letterSpacing: "0.4px",
        cursor: "pointer",
        touchAction:
          "manipulation"
      }
    );

    // ========================================================
    // Action Button State
    // ========================================================

    if (
      selected
    ) {

      button.textContent =
        "SELECTED";

      button.disabled =
        true;

      button.style.background =
        "rgba(80,145,255,0.30)";

      button.style.cursor =
        "default";

    } else if (
      owned
    ) {

      button.textContent =
        "SELECT CAR";

      button.style.background =
        "linear-gradient(135deg, #3478ff, #2253c9)";

      button.addEventListener(
        "click",
        () => {

          this.selectCar(
            car.id
          );

        }
      );

    } else {

      button.textContent =
        car.unlockCost > 0
          ? `BUY ${car.unlockCost} COINS`
          : "UNLOCK";

      button.style.background =
        "linear-gradient(135deg, #2f9b67, #17623f)";

      button.addEventListener(
        "click",
        () => {

          this.buyCar(
            car
          );

        }
      );
    }

    // ========================================================
    // Upgrade Button
    // ========================================================
    //
    // Only owned cars can be upgraded.
    //
    // Garage.ts does NOT open UpgradeScreen directly.
    // It only notifies RaceNovaEngine through onUpgrade().
    //
    // ========================================================

    if (
      owned
    ) {

      const upgradeButton =
        document.createElement(
          "button"
        );

      Object.assign(
        upgradeButton.style,
        {
          width: "100%",
          minHeight: "44px",
          border:
            "1px solid rgba(80,145,255,0.45)",
          borderRadius: "13px",
          background:
            "rgba(80,145,255,0.12)",
          color:
            "#75a9ff",
          fontSize:
            "13px",
          fontWeight:
            "900",
          letterSpacing:
            "0.5px",
          cursor:
            "pointer",
          touchAction:
            "manipulation"
        }
      );

      upgradeButton.textContent =
        "UPGRADE CAR";

      upgradeButton.addEventListener(
        "click",
        (
          event
        ) => {

          event.preventDefault();

          event.stopPropagation();

          this.onUpgrade(
            car.id
          );
        }
      );

      card.appendChild(
        upgradeButton
      );
    }

    // ========================================================
    // Add Main Action Button
    // ========================================================

    card.appendChild(
      button
    );

    return card;

  // ==========================================================
  // Upgrade Panel
  // ==========================================================

  private createUpgradePanel(
    carId: CarId
  ): HTMLDivElement {

    const panel =
      document.createElement(
        "div"
      );

    Object.assign(
      panel.style,
      {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginTop: "2px",
        padding: "10px",
        borderRadius: "14px",
        background:
          "rgba(0,0,0,0.18)",
        border:
          "1px solid rgba(255,255,255,0.08)"
      }
    );

    const title =
      document.createElement(
        "div"
      );

    Object.assign(
      title.style,
      {
        fontSize: "12px",
        fontWeight: "900",
        letterSpacing: "0.8px",
        opacity: "0.75"
      }
    );

    title.textContent =
      "UPGRADES";

    panel.appendChild(
      title
    );

    panel.appendChild(
      this.createUpgradeRow(
        carId,
        "speed",
        "SPEED"
      )
    );

    panel.appendChild(
      this.createUpgradeRow(
        carId,
        "acceleration",
        "ACCELERATION"
      )
    );

    panel.appendChild(
      this.createUpgradeRow(
        carId,
        "handling",
        "HANDLING"
      )
    );

    return panel;
  }

  // ==========================================================
  // Upgrade Row
  // ==========================================================

  private createUpgradeRow(
    carId: CarId,
    type: UpgradeType,
    label: string
  ): HTMLDivElement {

    const row =
      document.createElement(
        "div"
      );

    Object.assign(
      row.style,
      {
        display: "flex",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: "8px"
      }
    );

    const left =
      document.createElement(
        "div"
      );

    Object.assign(
      left.style,
      {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: "0",
        flex: "1"
      }
    );

    const labelElement =
      document.createElement(
        "span"
      );

    labelElement.textContent =
      label;

    Object.assign(
      labelElement.style,
      {
        fontSize: "10px",
        fontWeight: "800",
        letterSpacing: "0.6px",
        opacity: "0.65"
      }
    );

    const levels =
      this.upgradeSystem!.getUpgradeLevels(
        carId
      );

    const level =
      levels[type];

    const maxLevel =
      this.upgradeSystem!.getMaxLevel();

    const levelElement =
      document.createElement(
        "span"
      );

    levelElement.textContent =
      `LEVEL ${level}/${maxLevel}`;

    Object.assign(
      levelElement.style,
      {
        fontSize: "11px",
        fontWeight: "800"
      }
    );

    left.appendChild(
      labelElement
    );

    left.appendChild(
      levelElement
    );

    // ========================================================
    // Upgrade Cost
    // ========================================================

    const cost =
      this.upgradeSystem!.getUpgradeCost(
        carId,
        type
      );

    const canUpgrade =
      this.upgradeSystem!.canUpgrade(
        carId,
        type
      );

   const maxed =
      level >= maxLevel;

    // ========================================================
    // Button
    // ========================================================

    const button =
      document.createElement(
        "button"
      );

    Object.assign(
      button.style,
      {
        minWidth: "112px",
        minHeight: "34px",
        padding: "6px 10px",
        border: "0",
        borderRadius: "9px",
        color: "#ffffff",
        fontSize: "10px",
        fontWeight: "900",
        cursor:
          maxed
            ? "default"
            : canUpgrade
              ? "pointer"
              : "not-allowed",
        touchAction:
          "manipulation",
        opacity:
          maxed || canUpgrade
            ? "1"
            : "0.55"
      }
    );

    if (
      maxed
    ) {

      button.textContent =
        "MAX";

      button.disabled =
        true;

      button.style.background =
        "rgba(255,255,255,0.10)";

    } else {

      button.textContent =
        `UPGRADE ${cost}`;

      button.style.background =
        canUpgrade
          ? "linear-gradient(135deg, #3478ff, #2253c9)"
          : "rgba(255,255,255,0.10)";

      button.disabled =
        !canUpgrade;

      if (
        canUpgrade
      ) {

        button.addEventListener(
          "click",
          () => {
            this.upgradeCar(
              carId,
              type
            );
          }
        );
      }
    }

    row.appendChild(
      left
    );

    row.appendChild(
      button
    );

    return row;
  }

  // ==========================================================
  // Stat Row
  // ==========================================================

  private createStatRow(
    label: string,
    value: number,
    maximum: number
  ): HTMLDivElement {

    const wrapper =
      document.createElement(
        "div"
      );

    Object.assign(
      wrapper.style,
      {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
      }
    );

    const top =
      document.createElement(
        "div"
      );

    Object.assign(
      top.style,
      {
        display: "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center"
      }
    );

    const labelElement =
      document.createElement(
        "span"
      );

    labelElement.textContent =
      label;

    Object.assign(
      labelElement.style,
      {
        fontSize: "10px",
        fontWeight: "800",
        opacity: "0.65",
        letterSpacing: "0.7px"
      }
    );

    const valueElement =
      document.createElement(
        "span"
      );

    valueElement.textContent =
      Number.isFinite(value)
        ? value.toString()
        : "0";

    Object.assign(
      valueElement.style,
      {
        fontSize: "12px",
        fontWeight: "800"
      }
    );

    top.appendChild(
      labelElement
    );

    top.appendChild(
      valueElement
    );

    const track =
      document.createElement(
        "div"
      );

    Object.assign(
      track.style,
      {
        width: "100%",
        height: "6px",
        borderRadius: "99px",
        overflow: "hidden",
        background:
          "rgba(255,255,255,0.10)"
      }
    );

    const fill =
      document.createElement(
        "div"
      );

    const percentage =
      maximum > 0
        ? Math.min(
            100,
            Math.max(
              0,
              (value / maximum) * 100
            )
          )
        : 0;

    Object.assign(
      fill.style,
      {
        width:
          `${percentage}%`,
        height: "100%",
        borderRadius: "99px",
        background:
          "rgba(80,145,255,0.90)"
      }
    );

    track.appendChild(
      fill
    );

    wrapper.appendChild(
      top
    );

    wrapper.appendChild(
      track
    );

    return wrapper;
  }

    // ==========================================================
  // Buy Car
  // ==========================================================

  private buyCar(
    car: CarDefinition
  ): void {

    if (
      this.disposed
    ) {
      return;
    }

    const success =
      this.garageManager.unlockCar(
        car.id
      );

    if (!success) {
      this.render();
      return;
    }

    /*
     * GarageManager has already:
     * - validated ownership
     * - validated unlock cost
     * - charged EconomyManager
     * - unlocked the car
     */

    this.onChanged();

    // ========================================================
    // Automatically select newly purchased car
    // ========================================================

    const selected =
      this.garageManager.selectCar(
        car.id
      );

    if (
      selected
    ) {

      /*
       * M5.3
       *
       * Notify RaceNovaEngine so the
       * runtime PlayerCar can switch
       * to the newly selected car.
       */
      this.onCarSelected(
        car.id
      );
    }

    this.render();
  }

  // ==========================================================
  // Select Car
  // ==========================================================

  private selectCar(
    carId: CarId
  ): void {

    if (
      this.disposed
    ) {
      return;
    }

    const success =
      this.garageManager.selectCar(
        carId
      );

    if (!success) {

      this.render();

      return;
    }

    /*
     * M5.3 Runtime Car Selection
     *
     * GarageManager remains the
     * authoritative owner of selection.
     *
     * RaceNovaEngine receives the event
     * and applies the selected car stats
     * to PlayerCar.
     */
    this.onCarSelected(
      carId
    );

    /*
     * Persist selected car through
     * RaceNovaEngine / SaveSystem.
     */
    this.onChanged();

    this.render();
  }

  // ==========================================================
  // Upgrade Car
  // ==========================================================

  private upgradeCar(
    carId: CarId,
    type: UpgradeType
  ): void {

    if (
      this.disposed ||
      !this.upgradeSystem
    ) {
      return;
    }

    /*
     * UpgradeSystem is authoritative.
     *
     * It handles:
     * - validation
     * - max level
     * - upgrade cost
     * - EconomyManager payment
     * - new upgrade level
     * - effective stats
     */

    const result =
      this.upgradeSystem.upgrade(
        carId,
        type
      );

    // ========================================================
    // Upgrade Failed
    // ========================================================

    if (
      !result.success
    ) {

      /*
       * Refresh coins / levels / buttons.
       */
      this.render();

      return;
    }

    // ========================================================
    // Upgrade Successful
    // ========================================================

    /*
     * Persist the upgraded state.
     *
     * SaveSystem remains outside Garage.
     */
    this.onChanged();

    /*
     * IMPORTANT:
     *
     * If this car is currently selected,
     * RaceNovaEngine receives the change
     * through onChanged and can keep the
     * runtime state synchronized.
     */

    this.render();
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

    // ========================================================
    // Close Button
    // ========================================================

    this.closeButton.removeEventListener(
      "click",
      this.handleClose
    );

    // ========================================================
    // Remove Root
    // ========================================================

    if (
      this.root.parentElement
    ) {

      this.root.parentElement.removeChild(
        this.root
      );
    }
  }
}
