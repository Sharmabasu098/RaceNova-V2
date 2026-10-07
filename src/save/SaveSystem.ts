/**
 * ============================================================
 * RaceNova V2
 * Save System
 * M4.9
 * M11.8.7 — Account Binding
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
 * - Provide profile persistence boundary
 * - Bind persistence to exactly one account
 *
 * IMPORTANT:
 * - No UI logic
 * - No Three.js dependency
 * - No Pi payment logic
 * - SaveSystem is the only layer that talks to browser storage
 * - One SaveSystem instance belongs to one account
 * - Account switching requires a new SaveSystem instance
 *
 * M10.3:
 * - Adds profile persistence methods
 * - Existing PlayerSaveData flow remains unchanged
 * - LocalPersistenceRepository will use these methods
 *
 * M11.8.7:
 * - Removes global authenticated save/profile keys
 * - Adds required accountId configuration
 * - Derives account-scoped save/profile keys
 * - Adds getAccountId() diagnostic getter
 * - Legacy global keys are not migrated or deleted
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
  type PlayerProfile,
  clonePlayerProfile,
  touchPlayerProfile,
  isValidPlayerProfile
} from "../profile/PlayerProfile";

import {
  type PlayerSaveData,
  PLAYER_SAVE_VERSION,
  createDefaultPlayerSaveData,
  clonePlayerSaveData,
  isValidPlayerSaveData,
  isSupportedPlayerSaveVersion,
  sanitizePlayerProgress
} from "./PlayerSaveData";

import {
  AccountStorageKeyBuilder
} from "./AccountStorageKeyBuilder";

// ============================================================
// Configuration
// ============================================================

export interface SaveSystemConfig {

  /**
   * Stable account identifier used to bind
   * this SaveSystem instance to exactly
   * one authenticated account.
   *
   * Example:
   *
   * google:<verified-google-sub>
   * pi:<verified-pi-uid>
   */
  accountId: string;

  /**
   * Automatically save when save() is called.
   */
  enabled?: boolean;
}

