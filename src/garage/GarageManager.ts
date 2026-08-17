/**
 * ============================================================
 * RaceNova V2
 * Garage Manager
 * M4.5
 * ============================================================
 *
 * Responsibilities:
 * - Track owned cars
 * - Unlock cars
 * - Select active car
 * - Integrate with EconomyManager
 *
 * IMPORTANT:
 * - No UI logic
 * - No save/load persistence
 * - No Three.js dependency
 * - No upgrade logic
 * ============================================================
 */

import { EconomyManager } from "../economy/EconomyManager";

import {
  CAR_DATA,
  type CarId,
  type CarDefinition,
  getCarDefinition,
  getStarterCar
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

    const starter =
      getStarterCar();

    this.ownedCars.add(
      starter.id
    );

    this.selectedCar =
      starter.id;
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
  // Unlock Car
  // ==========================================================

  public unlockCar(
    carId: CarId
  ): boolean {
    const car =
      getCarDefinition(
        carId
      );

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

    // Starter car is always free
    if (
      car.unlockCost <= 0
    ) {
      this.ownedCars.add(
        carId
      );

      return true;
    }

    // Purchase using internal coins
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

    if (car) {
      return car;
    }

    return getStarterCar();
  }

  // ==========================================================
  // All Cars
  // ==========================================================

  public getAllCars():
    readonly CarDefinition[] {
    return CAR_DATA;
  }

  // ==========================================================
  // Garage State
  // ==========================================================

  public getState():
    GarageState {
    return {
      ownedCars:
        this.getOwnedCars(),

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

    // Restore valid owned cars
    for (
      const carId
      of state.ownedCars
    ) {
      if (
        getCarDefinition(
          carId
        )
      ) {
        this.ownedCars.add(
          carId
        );
      }
    }

    // Always guarantee a starter car
    if (
      this.ownedCars.size === 0
    ) {
      const starter =
        getStarterCar();

      this.ownedCars.add(
        starter.id
      );
    }

    // Restore selected car if owned
    if (
      this.ownedCars.has(
        state.selectedCar
      )
    ) {
      this.selectedCar =
        state.selectedCar;
    } else {
      this.selectedCar =
        Array.from(
          this.ownedCars
        )[0];
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
      starter.id
    );

    this.selectedCar =
      starter.id;
  }
}
