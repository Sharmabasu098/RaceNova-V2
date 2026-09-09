/**
 * ============================================================
 * RaceNova V2
 * Race Result UI
 * M8.3
 * ============================================================
 *
 * Responsibilities:
 * - Display race result
 * - WIN / LOSE / CRASH / FAIL
 * - Display position
 * - Display race time
 * - Display distance
 * - Display reward
 * - Display Boss result
 * - NEXT RACE callback
 * - MAIN MENU callback
 * - Mobile responsive UI
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No gameplay dependency
 * - No SaveSystem dependency
 * - Engine connection will be added later
 * ============================================================
 */

import {
  RaceResultData,
} from "../race/RaceResult";

export interface RaceResultUIConfig {

  onNextRace: () => void;

  onMainMenu: () => void;
}

export class RaceResultUI {

  private readonly root:
    HTMLDivElement;

  private readonly resultTitle:
    HTMLDivElement;

  private readonly resultSubtitle:
    HTMLDivElement;

  private readonly positionValue:
    HTMLDivElement;

  private readonly timeValue:
    HTMLDivElement;

  private readonly distanceValue:
    HTMLDivElement;

  private readonly rewardValue:
    HTMLDivElement;

  private readonly bossValue:
    HTMLDivElement;

  private readonly nextRaceButton:
    HTMLButtonElement;

  private readonly mainMenuButton:
    HTMLButtonElement;

  private readonly onNextRace:
    () => void;

  private readonly onMainMenu:
    () => void;

  private visible =
    false;

  public constructor(
    container: HTMLElement,
    config: RaceResultUIConfig
  ) {

    this.onNextRace =
      config.onNextRace;

    this.onMainMenu =
      config.onMainMenu;

    this.root =
      document.createElement(
        "div"
      );

    this.root.className =
      "racenova-race-result";

    this.root.innerHTML = `

      <div
        class="racenova-result-background"
      ></div>

      <div
        class="racenova-result-content"
      >

        <div
          class="racenova-result-kicker"
        >
          RACE RESULT
        </div>

        <div
          class="racenova-result-title"
        >
          RACE COMPLETE
        </div>

        <div
          class="racenova-result-subtitle"
        >
          GREAT RUN
        </div>

        <div
          class="racenova-result-card"
        >

          <div
            class="racenova-result-row"
          >
            <span>
              POSITION
            </span>

            <strong
              class="racenova-result-position"
            >
              -
            </strong>
          </div>

          <div
            class="racenova-result-divider"
          ></div>

          <div
            class="racenova-result-row"
          >
            <span>
              TIME
            </span>

            <strong
              class="racenova-result-time"
            >
              00:00
            </strong>
          </div>

          <div
            class="racenova-result-row"
          >
            <span>
              DISTANCE
            </span>

            <strong
              class="racenova-result-distance"
            >
              0 m
            </strong>
          </div>

          <div
            class="racenova-result-row"
          >
            <span>
              REWARD
            </span>

            <strong
              class="racenova-result-reward"
            >
              +0 COINS
            </strong>
          </div>

          <div
            class="racenova-result-row racenova-result-boss-row"
          >
            <span>
              BOSS
            </span>

            <strong
              class="racenova-result-boss"
            >
              -
            </strong>
          </div>

        </div>

        <div
          class="racenova-result-actions"
        >

          <button
            type="button"
            class="racenova-result-next"
          >
            NEXT RACE
          </button>

          <button
            type="button"
            class="racenova-result-menu"
          >
            MAIN MENU
          </button>

        </div>

      </div>
    `;

    container.appendChild(
      this.root
    );

    const resultTitle =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-result-title"
      );

