/**
 * ============================================================
 * RaceNova V2
 * Main Menu
 * M11.6.1 — Pi Login UI Integration
 * ============================================================
 *
 * Main start screen.
 *
 * Responsibilities:
 * - RaceNova title
 * - Dynamic Next Race card
 * - START RACE button
 * - CAMPAIGN button
 * - GARAGE button
 * - REAL Pi Login button
 * - Mobile responsive UI
 * - Start race callback
 * - Campaign callback
 * - Garage callback
 * - Pi Login callback
 * - Safe start-state reset for race restart
 * - Dynamic campaign progress display
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No gameplay dependency
 * - No save logic
 * - No authentication logic
 * - Authentication is delegated to onPiLogin callback
 * - RACE_DEFINITIONS is authoritative for race metadata
 * ============================================================
 */

import {
  type PlayerProgress
} from "../save/PlayerSaveData";

import {
  RACE_DEFINITIONS
} from "../race/RaceDefinitions";


export interface MainMenuConfig {

  onStartRace:
    () => void;

  onCampaign:
    () => void;

  onGarage:
    () => void;

  onPiLogin:
    () => Promise<void>;
}

onGoogleSignOut:
  () => Promise<void>;

export class MainMenu {

  private readonly root:
    HTMLDivElement;

  private readonly startButton:
    HTMLButtonElement;

  private readonly campaignButton:
    HTMLButtonElement;

  private readonly garageButton:
    HTMLButtonElement;

  private readonly piLoginButton:
    HTMLButtonElement;

  private readonly googleLoginContainer:
    HTMLDivElement;

 private readonly googleSignOutButton:
   HTMLButtonElement;

  // =========================================================
  // M8.8 — Dynamic Next Race UI References
  // =========================================================

  private readonly raceNameValue:
    HTMLDivElement;

  private readonly raceClassValue:
    HTMLDivElement;

  private readonly raceMetaLeft:
    HTMLSpanElement;

  private readonly raceMetaRight:
    HTMLSpanElement;


  // =========================================================
  // Callbacks
  // =========================================================

  private readonly onStartRace:
    () => void;

  private readonly onCampaign:
    () => void;

  private readonly onGarage:
    () => void;

  private readonly onPiLogin:
    () => Promise<void>;

  private readonly onGoogleSignOut:
  () => Promise<void>;


  private started =
    false;


