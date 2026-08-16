/**
 * ============================================================
 * RaceNova V2
 * Economy Types
 * M4.1
 * ============================================================
 *
 * Defines the data structures used by the RaceNova economy.
 *
 * IMPORTANT:
 * - No UI logic
 * - No payment logic
 * - No Pi integration
 * - No gameplay logic
 *
 * This is the foundation for the internal coin economy.
 * ============================================================
 */

// ============================================================
// Currency
// ============================================================

export type CurrencyType =
  | "coin"
  | "pi";

// ============================================================
// Wallet Balance
// ============================================================

export interface WalletBalance {
  coin: number;

  /**
   * Pi balance is reserved for future
   * Pi economy/payment integration.
   *
   * M4 does NOT perform real Pi transactions.
   */
  pi: number;
}

// ============================================================
// Economy Transaction Type
// ============================================================

export type EconomyTransactionType =
  | "reward"
  | "purchase"
  | "upgrade"
  | "refund"
  | "bonus"
  | "admin";

// ============================================================
// Economy Transaction
// ============================================================

export interface EconomyTransaction {
  id: string;

  currency: CurrencyType;

  type: EconomyTransactionType;

  amount: number;

  balanceAfter: number;

  timestamp: number;

  /**
   * Optional human-readable reason.
   */
  reason?: string;
}

// ============================================================
// Economy State
// ============================================================

export interface EconomyState {
  wallet: WalletBalance;

  transactions: EconomyTransaction[];

  /**
   * Version allows future save-data migrations.
   */
  version: number;
}

// ============================================================
// Economy Limits
// ============================================================

export interface EconomyLimits {
  /**
   * Maximum allowed coin balance.
   */
  maxCoins: number;

  /**
   * Maximum allowed Pi balance.
   *
   * This is only a data-level safety limit.
   * It does NOT represent real Pi ownership.
   */
  maxPi: number;
}

// ============================================================
// Economy Events
// ============================================================

export type EconomyEventType =
  | "balance_changed"
  | "transaction_created"
  | "purchase_completed"
  | "purchase_failed"
  | "upgrade_completed"
  | "upgrade_failed";

// ============================================================
// Economy Event
// ============================================================

export interface EconomyEvent {
  type: EconomyEventType;

  currency?: CurrencyType;

  amount?: number;

  balance?: number;

  reason?: string;

  timestamp: number;
}

// ============================================================
// Default Economy State
// ============================================================

export const DEFAULT_ECONOMY_STATE:
  EconomyState = {
    wallet: {
      coin: 0,
      pi: 0
    },

    transactions: [],

    version: 1
  };

// ============================================================
// Default Economy Limits
// ============================================================

export const DEFAULT_ECONOMY_LIMITS:
  EconomyLimits = {
    maxCoins: 999999999,

    maxPi: 999999999
  };
