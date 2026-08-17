/**
 * ============================================================
 * RaceNova V2
 * Garage Manager
 * M4.5
 * ============================================================
 *
 * Responsibilities:
 * - Track owned cars
 * - Unlock cars using internal Coins
 * - Select active car
 * - Expose car definitions
 * - Provide serializable garage state
 *
 * IMPORTANT:
 * - No UI logic
 * - No save/load storage logic
 * - No Three.js dependency
 * - No upgrade logic
 * - No Pi payment logic
 *
 * Persistence will be handled later by
 * PlayerSaveData / Save System.
 * ============================================================
 */

import { EconomyManager } from "./EconomyManager";

import {
  CAR_DATA,
  getCarDefinition,
  getStarterCar,
  type CarId,
  type CarDefinition
} from "./CarData";

// ============================================================
// Garage State
// ============================================================

export interface GarageState {
  ownedCars: CarId[];

  selectedCar: CarId;
}

// ============================================================
// Garage Manager
// ============================================================

export class GarageManager {
  private readonly economy: EconomyManager;

  private readonly ownedCars =
    new Set<CarId>();

  private selectedCar: CarId;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    economy: EconomyManager
  ) {
    this.economy = economy;

    const starterCar =
      getStarterCar();

    this.ownedCars.add(
      starterCar.id as CarId
    );

    this.selectedCar =
      starterCar.id as CarId;
  }

  // ==========================================================
  // Ownership
  // ==========================================================

  public ownsCar(
    carId: CarId
  ): boolean {
    return this.ownedCars.has(
      carId
    );
  }

  public getOwnedCars():
    readonly CarId[] {
    return Array.from(
      this.ownedCars
    );
  }

  // ==========================================================
  // Car Unlock
  // ==========================================================

  public unlockCar(
    carId: CarId
  ): boolean {
    const car =
      getCarDefinition(
        carId
      );

    // Invalid car
    if (!car) {
      return false;
    }

    // Already owned
    if (
      this.ownsCar(
        carId
      )
    ) {
      return true;
    }

    // Free car
    if (
      car.unlockCost <= 0
    ) {
      this.ownedCars.add(
        carId
      );

      return true;
    }

    /*
     * Garage car unlock is treated
     * as a normal economy purchase.
     *
     * EconomyTransactionType supports:
     * reward | purchase | upgrade |
     * refund | bonus | admin
     *
     * Therefore "purchase" is used here.
     */
    const success =
      this.economy.spendCoins(
        car.unlockCost,
        `Unlock ${car.name}`,
        "purchase"
      );

    if (!success) {
      return false;
    }

    this.ownedCars.add(
      carId
    );

    return true;
  }

  // ==========================================================
  // Can Unlock
  // ==========================================================

  public canUnlockCar(
    carId: CarId
  ): boolean {
    const car =
      getCarDefinition(
        carId
      );

    if (!car) {
      return false;
    }

    if (
      this.ownsCar(
        carId
      )
    ) {
      return false;
    }

    if (
      car.unlockCost <= 0
    ) {
      return true;
    }

    return this.economy.canSpend(
      car.unlockCost
    );
  }

  // ==========================================================
  // Selection
  // ==========================================================

  public selectCar(
    carId: CarId
  ): boolean {
    if (
      !this.ownsCar(
        carId
      )
    ) {
      return false;
    }

    this.selectedCar =
      carId;

    return true;
  }

  // ==========================================================
  // Selected Car
  // ==========================================================

  public getSelectedCarId():
    CarId {
    return this.selectedCar;
  }

  public getSelectedCar():
    CarDefinition {
    const car =
      getCarDefinition(
        this.selectedCar
      );

    if (!car) {
      return getStarterCar();
    }

    return car;
  }

  // ==========================================================
  // All Cars
  // ==========================================================

  public getAllCars():
    readonly CarDefinition[] {
    return CAR_DATA;
  }

  // ==========================================================
  // Save State
  // ==========================================================

  public getState():
    GarageState {
    return {
      ownedCars:
        this.getOwnedCars().slice(),

      selectedCar:
        this.selectedCar
    };
  }

  // ==========================================================
  // Load State
  // ==========================================================

  public loadState(
    state: GarageState
  ): boolean {
    if (
      !state ||
      !Array.isArray(
        state.ownedCars
      )
    ) {
      return false;
    }

    this.ownedCars.clear();

    // --------------------------------------------------------
    // Restore owned cars
    // --------------------------------------------------------

    for (
      const carId
      of state.ownedCars
    ) {
      const car =
        getCarDefinition(
          carId
        );

      if (car) {
        this.ownedCars.add(
          car.id as CarId
        );
      }
    }

    // --------------------------------------------------------
    // Guarantee starter car
    // --------------------------------------------------------

    if (
      this.ownedCars.size === 0
    ) {
      const starter =
        getStarterCar();

      this.ownedCars.add(
        starter.id as CarId
      );
    }

    // --------------------------------------------------------
    // Restore selected car
    // --------------------------------------------------------

    if (
      getCarDefinition(
        state.selectedCar
      ) &&
      this.ownedCars.has(
        state.selectedCar
      )
    ) {
      this.selectedCar =
        state.selectedCar;
    } else {
      const firstOwnedCar =
        this.ownedCars.values().next()
          .value;

      if (firstOwnedCar) {
        this.selectedCar =
          firstOwnedCar;
      } else {
        const starter =
          getStarterCar();

        this.ownedCars.add(
          starter.id as CarId
        );

        this.selectedCar =
          starter.id as CarId;
      }
    }

    return true;
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {
    this.ownedCars.clear();

    const starter =
      getStarterCar();

    this.ownedCars.add(
      starter.id as CarId
    );

    this.selectedCar =
      starter.id as CarId;
  }
}
