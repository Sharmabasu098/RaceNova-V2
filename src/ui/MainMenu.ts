/**
 * ============================================================
 * RaceNova V2
 * Main Menu
 * M7.9.8
 * ============================================================
 *
 * Main start screen.
 *
 * Responsibilities:
 * - RaceNova title
 * - Next Race card
 * - START RACE button
 * - CAMPAIGN button
 * - GARAGE button
 * - Mobile responsive UI
 * - Start race callback
 * - Campaign callback
 * - Garage callback
 * - Safe start-state reset for race restart
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No gameplay dependency
 * ============================================================
 */

export interface MainMenuConfig {
  onStartRace: () => void;
  onCampaign: () => void;
  onGarage: () => void;
}

export class MainMenu {

  private readonly root:
    HTMLDivElement;

  private readonly startButton:
    HTMLButtonElement;

  private readonly campaignButton:
    HTMLButtonElement;

  private readonly garageButton:
    HTMLButtonElement;

  private readonly onStartRace:
    () => void;

  private readonly onCampaign:
    () => void;

  private readonly onGarage:
    () => void;

  private started =
    false;

  constructor(
    container: HTMLElement,
    config: MainMenuConfig
  ) {

    this.onStartRace =
      config.onStartRace;

    this.onCampaign =
      config.onCampaign;

    this.onGarage =
      config.onGarage;

    this.root =
      document.createElement(
        "div"
      );

    this.root.className =
      "racenova-main-menu";

    this.root.innerHTML = `

      <div
        class="racenova-menu-background"
      ></div>

      <div
        class="racenova-menu-content"
      >

        <div
          class="racenova-kicker"
        >
          ARCADE RACING
        </div>

        <div
          class="racenova-logo"
        >
          <span
            class="racenova-logo-light"
          >
            RACE
          </span>

          <span
            class="racenova-logo-red"
          >
            NOVA
          </span>
        </div>

        <div
          class="racenova-tagline"
        >
          Swipe to switch lanes,
          burn nitro and carve drifts
          <br />
          through the neon highway.
        </div>

        <div
          class="racenova-race-card"
        >

          <div
            class="racenova-card-label"
          >
            NEXT RACE
          </div>

          <div
            class="racenova-race-name"
          >
            DESERT RUN
          </div>

          <div
            class="racenova-race-class"
          >
            AMATEUR
          </div>

          <div
            class="racenova-card-divider"
          ></div>

          <div
            class="racenova-race-meta"
          >
            <span>
              CAR: NOVA GT
            </span>

            <span>
              1/5 CLEARED
            </span>
          </div>

        </div>

        <button
          class="racenova-start-button"
          type="button"
        >
          START RACE
        </button>

        <div
          class="racenova-menu-secondary"
        >

          <button
            type="button"
            class="racenova-secondary-button"
          >
            CAMPAIGN
          </button>

          <button
            type="button"
            class="racenova-secondary-button"
          >
            GARAGE
          </button>

        </div>

        <div
          class="racenova-controls-hint"
        >
          ← → LANE
          &nbsp;·&nbsp;
          ↑ NITRO
          &nbsp;·&nbsp;
          ↓ DRIFT
        </div>

      </div>
    `;

    container.appendChild(
      this.root
    );

    const startButton =
      this.root.querySelector<HTMLButtonElement>(
        ".racenova-start-button"
      );

    const campaignButton =
      this.root.querySelector<HTMLButtonElement>(
        ".racenova-secondary-button:nth-child(1)"
      );

    const garageButton =
      this.root.querySelector<HTMLButtonElement>(
        ".racenova-secondary-button:nth-child(2)"
      );

    if (!startButton) {

      throw new Error(
        "RaceNova: START RACE button not found."
      );
    }

    if (!campaignButton) {

      throw new Error(
        "RaceNova: CAMPAIGN button not found."
      );
    }

    if (!garageButton) {

      throw new Error(
        "RaceNova: GARAGE button not found."
      );
    }

    this.startButton =
      startButton;

    this.campaignButton =
      campaignButton;

    this.garageButton =
      garageButton;

    this.injectStyles();

    this.startButton.addEventListener(
      "click",
      this.handleStart
    );

    this.campaignButton.addEventListener(
      "click",
      this.handleCampaign
    );

    this.garageButton.addEventListener(
      "click",
      this.handleGarage
    );

    this.root.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  // =========================================================
  // START RACE
  // =========================================================

  private readonly handleStart =
    (): void => {

      if (
        this.started
      ) {
        return;
      }

      this.started =
        true;

      this.startButton.disabled =
        true;

      this.campaignButton.disabled =
        true;

      this.garageButton.disabled =
        true;

      this.startButton.classList.add(
        "is-pressed"
      );

      window.setTimeout(
        () => {

          this.hide();

          this.onStartRace();

        },
        120
      );
    };

  // =========================================================
  // CAMPAIGN
  // =========================================================

  private readonly handleCampaign =
    (): void => {

      if (
        this.started
      ) {
        return;
      }

      this.onCampaign();
    };

  // =========================================================
  // GARAGE
  // =========================================================

  private readonly handleGarage =
    (): void => {

      if (
        this.started
      ) {
        return;
      }

      this.onGarage();
    };

  // =========================================================
  // RESET START STATE
  // =========================================================

  /**
   * Re-arms the Main Menu after a race crash/end.
   *
   * This does not start gameplay.
   * It only makes START RACE available again.
   */
  public resetStartState():
    void {

    this.started =
      false;

    this.startButton.disabled =
      false;

    this.campaignButton.disabled =
      false;

    this.garageButton.disabled =
      false;

    this.startButton.classList.remove(
      "is-pressed"
    );
  }

  // =========================================================
  // SHOW
  // =========================================================

  public show():
    void {

    this.root.classList.remove(
      "is-hidden"
    );

    this.root.setAttribute(
      "aria-hidden",
      "false"
    );
  }

  // =========================================================
  // HIDE
  // =========================================================

  public hide():
    void {

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

    return !this.root.classList.contains(
      "is-hidden"
    );
  }

  // =========================================================
  // DISPOSE
  // =========================================================

  public dispose():
    void {

    this.startButton.removeEventListener(
      "click",
      this.handleStart
    );

    this.campaignButton.removeEventListener(
      "click",
      this.handleCampaign
    );

    this.garageButton.removeEventListener(
      "click",
      this.handleGarage
    );

    this.root.remove();
  }

  // =========================================================
  // STYLES
  // =========================================================

  private injectStyles():
    void {

    const styleId =
      "racenova-main-menu-styles";

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

      .racenova-main-menu {

        position: fixed;

        inset: 0;

        z-index: 10000;

        overflow: hidden;

        display: flex;

        align-items: stretch;

        justify-content: center;

        box-sizing: border-box;

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

      .racenova-main-menu.is-hidden {

        opacity:
          0;

        visibility:
          hidden;

        pointer-events:
          none;

      }

      .racenova-menu-background {

        position:
          absolute;

        inset:
          0;

        background:

          radial-gradient(
            circle at 50% 72%,
            rgba(
              245,
              45,
              45,
              0.22
            ),
            transparent 25%
          ),

          linear-gradient(
            180deg,
            #070c18 0%,
            #09101d 48%,
            #060a14 100%
          );

      }

      .racenova-menu-background::before {

        content:
          "";

        position:
          absolute;

        left:
          -15%;

        right:
          -15%;

        top:
          39%;

        height:
          70%;

        transform:
          perspective(380px)
          rotateX(58deg);

        transform-origin:
          top center;

        background:

          linear-gradient(
            90deg,
            transparent 48%,
            rgba(
              255,
              255,
              255,
              0.09
            ) 49%,
            rgba(
              255,
              255,
              255,
              0.09
            ) 51%,
            transparent 52%
          ),

          linear-gradient(
            90deg,
            rgba(
              244,
              45,
              45,
              0.18
            ),
            transparent 16%,
            transparent 84%,
            rgba(
              244,
              45,
              45,
              0.18
            )
          );

        opacity:
          0.5;
      }

      .racenova-menu-content {

        position:
          relative;

        z-index:
          2;

        width:
          min(
            830px,
            calc(
              100% - 40px
            )
          );

        min-height:
          100%;

        box-sizing:
          border-box;

        padding:
          clamp(
            32px,
            6vh,
            68px
          )
          0
          34px;

        display:
          flex;

        flex-direction:
          column;

        align-items:
          center;

        text-align:
          center;

      }

      .racenova-kicker {

        color:
          #e4b83f;

        font-size:
          clamp(
            12px,
            1.8vw,
            22px
          );

        letter-spacing:
          0.48em;

        font-weight:
          500;

        margin-bottom:
          24px;
      }

      .racenova-logo {

        font-size:
          clamp(
            54px,
            9vw,
            118px
          );

        line-height:
          0.86;

        letter-spacing:
          -0.065em;

        font-weight:
          900;

        white-space:
          nowrap;
      }

      .racenova-logo-light {

        color:
          #f1f4fb;
      }

      .racenova-logo-red {

        color:
          #ff3030;
      }

      .racenova-tagline {

        margin-top:
          30px;

        color:
          #9da8bd;

        font-size:
          clamp(
            14px,
            2.25vw,
            28px
          );

        line-height:
          1.5;
      }

      .racenova-race-card {

        width:
          min(
            100%,
            720px
          );

        box-sizing:
          border-box;

        margin-top:
          42px;

        padding:
          32px 42px;

        text-align:
          left;

        border:
          1px solid
          rgba(
            132,
            149,
            180,
            0.32
          );

        border-radius:
          34px;

        background:
          rgba(
            16,
            24,
            39,
            0.76
          );

        box-shadow:
          inset
          0 0 45px
          rgba(
            55,
            74,
            110,
            0.08
          ),

          0 18px 60px
          rgba(
            0,
            0,
            0,
            0.25
          );

        backdrop-filter:
          blur(9px);
      }

      .racenova-card-label {

        color:
          #aab3c5;

        font-size:
          clamp(
            12px,
            1.7vw,
            19px
          );

        letter-spacing:
          0.35em;
      }

      .racenova-race-name {

        margin-top:
          14px;

        font-size:
          clamp(
            30px,
            4.4vw,
            54px
          );

        font-weight:
          900;
      }

      .racenova-race-class {

        margin-top:
          10px;

        color:
          #e4b83f;

        font-size:
          clamp(
            15px,
            2vw,
            24px
          );

        letter-spacing:
          0.28em;
      }

      .racenova-card-divider {

        height:
          1px;

        margin:
          22px 0 18px;

        background:
          rgba(
            146,
            159,
            185,
            0.18
          );
      }

      .racenova-race-meta {

        display:
          flex;

        justify-content:
          space-between;

        gap:
          18px;

        color:
          #aab3c5;

        font-size:
          clamp(
            12px,
            1.8vw,
            20px
          );

        letter-spacing:
          0.18em;
      }

      .racenova-start-button {

        width:
          min(
            100%,
            720px
          );

        min-height:
          110px;

        margin-top:
          38px;

        border:
          0;

        border-radius:
          999px;

        background:
          #f52f2f;

        color:
          #ffffff;

        font:
          inherit;

        font-size:
          clamp(
            22px,
            3.2vw,
            38px
          );

        font-weight:
          800;

        letter-spacing:
          0.17em;

        cursor:
          pointer;

        touch-action:
          manipulation;

        -webkit-tap-highlight-color:
          transparent;

        box-shadow:

          0 15px 38px
          rgba(
            245,
            47,
            47,
            0.35
          ),

          0 0 42px
          rgba(
            245,
            47,
            47,
            0.18
          );

        transition:
          transform 90ms ease,
          filter 120ms ease,
          box-shadow 120ms ease;
      }

      .racenova-start-button:hover {

        filter:
          brightness(
            1.06
          );

        box-shadow:

          0 18px 45px
          rgba(
            245,
            47,
            47,
            0.42
          ),

          0 0 55px
          rgba(
            245,
            47,
            47,
            0.23
          );
      }

      .racenova-start-button:active,
      .racenova-start-button.is-pressed {

        transform:
          scale(
            0.985
          );

        filter:
          brightness(
            0.92
          );
      }

      .racenova-start-button:disabled {

        cursor:
          default;

        opacity:
          0.72;
      }

      .racenova-menu-secondary {

        width:
          min(
            100%,
            720px
          );

        display:
          grid;

        grid-template-columns:
          1fr 1fr;

        gap:
          24px;

        margin-top:
          26px;
      }

      .racenova-secondary-button {

        min-height:
          78px;

        border:
          1px solid
          rgba(
            105,
            123,
            157,
            0.34
          );

        border-radius:
          999px;

        background:
          rgba(
            16,
            24,
            39,
            0.72
          );

        color:
          #f4f7ff;

        font:
          inherit;

        font-size:
          clamp(
            16px,
            2.2vw,
            26px
          );

        font-weight:
          800;

        letter-spacing:
          0.16em;

        cursor:
          pointer;

        touch-action:
          manipulation;

        -webkit-tap-highlight-color:
          transparent;

        opacity:
          0.9;

        transition:
          transform 90ms ease,
          filter 120ms ease,
          background 120ms ease,
          border-color 120ms ease;

      }

      .racenova-secondary-button:hover {

        filter:
          brightness(
            1.08
          );

        background:
          rgba(
            28,
            39,
            60,
            0.82
          );

        border-color:
          rgba(
            228,
            184,
            63,
            0.48
          );
      }

      .racenova-secondary-button:active {

        transform:
          scale(
            0.985
          );

        filter:
          brightness(
            0.92
          );
      }

      .racenova-secondary-button:disabled {

        cursor:
          default;

        opacity:
          0.55;
      }

      .racenova-controls-hint {

        margin-top:
          34px;

        color:
          #8995aa;

        font-size:
          clamp(
            11px,
            1.6vw,
            18px
          );

        letter-spacing:
          0.20em;
      }

      @media (
        max-width: 600px
      ) {

        .racenova-menu-content {

          width:
            calc(
              100% - 28px
            );

          padding-top:
            30px;
        }

        .racenova-tagline br {

          display:
            none;
        }

        .racenova-race-card {

          border-radius:
            28px;

          padding:
            24px;
        }

        .racenova-race-meta {

          letter-spacing:
            0.08em;
        }

        .racenova-menu-secondary {

          gap:
            12px;
        }

        .racenova-secondary-button {

          min-height:
            64px;

          letter-spacing:
            0.08em;
        }

        .racenova-start-button {

          min-height:
            82px;
        }

        .racenova-controls-hint {

          letter-spacing:
            0.06em;
        }
      }

      @media (
        max-height: 720px
      ) {

        .racenova-menu-content {

          padding-top:
            20px;

          padding-bottom:
            18px;
        }

        .racenova-tagline,
        .racenova-controls-hint {

          display:
            none;
        }

        .racenova-race-card {

          margin-top:
            22px;
        }

        .racenova-start-button {

          margin-top:
            20px;

          min-height:
            68px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }
        }
