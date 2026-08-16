/**
 * ============================================================
 * RaceNova V2
 * Coin Wallet
 * M4.2
 * ============================================================
 *
 * Responsible for the player's internal Coin balance.
 *
 * IMPORTANT:
 * - No UI logic
 * - No Pi payment logic
 * - No garage logic
 * - No upgrade logic
 * - No direct localStorage handling
 *
 * EconomyManager will use this wallet as the
 * authoritative Coin balance.
 * ============================================================
 */

import {
  DEFAULT_ECONOMY_LIMITS,
  type EconomyLimits
} from "./EconomyTypes";

export class CoinWallet {
  private balance: number;

  private readonly maxCoins: number;

  constructor(
    initialBalance = 0,
    limits: EconomyLimits =
      DEFAULT_ECONOMY_LIMITS
  ) {
    this.maxCoins = Math.max(
      0,
      Math.floor(
        limits.maxCoins
      )
    );

    this.balance =
      this.sanitizeAmount(
        initialBalance
      );
  }

  // =========================================================
  // Balance
  // =========================================================

  public getBalance(): number {
    return this.balance;
  }

  // =========================================================
  // Add Coins
  // =========================================================

  public addCoins(
    amount: number
  ): boolean {
    if (
      !this.isValidAmount(amount)
    ) {
      return false;
    }

    const safeAmount =
      Math.floor(amount);

    if (
      safeAmount <= 0
    ) {
      return false;
    }

    const newBalance =
      this.balance +
      safeAmount;

    if (
      newBalance >
      this.maxCoins
    ) {
      this.balance =
        this.maxCoins;

      return true;
    }

    this.balance =
      newBalance;

    return true;
  }

  // =========================================================
  // Spend Coins
  // =========================================================

  public spendCoins(
    amount: number
  ): boolean {
    if (
      !this.isValidAmount(amount)
    ) {
      return false;
    }

    const safeAmount =
      Math.floor(amount);

    if (
      safeAmount <= 0
    ) {
      return false;
    }

    if (
      safeAmount >
      this.balance
    ) {
      return false;
    }

    this.balance -=
      safeAmount;

    return true;
  }

  // =========================================================
  // Can Spend
  // =========================================================

  public canSpend(
    amount: number
  ): boolean {
    if (
      !this.isValidAmount(amount)
    ) {
      return false;
    }

    const safeAmount =
      Math.floor(amount);

    if (
      safeAmount <= 0
    ) {
      return false;
    }

    return (
      this.balance >=
      safeAmount
    );
  }

  // =========================================================
  // Set Balance
  // =========================================================

  /**
   * Used when loading a previously
   * saved player balance.
   *
   * This method is intentionally
   * controlled and sanitized.
   */
  public setBalance(
    amount: number
  ): void {
    this.balance =
      this.sanitizeAmount(
        amount
      );
  }

  // =========================================================
  // Reset
  // =========================================================

  public reset(): void {
    this.balance = 0;
  }

  // =========================================================
  // Maximum Balance
  // =========================================================

  public getMaxBalance(): number {
    return this.maxCoins;
  }

  // =========================================================
  // Balance Full
  // =========================================================

  public isFull(): boolean {
    return (
      this.balance >=
      this.maxCoins
    );
  }

  // =========================================================
  // Validation
  // =========================================================

  private isValidAmount(
    amount: number
  ): boolean {
    return (
      Number.isFinite(amount) &&
      amount > 0
    );
  }

  // =========================================================
  // Sanitization
  // =========================================================

  private sanitizeAmount(
    amount: number
  ): number {
    if (
      !Number.isFinite(amount)
    ) {
      return 0;
    }

    const safeAmount =
      Math.floor(
        Math.max(
          0,
          amount
        )
      );

    return Math.min(
      safeAmount,
      this.maxCoins
    );
  }
}
