/**
 * ============================================================
 * RaceNova V2
 * Temporary M11.4 QA
 * Authentication <-> Profile Integration
 * ============================================================
 *
 * TEMPORARY QA ONLY.
 *
 * Coverage:
 * - Local profile creation
 * - Authenticated identity binding
 * - Display-name synchronization
 * - PlayerSaveData preservation
 * - Persistence across runtime clear/reinitialize
 * - Different authenticated identity rejection
 *
 * No UI
 * No Pi SDK
 * No Google SDK
 * No network
 * No Three.js
 * ============================================================
 */

import {
  AuthenticationProvider,
  type AuthenticationIdentity
} from "./AuthenticationBoundary";

import {
  AuthenticationProfileBridge
} from "./AuthenticationProfileBridge";

import {
  RuntimeProfileBridge
} from "../profile/RuntimeProfileBridge";

import {
  PlayerProfileManager
} from "../profile/PlayerProfileManager";

import type {
  PlayerProfile
} from "../profile/PlayerProfile";

import type {
  PersistenceRepository
} from "../profile/PersistenceRepository";

import {
  createDefaultPlayerSaveData
} from "../save/PlayerSaveData";

import {
  DEFAULT_ECONOMY_STATE
} from "../economy/EconomyTypes";

import {
  getStarterCar,
  type CarId
} from "../garage/CarData";

import type {
  GarageState
} from "../garage/GarageManager";

import type {
  UpgradeState,
  CarUpgradeLevels
} from "../garage/UpgradeSystem";

// ============================================================
// Assertions
// ============================================================

function assert(
  condition: boolean,
  message: string
): void {

  if (!condition) {

    throw new Error(
      "[M11.4 QA] FAIL: " +
      message
    );
  }
}

// ============================================================
// In-memory Persistence Repository
// ============================================================

class MemoryPersistenceRepository
  implements PersistenceRepository {

  private profile:
    PlayerProfile | null = null;

  public save(
    profile: PlayerProfile
  ): boolean {

    this.profile = {

      ...profile,

      saveData: {

        ...profile.saveData,

        economy: {

          ...profile.saveData.economy,

          wallet: {

            ...profile.saveData.economy.wallet
          },

          transactions: [

            ...profile.saveData.economy.transactions
          ]
        },

        garage: {

          ...profile.saveData.garage,

          ownedCars: [

            ...profile.saveData.garage.ownedCars
          ]
        },

        upgrades: {

          ...profile.saveData.upgrades,

          upgrades: {

            ...profile.saveData.upgrades.upgrades
          }
        }
      }
    };

    return true;
  }

  public load():
    PlayerProfile | null {

    if (!this.profile) {

      return null;
    }

    return {

      ...this.profile,

      saveData: {

        ...this.profile.saveData,

        economy: {

          ...this.profile.saveData.economy,

          wallet: {

            ...this.profile.saveData.economy.wallet
          },

          transactions: [

            ...this.profile.saveData.economy.transactions
          ]
        },

        garage: {

          ...this.profile.saveData.garage,

          ownedCars: [

            ...this.profile.saveData.garage.ownedCars
          ]
        },

        upgrades: {

          ...this.profile.saveData.upgrades,

          upgrades: {

            ...this.profile.saveData.upgrades.upgrades
          }
        }
      }
    };
  }

  public hasProfile(): boolean {

    return this.profile !== null;
  }

  public deleteProfile(): boolean {

    this.profile = null;

    return true;
  }
}

// ============================================================
// Test Save Data
// ============================================================

function createTestSaveData() {

  const starterCar =
    getStarterCar();

  const garage:
    GarageState = {

    ownedCars: [

      starterCar.id
    ],

    selectedCar:
      starterCar.id
  };

  const zeroUpgrade:
  CarUpgradeLevels = {

  speed: 0,

  acceleration: 0,

  handling: 0
};

const upgrades:
  UpgradeState = {

  upgrades: {

    starter: {
      ...zeroUpgrade
    },

    sport: {
      ...zeroUpgrade
    },

    muscle: {
      ...zeroUpgrade
    },

    super: {
      ...zeroUpgrade
    },

    hyper: {
      ...zeroUpgrade
    }
  }
};

  const saveData =
    createDefaultPlayerSaveData(

      {
        ...DEFAULT_ECONOMY_STATE,

        wallet: {

          coin: 1350,

          pi: 0
        }
      },

      garage,

      upgrades
    );

  return {

    saveData,

    starterCarId:
      starterCar.id
  };
}

// ============================================================
// M11.4 QA
// ============================================================