// ============================================================
// Default Configuration
// ============================================================

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

  /**
   * Stable account identifier.
   *
   * This SaveSystem instance is permanently
   * bound to this account for its lifetime.
   */
  private readonly accountId:
    string;

  /**
   * Account-scoped PlayerSaveData key.
   */
  private readonly storageKey:
    string;

  /**
   * Account-scoped PlayerProfile key.
   */
  private readonly profileStorageKey:
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
    config: SaveSystemConfig
  ) {

    // --------------------------------------------------------
    // Account binding
    // --------------------------------------------------------

    this.accountId =
      config.accountId;

    // --------------------------------------------------------
    // Derive account-scoped storage keys once.
    //
    // SaveSystem never rebinds to another account.
    // --------------------------------------------------------

    this.storageKey =
      AccountStorageKeyBuilder.buildSaveKey(
        this.accountId
      );

    this.profileStorageKey =
      AccountStorageKeyBuilder.buildProfileKey(
        this.accountId
      );

    // --------------------------------------------------------
    // Connected gameplay systems
    // --------------------------------------------------------

    this.economy =
      economy;

    this.garage =
      garage;

    this.upgrades =
      upgrades;

    // --------------------------------------------------------
    // Configuration
    // --------------------------------------------------------

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
   * to this account's browser localStorage
   * namespace.
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
      // Write to account-scoped key
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
   * Loads the player save from this
   * account's browser localStorage namespace.
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
  // M10.3 — Save Player Profile
  // ==========================================================

  /**
   * Saves a complete PlayerProfile.
   *
   * This is the profile persistence boundary
   * used by LocalPersistenceRepository.
   *
   * SaveSystem remains the only layer that
   * directly accesses browser storage.
   *
   * This does NOT replace the existing save()
   * method or existing PlayerSaveData storage.
   */
  public saveProfile(
    profile: PlayerProfile
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

      // ------------------------------------------------------
      // Clone before modifying timestamp
      // ------------------------------------------------------

      const snapshot =
        clonePlayerProfile(
          profile
        );

      // ------------------------------------------------------
      // Update profile timestamp
      // ------------------------------------------------------

      const timestampedProfile =
        touchPlayerProfile(
          snapshot
        );

      // ------------------------------------------------------
      // Validate profile
      // ------------------------------------------------------

      if (
        !isValidPlayerProfile(
          timestampedProfile
        )
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Validate contained PlayerSaveData
      // ------------------------------------------------------

      if (
        !isValidPlayerSaveData(
          timestampedProfile.saveData
        )
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Validate PlayerSaveData version
      // ------------------------------------------------------

      if (
        !isSupportedPlayerSaveVersion(
          timestampedProfile.saveData.version
        )
      ) {
        return false;
      }

      // ------------------------------------------------------
      // Serialize
      // ------------------------------------------------------

      const serialized =
        JSON.stringify(
          timestampedProfile
        );

      // ------------------------------------------------------
      // Write account-scoped profile
      // ------------------------------------------------------

      window.localStorage.setItem(
        this.profileStorageKey,
        serialized
      );

      return true;

    } catch {

      /*
       * Profile storage failures must never
       * crash the game.
       */

      return false;
    }
  }

  // ==========================================================
  // M10.3 — Load Player Profile
  // ==========================================================

  /**
   * Loads a complete PlayerProfile.
   *
   * This only reads and validates the profile.
   *
   * It does NOT automatically restore
   * EconomyManager, GarageManager or
   * UpgradeSystem.
   */
  public loadProfile():
    PlayerProfile | null {

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
          this.profileStorageKey
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

      // ------------------------------------------------------
      // Validate profile structure
      // ------------------------------------------------------

      if (
        !isValidPlayerProfile(
          parsed
        )
      ) {
        return null;
      }

      // ------------------------------------------------------
      // Validate contained PlayerSaveData
      // ------------------------------------------------------

      if (
        !isValidPlayerSaveData(
          parsed.saveData
        )
      ) {
        return null;
      }

      // ------------------------------------------------------
      // Validate PlayerSaveData version
      // ------------------------------------------------------

      if (
        !isSupportedPlayerSaveVersion(
          parsed.saveData.version
        )
      ) {
        return null;
      }

      // ------------------------------------------------------
      // Return defensive clone
      // ------------------------------------------------------

      return clonePlayerProfile(
        parsed
      );

    } catch {

      /*
       * Corrupt JSON or storage failure
       * must never crash the game.
       */

      return null;
    }
  }

  // ==========================================================
  // M10.3 — Has Player Profile
  // ==========================================================

  /**
   * Checks whether a profile record exists
   * for this account.
   *
   * This does not validate the entire
   * profile structure.
   */
  public hasProfile(): boolean {

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
          this.profileStorageKey
        ) !== null
      );

    } catch {

      return false;
    }
  }

  // ==========================================================
  // M10.3 — Delete Player Profile
  // ==========================================================

  /**
   * Deletes the stored PlayerProfile
   * for this account.
   *
   * This does NOT delete the PlayerSaveData
   * record.
   *
   * This does NOT reset gameplay managers.
   */
  public deleteProfile(): boolean {

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
        this.profileStorageKey
      );

      return true;

    } catch {

      return false;
    }
  }

  // ==========================================================
  // Has Save
  // ==========================================================

  /**
   * Checks whether a save exists
   * for this account.
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
   * save for this account without
   * applying it.
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
   * Deletes the stored player save
   * for this account.
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
   *
   * M10.3 intentionally does not
   * delete the PlayerProfile record.
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
    // Remove account-scoped save
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
  // Account ID
  // ==========================================================

  /**
   * Returns the account identifier to which
   * this SaveSystem instance is permanently bound.
   *
   * Diagnostic / QA use only.
   */
  public getAccountId(): string {
    return this.accountId;
  }

    // ==========================================================
  // Storage Key
  // ==========================================================

  public getStorageKey(): string {
    return this.storageKey;
  }

  // ==========================================================
  // Profile Storage Key
  // ==========================================================

  public getProfileStorageKey(): string {
    return this.profileStorageKey;
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