  constructor(
    container:
      HTMLElement,

    config:
      MainMenuConfig
  ) {

    this.onStartRace =
      config.onStartRace;

    this.onCampaign =
      config.onCampaign;

    this.onGarage =
      config.onGarage;

    this.onPiLogin =
      config.onPiLogin;

    this.onGoogleSignOut =
  config.onGoogleSignOut;

    // =======================================================
    // Root
    // =======================================================

    this.root =
      document.createElement(
        "div"
      );

    this.root.className =
      "racenova-main-menu";


    // =======================================================
    // Main Menu HTML
    // =======================================================

    this.root.innerHTML = `

      <div
        class="racenova-menu-background"
      ></div>

      <div
        class="racenova-menu-content"
      >

        <!-- ================================================
             M11.6.1 — Pi Login
             ================================================ -->

        <button
          class="racenova-pi-login-button"
          type="button"
          aria-label="Login with Pi"
        >
          LOGIN WITH PI
        </button>

        <div
  class="racenova-google-auth-area"
  aria-label="Google authentication"
>

  <div
    class="racenova-google-login-container"
  ></div>

  <button
    class="racenova-google-signout-button"
    type="button"
    aria-label="Sign out of Google"
    hidden
  >
    SIGN OUT GOOGLE
  </button>

</div>

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
            CAMPAIGN
          </div>


          <div
            class="racenova-card-divider"
          ></div>


          <div
            class="racenova-race-meta"
          >

            <span
              class="racenova-race-meta-left"
            >
              LEVEL 1
            </span>

            <span
              class="racenova-race-meta-right"
            >
              0/8 CLEARED
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


    // =======================================================
    // Existing Buttons
    // =======================================================

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


    // =======================================================
    // M11.6.1 — Pi Login Button
    // =======================================================

    const piLoginButton =
      this.root.querySelector<HTMLButtonElement>(
        ".racenova-pi-login-button"
      );

    const googleLoginContainer =
  this.root.querySelector<HTMLDivElement>(
    ".racenova-google-login-container"
  );

const googleSignOutButton =
  this.root.querySelector<HTMLButtonElement>(
    ".racenova-google-signout-button"
  );


    // =======================================================
    // M8.8 — Dynamic Race Card Elements
    // =======================================================

    const raceNameValue =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-race-name"
      );


    const raceClassValue =
      this.root.querySelector<HTMLDivElement>(
        ".racenova-race-class"
      );


    const raceMetaLeft =
      this.root.querySelector<HTMLSpanElement>(
        ".racenova-race-meta-left"
      );


    const raceMetaRight =
      this.root.querySelector<HTMLSpanElement>(
        ".racenova-race-meta-right"
      );


    // =======================================================
    // Required Element Validation
    // =======================================================

    if (
      !startButton
    ) {

      throw new Error(
        "RaceNova: START RACE button not found."
      );
    }


    if (
      !campaignButton
    ) {

      throw new Error(
        "RaceNova: CAMPAIGN button not found."
      );
    }


    if (
      !garageButton
    ) {

      throw new Error(
        "RaceNova: GARAGE button not found."
      );
    }


    if (
      !piLoginButton
    ) {

      throw new Error(
        "RaceNova: Pi login button not found."
      );
    }


    if (
      !raceNameValue
    ) {

      throw new Error(
        "RaceNova: Race name element not found."
      );
    }


    if (
      !raceClassValue
    ) {

      throw new Error(
        "RaceNova: Race class element not found."
      );
    }


    if (
      !raceMetaLeft
    ) {

      throw new Error(
        "RaceNova: Race meta left element not found."
      );
    }


    if (
      !raceMetaRight
    ) {

      throw new Error(
        "RaceNova: Race meta right element not found."
      );
    }


    // =======================================================
    // Store References
    // =======================================================

    this.startButton =
      startButton;


    this.campaignButton =
      campaignButton;


    this.garageButton =
      garageButton;


    this.piLoginButton =
      piLoginButton;

    this.googleLoginContainer =
      googleLoginContainer;

     this.googleSignOutButton =
       googleSignOutButton;


    this.raceNameValue =
      raceNameValue;


    this.raceClassValue =
      raceClassValue;


    this.raceMetaLeft =
      raceMetaLeft;


    this.raceMetaRight =
      raceMetaRight;


    // =======================================================
    // Styles
    // =======================================================

    this.injectStyles();


    // =======================================================
    // Event Listeners
    // =======================================================

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


    this.piLoginButton.addEventListener(
      "click",
      this.handlePiLogin
    );

    this.googleSignOutButton.addEventListener(
  "click",
  this.handleGoogleSignOut
);


    this.root.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  // =========================================================
  // M11.6.1 — Pi Login Handler
  // =========================================================

  private readonly handlePiLogin =
    async (): Promise<void> => {

      if (
        this.piLoginButton.disabled
      ) {

        return;
      }


      this.piLoginButton.disabled =
        true;


      try {

        await this.onPiLogin();

      } finally {

        this.piLoginButton.disabled =
          false;
      }
    };


  // =========================================================
  // M11.6.1 — Authentication State
  // =========================================================
  //
  // MainMenu does not perform authentication.
  //
  // It only displays the state supplied by the
  // application authentication runtime.
  // =========================================================

  public setAuthenticationState(
    authenticated:
      boolean,

    displayName?:
      string
  ):
    void {

    if (
      authenticated
    ) {

      this.piLoginButton.textContent =
        displayName
          ? `PI: ${displayName}`
          : "PI ACCOUNT";


      this.piLoginButton.setAttribute(
        "aria-label",
        "Pi account"
      );


      this.piLoginButton.classList.add(
        "is-authenticated"
      );


      return;
    }


    this.piLoginButton.textContent =
      "LOGIN WITH PI";


    this.piLoginButton.setAttribute(
      "aria-label",
      "Login with Pi"
    );


    this.piLoginButton.classList.remove(
      "is-authenticated"
    );
  }

  private readonly handleGoogleSignOut =
  async (): Promise<void> => {

  if (
    this.googleSignOutButton.disabled
  ) {
    return;
  }

  this.googleSignOutButton.disabled =
    true;

  try {

    await this.onGoogleSignOut();

  } finally {

    this.googleSignOutButton.disabled =
      false;
  }
};


public getGoogleLoginContainer():
  HTMLElement {

  return this.googleLoginContainer;
}


public setGoogleAuthenticationState(
  authenticated:
    boolean,

  displayName?:
    string
):
  void {

  this.googleLoginContainer.hidden =
    authenticated;

  this.googleSignOutButton.hidden =
    !authenticated;

  if (
    authenticated
  ) {

    this.googleSignOutButton.textContent =
      displayName
        ? `GOOGLE: ${displayName}`
        : "GOOGLE ACCOUNT";

    this.googleSignOutButton.setAttribute(
      "aria-label",
      "Google account"
    );

    return;
  }

  this.googleSignOutButton.textContent =
    "SIGN OUT GOOGLE";

  this.googleSignOutButton.setAttribute(
    "aria-label",
    "Sign out of Google"
  );
}


public setGoogleLoginDisabled(
  disabled:
    boolean
):
  void {

  this.googleLoginContainer
    .classList.toggle(
      "is-disabled",
      disabled
    );

  this.googleLoginContainer
    .setAttribute(
      "aria-disabled",
      String(disabled)
    );

  this.googleSignOutButton.disabled =
    disabled;
}

  // =========================================================
  // M8.8 — Dynamic Campaign Progress
  // =========================================================
  //
  // Updates the Main Menu NEXT RACE card from
  // authoritative PlayerProgress.
  //
  // IMPORTANT:
  // - No gameplay logic.
  // - No save logic.
  // - RACE_DEFINITIONS remains authoritative
  //   for race names, levels and Boss state.
  // =========================================================

  public setProgress(
    progress:
      PlayerProgress
  ):
    void {

    const progression =
      progress.raceProgression;


    // -------------------------------------------------------
    // Count completed races
    // -------------------------------------------------------

    const completedCount =
      progression.races.filter(
        (
          race
        ) =>
          race.status ===
          "completed"
      ).length;


    const totalRaces =
      progression.races.length;


    // -------------------------------------------------------
    // Find next available race
    // -------------------------------------------------------

    const nextRace =
      progression.races.find(
        (
          race
        ) =>
          race.status ===
          "available"
      );


    // -------------------------------------------------------
    // Resolve authoritative definition
    // -------------------------------------------------------

    const nextDefinition =
      nextRace
        ? RACE_DEFINITIONS.find(
            (
              definition
            ) =>
              definition.id ===
              nextRace.raceId
          )
        : undefined;


    // -------------------------------------------------------
    // Campaign complete
    // -------------------------------------------------------

    if (
      !nextRace ||
      !nextDefinition
    ) {

      this.raceNameValue.textContent =
        "CAMPAIGN COMPLETE";


      this.raceClassValue.textContent =
        "ALL RACES CLEARED";


      this.raceMetaLeft.textContent =
        "CAMPAIGN COMPLETE";


      this.raceMetaRight.textContent =
        `${completedCount}/${totalRaces} CLEARED`;


      return;
    }


    // -------------------------------------------------------
    // Dynamic race information
    // -------------------------------------------------------

    this.raceNameValue.textContent =
      nextDefinition.name;


    this.raceClassValue.textContent =
      nextDefinition.isBoss
        ? "BOSS"
        : "CAMPAIGN";


    this.raceMetaLeft.textContent =
      `LEVEL ${nextDefinition.level}`;


    this.raceMetaRight.textContent =
      `${completedCount}/${totalRaces} CLEARED`;
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


      this.piLoginButton.disabled =
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
   * It only makes the Main Menu available again.
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


    this.piLoginButton.disabled =
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


    this.piLoginButton.removeEventListener(
      "click",
      this.handlePiLogin
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

        position:
          fixed;

        inset:
          0;

        z-index:
          10000;

        overflow:
          hidden;

        display:
          flex;

        align-items:
          stretch;

        justify-content:
          center;

        box-sizing:
          border-box;

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


      /* =====================================================
         M11.6.1 — Pi Login Button
         ===================================================== */

      .racenova-pi-login-button {

        align-self:
          flex-end;

        min-height:
          46px;

        padding:
          0 18px;

        border:
          1px solid
          rgba(
            228,
            184,
            63,
            0.48
          );

        border-radius:
          999px;

        background:
          rgba(
            16,
            24,
            39,
            0.78
          );

        color:
          #f4f7ff;

        font:
          inherit;

        font-size:
          12px;

        font-weight:
          800;

        letter-spacing:
          0.10em;

        cursor:
          pointer;

        touch-action:
          manipulation;

        -webkit-tap-highlight-color:
          transparent;

        backdrop-filter:
          blur(8px);

        transition:
          transform 90ms ease,
          filter 120ms ease,
          background 120ms ease,
          border-color 120ms ease;
      }


      .racenova-pi-login-button:hover {

        filter:
          brightness(
            1.08
          );
      }


      .racenova-pi-login-button:active {

        transform:
          scale(
            0.98
          );
      }


      .racenova-pi-login-button:disabled {

        cursor:
          default;

        opacity:
          0.55;
      }


      .racenova-pi-login-button.is-authenticated {

        border-color:
          rgba(
            85,
            214,
            135,
            0.58
          );

        color:
          #8df0b0;
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

        opacity:
          0.9;

        box-shadow:
          0 8px 24px
          rgba(
            0,
            0,
            0,
            0.18
          );

        transition:
          transform 90ms ease,
          filter 120ms ease,
          background 120ms ease,
          border-color 120ms ease;
      }


      .racenova-start-button:active {

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
          0.55;
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

        display:
          flex;

        align-items:
          center;

        justify-content:
          center;

        width:
          100%;

        min-height:
          78px;

        box-sizing:
          border-box;

        padding:
          0 22px;

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

        box-shadow:
          0 8px 24px
          rgba(
            0,
            0,
            0,
            0.18
          );

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
            18px;
        }


        .racenova-pi-login-button {

          align-self:
            flex-end;

          min-height:
            42px;

          padding:
            0 14px;

          font-size:
            11px;
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

          padding:
            0 14px;

          font-size:
            14px;

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
            12px;

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

      .racenova-google-auth-area {
  align-self:
    flex-end;

  min-height:
    44px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    flex-end;

  gap:
    8px;
}

.racenova-google-login-container {
  min-height:
    40px;

  display:
    flex;

  align-items:
    center;

  justify-content:
    flex-end;
}

.racenova-google-login-container.is-disabled {
  opacity:
    0.55;

  pointer-events:
    none;
}

.racenova-google-signout-button {
  min-height:
    40px;

  max-width:
    260px;

  padding:
    0 14px;

  border:
    1px solid
    rgba(
      85,
      214,
      135,
      0.58
    );

  border-radius:
    999px;

  background:
    rgba(
      16,
      24,
      39,
      0.78
    );

  color:
    #8df0b0;

  font:
    inherit;

  font-size:
    11px;

  font-weight:
    800;

  letter-spacing:
    0.08em;

  cursor:
    pointer;

  touch-action:
    manipulation;
}

.racenova-google-signout-button:disabled {
  cursor:
    default;

  opacity:
    0.55;
}
`;


    document.head.appendChild(
      style
    );
  }
}
