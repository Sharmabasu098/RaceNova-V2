/**
 * ============================================================
 * RaceNova V2
 * Economy Manager
 * M4.3
 * ============================================================
 *
 * Central controller for RaceNova's internal economy.
 *
 * Responsibilities:
 * - Coin balance management
 * - Rewards
 * - Coin spending
 * - Transaction history
 * - Economy events
 * - Safe validation
 *
 * IMPORTANT:
 * - No UI logic
 * - No localStorage logic
 * - No Pi payment/network calls
 * - No garage logic
 * - No upgrade logic
 *
 * Persistence will be connected later through
 * PlayerSaveData / Save system.
 * ============================================================
 */

import {
  CoinWallet
} from "./CoinWallet";

import {
  DEFAULT_ECONOMY_LIMITS,
  type EconomyEvent,
  type EconomyEventType,
  type EconomyLimits,
  type EconomyState,
  type EconomyTransaction,
  type EconomyTransactionType
} from "./EconomyTypes";

// ============================================================
// Configuration
// ============================================================

export interface EconomyManagerConfig {
  initialCoins?: number;

  limits?: EconomyLimits;

  /**
   * Maximum number of transactions
   * retained in memory.
   */
  maxTransactionHistory?: number;
}

// ============================================================
// Economy Manager
// ============================================================

export class EconomyManager {
  private readonly wallet: CoinWallet;

  private readonly maxTransactionHistory: number;

  private readonly transactions:
    EconomyTransaction[] = [];

  private readonly eventListeners:
    Array<
      (
        event: EconomyEvent
      ) => void
    > = [];

  private transactionCounter = 0;

