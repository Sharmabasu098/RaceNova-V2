/**
 * ============================================================
 * RaceNova V2
 * Race Result Data
 * M8.3
 * ============================================================
 *
 * Pure race-result state/data layer.
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No DOM dependency
 * - No UI dependency
 * - No SaveSystem dependency
 * - Safe to use from RaceNovaEngine
 *
 * Responsibilities:
 * - Store race result type
 * - Store race completion information
 * - Store player position
 * - Store race time
 * - Store distance
 * - Store reward information
 * - Store Boss result information
 * - Store next race information
 * ============================================================
 */

/**
 * Final result type of a race.
 */
export type RaceResultType =
  | "WIN"
  | "LOSE"
  | "CRASH"
  | "FAIL";

/**
 * Race result data.
 */
export interface RaceResultData {
  /**
   * Completed race ID.
   */
  raceId: string;

  /**
   * Final result.
   */
  result: RaceResultType;

  /**
   * Player finishing position.
   *
   * 1 = first place.
   * 0 = unknown / not applicable.
   */
  position: number;

  /**
   * Final race time in seconds.
   */
  time: number;

  /**
   * Distance travelled during the race.
   */
  distance: number;

  /**
   * Coins/reward earned from this result.
   */
  reward: number;

  /**
   * Whether this was a Boss race.
   */
  isBossRace: boolean;

  /**
   * Whether the Boss was defeated.
   */
  bossDefeated: boolean;

  /**
   * Next race ID, if available.
   */
  nextRaceId: string | null;

  /**
   * Timestamp when the result was created.
   */
  timestamp: number;
}

/**
 * Safe default values.
 */
const DEFAULT_RACE_ID = "";

const DEFAULT_POSITION = 0;

const DEFAULT_TIME = 0;

const DEFAULT_DISTANCE = 0;

const DEFAULT_REWARD = 0;

/**
 * RaceResult
 *
 * Small, dependency-free container for the latest race result.
 */
export class RaceResult {
  private data: RaceResultData;

  public constructor() {
    this.data = this.createDefault();
  }

  /**
   * Create a safe empty result.
   */
  private createDefault(): RaceResultData {
    return {
      raceId: DEFAULT_RACE_ID,
      result: "FAIL",
      position: DEFAULT_POSITION,
      time: DEFAULT_TIME,
      distance: DEFAULT_DISTANCE,
      reward: DEFAULT_REWARD,
      isBossRace: false,
      bossDefeated: false,
      nextRaceId: null,
      timestamp: 0,
    };
  }

  /**
   * Set a new race result.
   */
  public set(data: Partial<RaceResultData>): void {
    this.data = {
      ...this.createDefault(),
      ...data,
      raceId:
        typeof data.raceId === "string"
          ? data.raceId
          : DEFAULT_RACE_ID,
      position:
        Number.isFinite(data.position)
          ? Math.max(0, Math.floor(data.position!))
          : DEFAULT_POSITION,
      time:
        Number.isFinite(data.time)
          ? Math.max(0, data.time!)
          : DEFAULT_TIME,
      distance:
        Number.isFinite(data.distance)
          ? Math.max(0, data.distance!)
          : DEFAULT_DISTANCE,
      reward:
        Number.isFinite(data.reward)
          ? Math.max(0, data.reward!)
          : DEFAULT_REWARD,
      isBossRace:
        data.isBossRace === true,
      bossDefeated:
        data.bossDefeated === true,
      nextRaceId:
        typeof data.nextRaceId === "string"
          ? data.nextRaceId
          : null,
      timestamp:
        Number.isFinite(data.timestamp)
          ? data.timestamp!
          : Date.now(),
    };
  }

  /**
   * Get a safe copy of the current result.
   */
  public get(): RaceResultData {
    return {
      ...this.data,
    };
  }

  /**
   * Check whether a valid race result exists.
   */
  public hasResult(): boolean {
    return (
      this.data.raceId.length > 0 &&
      this.data.timestamp > 0
    );
  }

  /**
   * Check whether the result is a win.
   */
  public isWin(): boolean {
    return this.data.result === "WIN";
  }

  /**
   * Check whether the result is a loss.
   */
  public isLose(): boolean {
    return this.data.result === "LOSE";
  }

  /**
   * Check whether the result is a crash.
   */
  public isCrash(): boolean {
    return this.data.result === "CRASH";
  }

  /**
   * Check whether the result is a failure.
   */
  public isFail(): boolean {
    return this.data.result === "FAIL";
  }

  /**
   * Clear the current result.
   */
  public reset(): void {
    this.data = this.createDefault();
  }
}