    const resultSubtitle =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-result-subtitle"
      );

    const positionValue =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-result-position"
      );

    const timeValue =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-result-time"
      );

    const distanceValue =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-result-distance"
      );

    const rewardValue =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-result-reward"
      );

    const bossValue =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-result-boss"
      );

    const nextRaceButton =
      this.root.querySelector<HTMLButtonElement>(
        ".racenova-result-next"
      );

    const mainMenuButton =
      this.root.querySelector<HTMLButtonElement>(
        ".racenova-result-menu"
      );

    if (!resultTitle) {
      throw new Error(
        "RaceNova: Result title not found."
      );
    }

    if (!resultSubtitle) {
      throw new Error(
        "RaceNova: Result subtitle not found."
      );
    }

    if (!positionValue) {
      throw new Error(
        "RaceNova: Result position not found."
      );
    }

    if (!timeValue) {
      throw new Error(
        "RaceNova: Result time not found."
      );
    }

    if (!distanceValue) {
      throw new Error(
        "RaceNova: Result distance not found."
      );
    }

    if (!rewardValue) {
      throw new Error(
        "RaceNova: Result reward not found."
      );
    }

    if (!bossValue) {
      throw new Error(
        "RaceNova: Result Boss value not found."
      );
    }

    if (!nextRaceButton) {
      throw new Error(
        "RaceNova: NEXT RACE button not found."
      );
    }

    if (!mainMenuButton) {
      throw new Error(
        "RaceNova: MAIN MENU button not found."
      );
    }

    this.resultTitle =
      resultTitle;

    this.resultSubtitle =
      resultSubtitle;

    this.positionValue =
      positionValue;

    this.timeValue =
      timeValue;

    this.distanceValue =
      distanceValue;

    this.rewardValue =
      rewardValue;

    this.bossValue =
      bossValue;

    this.nextRaceButton =
      nextRaceButton;

    this.mainMenuButton =
      mainMenuButton;

    this.injectStyles();

    this.nextRaceButton.addEventListener(
      "click",
      this.handleNextRace
    );

    this.mainMenuButton.addEventListener(
      "click",
      this.handleMainMenu
    );

    this.hide();
  }

  // =========================================================
  // SHOW RESULT
  // =========================================================

  public show(
    result: RaceResultData
  ): void {

    this.applyResult(
      result
    );

    this.visible =
      true;

    this.root.classList.remove(
      "is-hidden"
    );

    this.root.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  // =========================================================
  // APPLY RESULT
  // =========================================================

  private applyResult(
    result: RaceResultData
  ): void {

    const resultType =
      result.result;

    this.root.classList.remove(
      "result-win",
      "result-lose",
      "result-crash",
      "result-fail"
    );

    this.root.classList.add(
      `result-${resultType.toLowerCase()}`
    );

    switch (
      resultType
    ) {

      case "WIN":

        this.resultTitle.textContent =
          "RACE WON";

        this.resultSubtitle.textContent =
          "VICTORY";

        break;

      case "LOSE":

        this.resultTitle.textContent =
          "RACE LOST";

        this.resultSubtitle.textContent =
          "BETTER LUCK NEXT TIME";

        break;

      case "CRASH":

        this.resultTitle.textContent =
          "CRASH";

        this.resultSubtitle.textContent =
          "RACE FAILED";

        break;

      case "FAIL":

      default:

        this.resultTitle.textContent =
          "RACE FAILED";

        this.resultSubtitle.textContent =
          "TRY AGAIN";

        break;
    }

    if (
      result.position > 0
    ) {

      this.positionValue.textContent =
        `P${result.position}`;

    } else {

      this.positionValue.textContent =
        "-";
    }

    this.timeValue.textContent =
      this.formatTime(
        result.time
      );

    this.distanceValue.textContent =
      `${Math.round(
        Math.max(
          0,
          result.distance
        )
      )} m`;

    this.rewardValue.textContent =
      `+${Math.round(
        Math.max(
          0,
          result.reward
        )
      )} COINS`;

    if (
      result.isBossRace
    ) {

      this.bossValue.textContent =
        result.bossDefeated
          ? "DEFEATED"
          : "NOT DEFEATED";

      this.root.classList.add(
        "is-boss-result"
      );

    } else {

      this.bossValue.textContent =
        "N/A";

      this.root.classList.remove(
        "is-boss-result"
      );
    }

    this.nextRaceButton.disabled =
      result.nextRaceId === null;

    this.nextRaceButton.style.display =
      result.nextRaceId === null
        ? "none"
        : "";

    this.mainMenuButton.style.display =
      "";
  }

  // =========================================================
  // FORMAT TIME
  // =========================================================

  private formatTime(
    seconds: number
  ): string {

    if (
      !Number.isFinite(
        seconds
      ) ||
      seconds < 0
    ) {

      return "00:00";
    }

    const safeSeconds =
      Math.floor(
        seconds
      );

    const minutes =
      Math.floor(
        safeSeconds / 60
      );

    const remainingSeconds =
      safeSeconds % 60;

    return (
      `${minutes
        .toString()
        .padStart(2, "0")}:` +
      `${remainingSeconds
        .toString()
        .padStart(2, "0")}`
    );
  }

  // =========================================================
  // NEXT RACE
  // =========================================================

  private readonly handleNextRace =
    (): void => {

      if (
        !this.visible
      ) {
        return;
      }

      this.hide();

      this.onNextRace();
    };

  // =========================================================
  // MAIN MENU
  // =========================================================

  private readonly handleMainMenu =
    (): void => {

      if (
        !this.visible
      ) {
        return;
      }

      this.hide();

      this.onMainMenu();
    };

  // =========================================================
  // HIDE
  // =========================================================

  public hide():
    void {

    this.visible =
      false;

    this.root.classList.add(
      "is-hidden"
    );

    this.root.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  // =========================================================
  // VISIBILITY
  // =========================================================

  public isVisible():
    boolean {

    return this.visible;
  }

  // =========================================================
  // DISPOSE
  // =========================================================

  public dispose():
    void {

    this.nextRaceButton.removeEventListener(
      "click",
      this.handleNextRace
    );

    this.mainMenuButton.removeEventListener(
      "click",
      this.handleMainMenu
    );

    this.root.remove();
  }

  // =========================================================
  // STYLES
  // =========================================================

  private injectStyles():
    void {

    const styleId =
      "racenova-race-result-styles";

    if (
      document.getElementById(
        styleId
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      styleId;

    style.textContent = `

      .racenova-race-result {

        position: fixed;

        inset: 0;

        z-index: 11000;

        display: flex;

        align-items: center;

        justify-content: center;

        box-sizing: border-box;

        padding: 24px;

        overflow: hidden;

        background:
          #070c18;

        color:
          #f4f7ff;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        opacity:
          1;

        visibility:
          visible;

        transition:
          opacity 180ms ease,
          visibility 180ms ease;

      }

      .racenova-race-result.is-hidden {

        opacity:
          0;

        visibility:
          hidden;

        pointer-events:
          none;

      }

      .racenova-result-background {

        position: absolute;

        inset: 0;

        background:
          radial-gradient(
            circle at center,
            rgba(
              40,
              80,
              140,
              0.22
            ),
            transparent 60%
          );

        pointer-events:
          none;

      }

      .racenova-result-content {

        position: relative;

        width:
          min(
            100%,
            440px
          );

        display:
          flex;

        flex-direction:
          column;

        align-items:
          center;

        gap:
          14px;

        z-index:
          1;

      }

      .racenova-result-kicker {

        font-size:
          12px;

        font-weight:
          700;

        letter-spacing:
          0.24em;

        opacity:
          0.72;

      }

      .racenova-result-title {

        font-size:
          clamp(
            38px,
            11vw,
            64px
          );

        line-height:
          1;

        font-weight:
          900;

        letter-spacing:
          0.04em;

        text-align:
          center;

      }

      .racenova-result-subtitle {

        font-size:
          13px;

        font-weight:
          700;

        letter-spacing:
          0.16em;

        opacity:
          0.78;

        text-align:
          center;

      }

      .racenova-result-card {

        width:
          100%;

        box-sizing:
          border-box;

        padding:
          18px 20px;

        margin-top:
          8px;

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.12
          );

        border-radius:
          18px;

        background:
          rgba(
            12,
            19,
            36,
            0.94
          );

        box-shadow:
          0 18px 50px
          rgba(
            0,
            0,
            0,
            0.35
          );

      }

      .racenova-result-row {

        min-height:
          38px;

        display:
          flex;

        align-items:
          center;

        justify-content:
          space-between;

        gap:
          16px;

      }

      .racenova-result-row span {

        font-size:
          12px;

        font-weight:
          700;

        letter-spacing:
          0.12em;

        opacity:
          0.68;

      }

      .racenova-result-row strong {

        font-size:
          16px;

        font-weight:
          800;

        letter-spacing:
          0.04em;

        text-align:
          right;

      }

      .racenova-result-position {

        font-size:
          28px !important;

      }

      .racenova-result-divider {

        height:
          1px;

        margin:
          4px 0;

        background:
          rgba(
            255,
            255,
            255,
            0.10
          );

      }

      .racenova-result-actions {

        width:
          100%;

        display:
          flex;

        flex-direction:
          column;

        gap:
          10px;

        margin-top:
          4px;

      }

      .racenova-result-actions button {

        width:
          100%;

        min-height:
          52px;

        border:
          0;

        border-radius:
          14px;

        padding:
          0 18px;

        font-family:
          inherit;

        font-size:
          14px;

        font-weight:
          800;

        letter-spacing:
          0.08em;

        cursor:
          pointer;

        touch-action:
          manipulation;

        -webkit-tap-highlight-color:
          transparent;

      }

      .racenova-result-next {

        background:
          #f4f7ff;

        color:
          #07101f;

      }

      .racenova-result-menu {

        background:
          rgba(
            255,
            255,
            255,
            0.08
          );

        color:
          #f4f7ff;

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.12
          ) !important;

      }

      .racenova-result-actions button:disabled {

        opacity:
          0.4;

        cursor:
          default;

      }

      .racenova-race-result.result-win
      .racenova-result-title {

        text-shadow:
          0 0 28px
          rgba(
            255,
            255,
            255,
            0.28
          );

      }

      .racenova-race-result.result-crash
      .racenova-result-title,
      .racenova-race-result.result-fail
      .racenova-result-title {

        letter-spacing:
          0.02em;

      }

      .racenova-race-result.is-boss-result
      .racenova-result-card {

        border-radius:
          18px;

      }

      @media (
        max-width: 480px
      ) {

        .racenova-race-result {

          padding:
            18px;

        }

        .racenova-result-card {

          padding:
            14px 16px;

        }

        .racenova-result-row {

          min-height:
            36px;

        }

        .racenova-result-actions button {

          min-height:
            50px;

        }

      }

      @media (
        max-height: 620px
      ) {

        .racenova-race-result {

          align-items:
            flex-start;

          overflow-y:
            auto;

          padding-top:
            18px;

          padding-bottom:
            18px;

        }

        .racenova-result-content {

          gap:
            8px;

        }

        .racenova-result-title {

          font-size:
            42px;

        }

        .racenova-result-card {

          margin-top:
            2px;

        }

      }

    `;

    document.head.appendChild(
      style
    );
  }
}