  private readonly version = 1;

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    config: EconomyManagerConfig = {}
  ) {
    const limits =
      config.limits ??
      DEFAULT_ECONOMY_LIMITS;

    this.wallet =
      new CoinWallet(
        config.initialCoins ?? 0,
        limits
      );

    this.maxTransactionHistory =
      Math.max(
        1,
        Math.floor(
          config.maxTransactionHistory ??
            100
        )
      );
  }

  // ==========================================================
  // Balance
  // ==========================================================

  public getCoins(): number {
    return this.wallet.getBalance();
  }

  public getMaxCoins(): number {
    return this.wallet.getMaxBalance();
  }

  public isWalletFull(): boolean {
    return this.wallet.isFull();
  }

  // ==========================================================
  // Add Coins
  // ==========================================================

  public addCoins(
    amount: number,
    reason = "Reward",
    type:
      EconomyTransactionType =
      "reward"
  ): boolean {
    if (
      !this.isValidAmount(amount)
    ) {
      return false;
    }

    const previousBalance =
      this.wallet.getBalance();

    const success =
      this.wallet.addCoins(
        amount
      );

    if (!success) {
      return false;
    }

    const newBalance =
      this.wallet.getBalance();

    const actualAdded =
      newBalance -
      previousBalance;

    if (
      actualAdded <= 0
    ) {
      return false;
    }

    this.createTransaction(
      "coin",
      type,
      actualAdded,
      newBalance,
      reason
    );

    this.emitEvent({
      type:
        "balance_changed",
      currency:
        "coin",
      amount:
        actualAdded,
      balance:
        newBalance,
      reason,
      timestamp:
        Date.now()
    });

    return true;
  }

  // ==========================================================
  // Spend Coins
  // ==========================================================

  public spendCoins(
    amount: number,
    reason = "Purchase",
    type:
      EconomyTransactionType =
      "purchase"
  ): boolean {
    if (
      !this.isValidAmount(amount)
    ) {
      return false;
    }

    if (
      !this.wallet.canSpend(
        amount
      )
    ) {
      this.emitEvent({
        type:
          "purchase_failed",
        currency:
          "coin",
        amount,
        balance:
          this.wallet.getBalance(),
        reason,
        timestamp:
          Date.now()
      });

      return false;
    }

    const success =
      this.wallet.spendCoins(
        amount
      );

    if (!success) {
      this.emitEvent({
        type:
          "purchase_failed",
        currency:
          "coin",
        amount,
        balance:
          this.wallet.getBalance(),
        reason,
        timestamp:
          Date.now()
      });

      return false;
    }

    const newBalance =
      this.wallet.getBalance();

    this.createTransaction(
      "coin",
      type,
      -Math.floor(amount),
      newBalance,
      reason
    );

    this.emitEvent({
      type:
        "balance_changed",
      currency:
        "coin",
      amount:
        -Math.floor(amount),
      balance:
        newBalance,
      reason,
      timestamp:
        Date.now()
    });

    this.emitEvent({
      type:
        "purchase_completed",
      currency:
        "coin",
      amount:
        Math.floor(amount),
      balance:
        newBalance,
      reason,
      timestamp:
        Date.now()
    });

    return true;
  }

  // ==========================================================
  // Can Spend
  // ==========================================================

  public canSpend(
    amount: number
  ): boolean {
    return this.wallet.canSpend(
      amount
    );
  }

  // ==========================================================
  // Reward
  // ==========================================================

  public rewardCoins(
    amount: number,
    reason = "Race Reward"
  ): boolean {
    return this.addCoins(
      amount,
      reason,
      "reward"
    );
  }

  // ==========================================================
  // Bonus
  // ==========================================================

  public grantBonus(
    amount: number,
    reason = "Bonus"
  ): boolean {
    return this.addCoins(
      amount,
      reason,
      "bonus"
    );
  }

  // ==========================================================
  // Refund
  // ==========================================================

  public refundCoins(
    amount: number,
    reason = "Refund"
  ): boolean {
    return this.addCoins(
      amount,
      reason,
      "refund"
    );
  }

  // ==========================================================
  // Upgrade Payment
  // ==========================================================

  public payForUpgrade(
    amount: number,
    reason = "Car Upgrade"
  ): boolean {
    const success =
      this.spendCoins(
        amount,
        reason,
        "upgrade"
      );

    if (!success) {
      this.emitEvent({
        type:
          "upgrade_failed",
        currency:
          "coin",
        amount,
        balance:
          this.wallet.getBalance(),
        reason,
        timestamp:
          Date.now()
      });

      return false;
    }

    this.emitEvent({
      type:
        "upgrade_completed",
      currency:
        "coin",
      amount,
      balance:
        this.wallet.getBalance(),
      reason,
      timestamp:
        Date.now()
    });

    return true;
  }

  // ==========================================================
  // Transaction History
  // ==========================================================

  public getTransactions():
    readonly EconomyTransaction[] {
    return [
      ...this.transactions
    ];
  }

  public getRecentTransactions(
    limit = 10
  ): readonly EconomyTransaction[] {
    const safeLimit =
      Math.max(
        1,
        Math.floor(limit)
      );

    return this.transactions
      .slice(
        -safeLimit
      )
      .reverse();
  }

  // ==========================================================
  // Economy State
  // ==========================================================

  public getState():
    EconomyState {
    return {
      wallet: {
        coin:
          this.wallet.getBalance(),

        /**
         * Pi remains zero in M4.
         *
         * Real Pi integration belongs
         * to the future Pi economy layer.
         */
        pi: 0
      },

      transactions:
        this.transactions.map(
          (
            transaction
          ) => ({
            ...transaction
          })
        ),

      version:
        this.version
    };
  }

  // ==========================================================
  // Load State
  // ==========================================================

  /**
   * Loads internal economy state.
   *
   * This method is intentionally kept
   * independent from localStorage.
   *
   * PlayerSaveData will provide the
   * persistent data later.
   */
  public loadState(
    state: EconomyState
  ): boolean {
    if (
      !state ||
      !state.wallet
    ) {
      return false;
    }

    const coinBalance =
      state.wallet.coin;

    if (
      !Number.isFinite(
        coinBalance
      ) ||
      coinBalance < 0
    ) {
      return false;
    }

    this.wallet.setBalance(
      coinBalance
    );

    this.transactions.length =
      0;

    if (
      Array.isArray(
        state.transactions
      )
    ) {
      for (
        const transaction
        of state.transactions
      ) {
        if (
          !transaction ||
          transaction.currency !==
            "coin"
        ) {
          continue;
        }

        if (
          !Number.isFinite(
            transaction.amount
          )
        ) {
          continue;
        }

        this.transactions.push({
          ...transaction
        });
      }
    }

    while (
      this.transactions.length >
      this.maxTransactionHistory
    ) {
      this.transactions.shift();
    }

    return true;
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {
    this.wallet.reset();

    this.transactions.length =
      0;

    this.transactionCounter =
      0;

    this.emitEvent({
      type:
        "balance_changed",
      currency:
        "coin",
      amount: 0,
      balance: 0,
      reason:
        "Economy Reset",
      timestamp:
        Date.now()
    });
  }

  // ==========================================================
  // Events
  // ==========================================================

  public onEvent(
    listener: (
      event: EconomyEvent
    ) => void
  ): () => void {
    if (
      typeof listener !==
      "function"
    ) {
      return () => undefined;
    }

    this.eventListeners.push(
      listener
    );

    return () => {
      const index =
        this.eventListeners.indexOf(
          listener
        );

      if (
        index >= 0
      ) {
        this.eventListeners.splice(
          index,
          1
        );
      }
    };
  }

  // ==========================================================
  // Internal Event Emitter
  // ==========================================================

  private emitEvent(
    event: EconomyEvent
  ): void {
    for (
      const listener
      of this.eventListeners
    ) {
      try {
        listener(
          event
        );
      } catch {
        /*
         * An external listener must never
         * break the economy system.
         */
      }
    }
  }

  // ==========================================================
  // Transaction Creation
  // ==========================================================

  private createTransaction(
    currency:
      "coin",
    type:
      EconomyTransactionType,
    amount: number,
    balanceAfter: number,
    reason: string
  ): void {
    this.transactionCounter +=
      1;

    const transaction:
      EconomyTransaction = {
      id:
        `coin-${Date.now()}-${this.transactionCounter}`,

      currency,

      type,

      amount,

      balanceAfter,

      timestamp:
        Date.now(),

      reason
    };

    this.transactions.push(
      transaction
    );

    while (
      this.transactions.length >
      this.maxTransactionHistory
    ) {
      this.transactions.shift();
    }

    this.emitEvent({
      type:
        "transaction_created",
      currency,
      amount,
      balance:
        balanceAfter,
      reason,
      timestamp:
        transaction.timestamp
    });
  }

  // ==========================================================
  // Validation
  // ==========================================================

  private isValidAmount(
    amount: number
  ): boolean {
    return (
      Number.isFinite(
        amount
      ) &&
      amount > 0
    );
  }

  // ==========================================================
  // Dispose
  // ==========================================================

  public dispose(): void {
    this.eventListeners.length =
      0;

    this.transactions.length =
      0;
  }
}
