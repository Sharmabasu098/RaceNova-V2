/**
 * ============================================================
 * RaceNova V2
 * Save System
 * M4.9
 * ============================================================
 *
 * Responsibilities:
 * - Create complete player save snapshots
 * - Save player progress
 * - Load player progress
 * - Validate save data
 * - Restore EconomyManager
 * - Restore GarageManager
 * - Restore UpgradeSystem
 * - Handle invalid/corrupt save data safely
 * - Handle save-data version checks
 *
 * IMPORTANT:
 * - No UI logic
 * - No Three.js dependency
 * - No Pi payment logic
 * - SaveSystem is the only layer that talks to browser storage
 * ============================================================
 */

import {
  EconomyManager
} from "../economy/EconomyManager";

import {
  GarageManager
} from "../garage/GarageManager";

import {
  UpgradeSystem
} from "../garage/UpgradeSystem";

import {
  type PlayerSaveData,
  PLAYER_SAVE_VERSION,
  createDefaultPlayerSaveData,
  clonePlayerSaveData,
  isValidPlayerSaveData,
  isSupportedPlayerSaveVersion,
  sanitizePlayerProgress
} from "./PlayerSaveData";

// ============================================================
// Configuration
// ============================================================

export interface SaveSystemConfig {
  /**
   * Storage key used inside localStorage.
   */
  storageKey?: string;

  /**
   * Automatically save when save() is called.
   */
  enabled?: boolean;
}

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_STORAGE_KEY =
  "racenova-v2-player-save";

const DEFAULT_ENABLED =
  true;

// ============================================================
// Save System
// ============================================================

export class SaveSystem {

  private readonly economy:
    EconomyManager;

  private readonly garage:
    GarageManager;

  private readonly upgrades:
    UpgradeSystem;

  private readonly storageKey:
    string;