export function
  runM11_4_AuthenticationProfileBridgeQA():
  void {

  console.log(
    "[M11.4 QA] START"
  );

  // ----------------------------------------------------------
  // Test infrastructure
  // ----------------------------------------------------------

  const repository =
    new MemoryPersistenceRepository();

  const profileManager =
    new PlayerProfileManager(
      repository
    );

  const runtimeBridge =
    new RuntimeProfileBridge(
      profileManager
    );

  const authProfileBridge =
    new AuthenticationProfileBridge(
      runtimeBridge
    );

  const {

    saveData,

    starterCarId

  } = createTestSaveData();

  // ----------------------------------------------------------
  // 1. Create local profile
  // ----------------------------------------------------------

  const localProfile =
    runtimeBridge.initialize(

      "racenova-local-player",

      saveData,

      "Local Player"
    );

  assert(

    localProfile !== null,

    "Local profile creation failed"
  );

  assert(

    localProfile!.profileId ===
      "racenova-local-player",

    "Initial local profileId mismatch"
  );

  // ----------------------------------------------------------
  // Snapshot gameplay data
  // ----------------------------------------------------------

  const beforeCoins =
    localProfile!
      .saveData
      .economy
      .wallet
      .coin;

  const beforeSelectedCar =
    localProfile!
      .saveData
      .garage
      .selectedCar;

  const beforeRaceCount =
    localProfile!
      .saveData
      .progress
      .racesCompleted;

  const beforeWinCount =
    localProfile!
      .saveData
      .progress
      .racesWon;

  // ----------------------------------------------------------
  // 2. Bind authenticated identity
  // ----------------------------------------------------------

  const identity:
    AuthenticationIdentity = {

    subject:
      "google-subject-001",

    provider:
      AuthenticationProvider.GOOGLE,

    displayName:
      "RaceNova Player"
  };

  const boundProfile =
    authProfileBridge.bindIdentity(
      identity
    );

  assert(

    boundProfile !== null,

    "Authenticated identity binding failed"
  );

  assert(

    boundProfile!.profileId ===
      identity.subject,

    "Authenticated subject was not bound as profileId"
  );

  assert(

    boundProfile!.displayName ===
      identity.displayName,

    "Authenticated displayName was not synchronized"
  );

  // ----------------------------------------------------------
  // 3. PlayerSaveData preservation
  // ----------------------------------------------------------

  assert(

    boundProfile!
      .saveData
      .economy
      .wallet
      .coin ===
      beforeCoins,

    "Economy coin balance changed during auth binding"
  );

  assert(

    boundProfile!
      .saveData
      .garage
      .selectedCar ===
      beforeSelectedCar,

    "Selected car changed during auth binding"
  );

  assert(

    boundProfile!
      .saveData
      .progress
      .racesCompleted ===
      beforeRaceCount,

    "Race completion progress changed during auth binding"
  );

  assert(

    boundProfile!
      .saveData
      .progress
      .racesWon ===
      beforeWinCount,

    "Race win progress changed during auth binding"
  );

  assert(

    boundProfile!
      .saveData
      .garage
      .selectedCar ===
      starterCarId,

    "Starter car selection was not preserved"
  );

  // ----------------------------------------------------------
  // 4. Clear runtime only
  // ----------------------------------------------------------

  runtimeBridge.clear();

  assert(

    !runtimeBridge.hasProfile(),

    "Runtime profile was not cleared"
  );

  assert(

    repository.hasProfile(),

    "Persisted profile disappeared after runtime clear"
  );

  // ----------------------------------------------------------
  // 5. Reload persisted authenticated profile
  // ----------------------------------------------------------

  const reloadedProfile =
    runtimeBridge.initialize(

      "ignored-local-id",

      saveData,

      "Ignored Local Name"
    );

  assert(

    reloadedProfile !== null,

    "Persisted profile reload failed"
  );

  assert(

    reloadedProfile!.profileId ===
      identity.subject,

    "Persisted authenticated profileId was not restored"
  );

  assert(

    reloadedProfile!.displayName ===
      identity.displayName,

    "Persisted authenticated displayName was not restored"
  );

  assert(

    reloadedProfile!
      .saveData
      .economy
      .wallet
      .coin ===
      beforeCoins,

    "Persisted coin balance changed after reload"
  );

  assert(

    reloadedProfile!
      .saveData
      .garage
      .selectedCar ===
      beforeSelectedCar,

    "Persisted selected car changed after reload"
  );

  // ----------------------------------------------------------
  // 6. Different identity must be rejected
  // ----------------------------------------------------------

  const secondIdentity:
    AuthenticationIdentity = {

    subject:
      "google-subject-002",

    provider:
      AuthenticationProvider.GOOGLE,

    displayName:
      "Another Player"
  };

  const rejected =
    authProfileBridge.bindIdentity(
      secondIdentity
    );

  assert(

    rejected === null,

    "Different authenticated identity was incorrectly accepted"
  );

  const finalProfile =
    runtimeBridge.getCurrentProfile();

  assert(

    finalProfile !== null,

    "Current profile disappeared after rejected identity"
  );

  assert(

    finalProfile!.profileId ===
      identity.subject,

    "Original authenticated identity was replaced"
  );

  assert(

    finalProfile!.displayName ===
      identity.displayName,

    "Original display name was replaced"
  );

  // ----------------------------------------------------------
  // PASS
  // ----------------------------------------------------------

  console.log(
    "[M11.4 QA] PASS"
  );
  }