  private readonly enabled:
    boolean;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    economy: EconomyManager,
    garage: GarageManager,
    upgrades: UpgradeSystem,
    config: SaveSystemConfig = {}
  ) {

    this.economy =
      economy;

    this.garage =
      garage;

    this.upgrades =
      upgrades;

    this.storageKey =
      config.storageKey ??
      DEFAULT_STORAGE_KEY;

    this.enabled =
      config.enabled ??
      DEFAULT_ENABLED;
  }

  // ==========================================================
  // Create Snapshot
  // ==========================================================

  /**
   * Creates a complete in-memory
   * player save snapshot.
   *
   * This does NOT write to storage.
   */
  public createSnapshot():
    PlayerSaveData {

    const data =
      createDefaultPlayerSaveData(
        this.economy.getState(),
        this.garage.getState(),
        this.upgrades.getState()
      );

    return clonePlayerSaveData(
      data
    );
  }

  // ==========================================================
  // Save
  // ==========================================================

  /**
   * Saves the current player state
   * to browser localStorage.
   */
  public save(
    progressOverride?: Partial<
      PlayerSaveData["progress"]
    >
  ): boolean {

    if (!this.enabled) {
      return false;
    }

    if (
      typeof window ===
      "undefined" ||
      !window.localStorage
    ) {
      return false;
    }

    try {

      const snapshot =
        this.createSnapshot();

      // ------------------------------------------------------
      // Optional progress update
      // ------------------------------------------------------

      if (
        progressOverride
      ) {

        snapshot.progress =
          sanitizePlayerProgress({
            ...snapshot.progress,
            ...progressOverride
          });
      }

      // ------------------------------------------------------
      // Update timestamp
      // ------------------------------------------------------

      snapshot.updatedAt =
        Date.now();

      // ------------------------------------------------------
      // Validate before storage
      // ------------------------------------------------------

      if (
        !isValidPlayerSaveData(
          snapshot
        )
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Serialize
      // ------------------------------------------------------

      const serialized =
        JSON.stringify(
          snapshot
        );

      // ------------------------------------------------------
      // Write
      // ------------------------------------------------------

      window.localStorage.setItem(
        this.storageKey,
        serialized
      );

      return true;

    } catch {

      /*
       * Storage failures must never
       * crash the game.
       */

      return false;
    }
  }

  // ==========================================================
  // Load
  // ==========================================================

  /**
   * Loads the player save from
   * browser localStorage.
   *
   * Returns true when a valid save
   * was successfully restored.
   */
  public load(): boolean {

    if (!this.enabled) {
      return false;
    }

    if (
      typeof window ===
      "undefined" ||
      !window.localStorage
    ) {
      return false;
    }

    try {

      const serialized =
        window.localStorage.getItem(
          this.storageKey
        );

      if (
        !serialized
      ) {
        return false;
      }

      const parsed:
        unknown =
        JSON.parse(
          serialized
        );

      // ------------------------------------------------------
      // Validate structure
      // ------------------------------------------------------

      if (
        !isValidPlayerSaveData(
          parsed
        )
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Validate version
      // ------------------------------------------------------

      if (
        !isSupportedPlayerSaveVersion(
          parsed.version
        )
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Restore economy
      // ------------------------------------------------------

      const economyLoaded =
        this.economy.loadState(
          parsed.economy
        );

      if (
        !economyLoaded
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Restore garage
      // ------------------------------------------------------

      const garageLoaded =
        this.garage.loadState(
          parsed.garage
        );

      if (
        !garageLoaded
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Restore upgrades
      // ------------------------------------------------------

      const upgradesLoaded =
        this.upgrades.loadState(
          parsed.upgrades
        );

      if (
        !upgradesLoaded
      ) {
        return false;
      }

      return true;

    } catch {

      /*
       * Corrupt JSON or storage failure
       * must never crash the game.
       */

      return false;
    }
  }

  // ==========================================================
  // Has Save
  // ==========================================================

  /**
   * Checks whether a save exists.
   *
   * This does not validate the entire
   * save structure.
   */
  public hasSave(): boolean {

    if (!this.enabled) {
      return false;
    }

    if (
      typeof window ===
      "undefined" ||
      !window.localStorage
    ) {
      return false;
    }

    try {

      return (
        window.localStorage.getItem(
          this.storageKey
        ) !== null
      );

    } catch {

      return false;
    }
  }

  // ==========================================================
  // Read Save
  // ==========================================================

  /**
   * Reads and validates the stored
   * save without applying it.
   *
   * Useful for debugging and future
   * profile/menu systems.
   */
  public readSave():
    PlayerSaveData | null {

    if (!this.enabled) {
      return null;
    }

    if (
      typeof window ===
      "undefined" ||
      !window.localStorage
    ) {
      return null;
    }

    try {

      const serialized =
        window.localStorage.getItem(
          this.storageKey
        );

      if (
        !serialized
      ) {
        return null;
      }

      const parsed:
        unknown =
        JSON.parse(
          serialized
        );

      if (
        !isValidPlayerSaveData(
          parsed
        )
      ) {
        return null;
      }

      if (
        !isSupportedPlayerSaveVersion(
          parsed.version
        )
      ) {
        return null;
      }

      return clonePlayerSaveData(
        parsed
      );

    } catch {

      return null;
    }
  }

  // ==========================================================
  // Delete Save
  // ==========================================================

  /**
   * Deletes the stored player save.
   *
   * This does NOT reset the managers.
   */
  public deleteSave(): boolean {

    if (!this.enabled) {
      return false;
    }

    if (
      typeof window ===
      "undefined" ||
      !window.localStorage
    ) {
      return false;
    }

    try {

      window.localStorage.removeItem(
        this.storageKey
      );

      return true;

    } catch {

      return false;
    }
  }

  // ==========================================================
  // Reset Progress
  // ==========================================================

  /**
   * Deletes the persistent save and
   * resets all connected systems.
   */
  public resetProgress(): boolean {

    if (!this.enabled) {
      return false;
    }

    // --------------------------------------------------------
    // Reset managers
    // --------------------------------------------------------

    this.economy.reset();

    this.garage.reset();

    this.upgrades.reset();

    // --------------------------------------------------------
    // Remove stored save
    // --------------------------------------------------------

    return this.deleteSave();
  }

  // ==========================================================
  // Save Version
  // ==========================================================

  public getSaveVersion(): number {
    return PLAYER_SAVE_VERSION;
  }

  // ==========================================================
  // Storage Key
  // ==========================================================

  public getStorageKey(): string {
    return this.storageKey;
  }

  // ==========================================================
  // Enabled
  // ==========================================================

  public isEnabled(): boolean {
    return this.enabled;
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  /**
   * SaveSystem does not own any external
   * listeners or rendering resources.
   *
   * This method exists so RaceNovaEngine
   * can dispose all systems consistently.
   */
  public dispose(): void {
    // Intentionally empty.
  }
}
