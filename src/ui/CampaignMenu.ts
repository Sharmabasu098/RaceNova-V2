/**
 * ============================================================
 * RaceNova V2
 * Campaign Menu
 * M7.9.9
 * ============================================================
 *
 * Responsibilities:
 * - Display campaign race list
 * - Show locked / available / completed state
 * - Show race progress
 * - Select available race
 * - Start selected race
 * - Return to Main Menu
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No game-engine dependency
 * - No localStorage dependency
 * - RaceDefinitions remain authoritative
 * - RaceProgressionState remains authoritative
 * ============================================================
 */

import {
  RACE_DEFINITIONS
} from "../race/RaceDefinitions";

import {
  type RaceDefinition,
  type RaceProgress,
  type RaceProgressionState
} from "../race/RaceProgressionData";

// ============================================================
// Configuration
// ============================================================

export interface CampaignMenuConfig {

  /**
   * Called when the player wants
   * to return to the main menu.
   */
  onBack: () => void;

  /**
   * Called when the player starts
   * a campaign race.
   */
  onStartRace: (
    raceId: string
  ) => void;
}

// ============================================================
// Campaign Menu
// ============================================================

export class CampaignMenu {

  // ==========================================================
  // Root
  // ==========================================================

  private readonly root: HTMLDivElement;

  // ==========================================================
  // Configuration
  // ==========================================================

  private readonly onBack: () => void;

  private readonly onStartRace: (
    raceId: string
  ) => void;

  // ==========================================================
  // UI Elements
  // ==========================================================

  private readonly list: HTMLDivElement;

  private readonly title: HTMLDivElement;

  private readonly subtitle: HTMLDivElement;

  private readonly progressLabel: HTMLDivElement;

  private readonly backButton: HTMLButtonElement;

  private readonly startButton: HTMLButtonElement;

  private readonly selectedRaceLabel: HTMLDivElement;

  // ==========================================================
  // State
  // ==========================================================

  private progressionState:
    RaceProgressionState | null =
      null;

  private selectedRaceId: string = "";

  // ==========================================================
  // Constructor
  // ==========================================================

  constructor(
    container: HTMLElement,
    config: CampaignMenuConfig
  ) {

    this.onBack =
      config.onBack;

    this.onStartRace =
      config.onStartRace;

    // --------------------------------------------------------
    // Root
    // --------------------------------------------------------

    this.root =
      document.createElement(
        "div"
      );

    this.root.className =
      "racenova-campaign-menu";

    // --------------------------------------------------------
    // Header
    // --------------------------------------------------------

    const header =
      document.createElement(
        "div"
      );

    header.className =
      "racenova-campaign-header";

    // --------------------------------------------------------
    // Title
    // --------------------------------------------------------

    this.title =
      document.createElement(
        "div"
      );

    this.title.className =
      "racenova-campaign-title";

    this.title.textContent =
      "CAMPAIGN";

    // --------------------------------------------------------
    // Subtitle
    // --------------------------------------------------------

    this.subtitle =
      document.createElement(
        "div"
      );

    this.subtitle.className =
      "racenova-campaign-subtitle";

    this.subtitle.textContent =
      "Race through the campaign and defeat every rival.";

    // --------------------------------------------------------
    // Progress
    // --------------------------------------------------------

    this.progressLabel =
      document.createElement(
        "div"
      );

    this.progressLabel.className =
      "racenova-campaign-progress";

    this.progressLabel.textContent =
      "0 / 8 CLEARED";

    header.appendChild(
      this.title
    );

    header.appendChild(
      this.subtitle
    );

    header.appendChild(
      this.progressLabel
    );

    // --------------------------------------------------------
    // Race list
    // --------------------------------------------------------

    this.list =
      document.createElement(
        "div"
      );

    this.list.className =
      "racenova-campaign-list";

    // --------------------------------------------------------
    // Selected race
    // --------------------------------------------------------

    this.selectedRaceLabel =
      document.createElement(
        "div"
      );

    this.selectedRaceLabel.className =
      "racenova-campaign-selected";

    this.selectedRaceLabel.textContent =
      "SELECT A RACE";

    // --------------------------------------------------------
    // Footer
    // --------------------------------------------------------

    const footer =
      document.createElement(
        "div"
      );

    footer.className =
      "racenova-campaign-footer";

    // --------------------------------------------------------
    // Back button
    // --------------------------------------------------------

    this.backButton =
      document.createElement(
        "button"
      );

    this.backButton.type =
      "button";

    this.backButton.className =
      "racenova-campaign-back";

    this.backButton.textContent =
      "BACK";

    // --------------------------------------------------------
    // Start button
    // --------------------------------------------------------

    this.startButton =
      document.createElement(
        "button"
      );

    this.startButton.type =
      "button";

    this.startButton.className =
      "racenova-campaign-start";

    this.startButton.textContent =
      "START RACE";

    this.startButton.disabled =
      true;

    footer.appendChild(
      this.backButton
    );

    footer.appendChild(
      this.startButton
    );

    // --------------------------------------------------------
    // Assemble
    // --------------------------------------------------------

    this.root.appendChild(
      header
    );

    this.root.appendChild(
      this.list
    );

    this.root.appendChild(
      this.selectedRaceLabel
    );

    this.root.appendChild(
      footer
    );

    container.appendChild(
      this.root
    );

    // --------------------------------------------------------
    // Events
    // --------------------------------------------------------

    this.backButton.addEventListener(
      "click",
      this.handleBack
    );

    this.startButton.addEventListener(
      "click",
      this.handleStart
    );

    // --------------------------------------------------------
    // Initial UI
    // --------------------------------------------------------

    this.injectStyles();

    this.hide();
  }

  // ==========================================================
  // Progress
  // ==========================================================

  public setProgress(
    state: RaceProgressionState
  ): void {

    this.progressionState =
      this.cloneState(
        state
      );

    const selectedFromState =
      state.selectedRaceId;

    if (
      this.isRaceSelectable(
        selectedFromState
      )
    ) {

      this.selectedRaceId =
        selectedFromState;

    } else {

      const firstAvailable =
        RACE_DEFINITIONS.find(
          (
            definition
          ) => {

            const progress =
              this.getRaceProgress(
                state,
                definition.id
              );

            return (
              progress.status !==
              "locked"
            );
          }
        );

      this.selectedRaceId =
        firstAvailable?.id ??
        RACE_DEFINITIONS[0]?.id ??
        "";
    }

    this.render();
  }

  // ==========================================================
  // Render
  // ==========================================================

  private render(): void {

    this.list.innerHTML =
      "";

    const state =
      this.progressionState;

    if (!state) {

      this.progressLabel.textContent =
        "0 / 8 CLEARED";

      this.selectedRaceLabel.textContent =
        "SELECT A RACE";

      this.startButton.disabled =
        true;

      return;
    }

    // --------------------------------------------------------
    // Overall progress
    // --------------------------------------------------------

    const completedCount =
      RACE_DEFINITIONS.reduce(
        (
          count,
          definition
        ) => {

          const progress =
            this.getRaceProgress(
              state,
              definition.id
            );

          return (
            count +
            (
              progress.status ===
              "completed"
                ? 1
                : 0
            )
          );
        },
        0
      );

    this.progressLabel.textContent =
      `${completedCount} / ${RACE_DEFINITIONS.length} CLEARED`;

    // --------------------------------------------------------
    // Race cards
    // --------------------------------------------------------

    RACE_DEFINITIONS.forEach(
      (
        definition
      ) => {

        const progress =
          this.getRaceProgress(
            state,
            definition.id
          );

        const card =
          this.createRaceCard(
            definition,
            progress
          );

        this.list.appendChild(
          card
        );
      }
    );

    // --------------------------------------------------------
    // Selected race
    // --------------------------------------------------------

    const selectedDefinition =
      RACE_DEFINITIONS.find(
        (
          definition
        ) =>
          definition.id ===
          this.selectedRaceId
      );

    if (
      selectedDefinition
    ) {

      this.selectedRaceLabel.textContent =
        `SELECTED: ${selectedDefinition.name}`;

    } else {

      this.selectedRaceLabel.textContent =
        "SELECT A RACE";
    }

    // --------------------------------------------------------
    // Start button
    // --------------------------------------------------------

    this.startButton.disabled =
      !this.isRaceSelectable(
        this.selectedRaceId
      );
  }

  // ==========================================================
  // Create Race Card
  // ==========================================================

  private createRaceCard(
    definition: RaceDefinition,
    progress: RaceProgress
  ): HTMLButtonElement {

    const card =
      document.createElement(
        "button"
      );

    card.type =
      "button";

    card.className =
      "racenova-campaign-card";

    // --------------------------------------------------------
    // State class
    // --------------------------------------------------------

    card.classList.add(
      `state-${progress.status}`
    );

    if (
      definition.id ===
      this.selectedRaceId
    ) {

      card.classList.add(
        "is-selected"
      );
    }

    // --------------------------------------------------------
    // Locked
    // --------------------------------------------------------

    if (
      progress.status ===
      "locked"
    ) {

      card.disabled =
        true;
    }

    // --------------------------------------------------------
    // Level
    // --------------------------------------------------------

    const level =
      document.createElement(
        "div"
      );

    level.className =
      "racenova-campaign-card-level";

    level.textContent =
      `LEVEL ${definition.level}`;

    // --------------------------------------------------------
    // Name
    // --------------------------------------------------------

    const name =
      document.createElement(
        "div"
      );

    name.className =
      "racenova-campaign-card-name";

    name.textContent =
      definition.name;

    // --------------------------------------------------------
    // Description
    // --------------------------------------------------------

    const description =
      document.createElement(
        "div"
      );

    description.className =
      "racenova-campaign-card-description";

    description.textContent =
      definition.description ??
      "RaceNova campaign challenge.";

    // --------------------------------------------------------
    // Status
    // --------------------------------------------------------

    const status =
      document.createElement(
        "div"
      );

    status.className =
      "racenova-campaign-card-status";

    if (
      progress.status ===
      "locked"
    ) {

      status.textContent =
        "🔒 LOCKED";

    } else if (
      progress.status ===
      "completed"
    ) {

      if (
        definition.isBoss &&
        progress.bossDefeated
      ) {

        status.textContent =
          "✓ BOSS DEFEATED";

      } else {

        status.textContent =
          "✓ COMPLETED";
      }

    } else {

      status.textContent =
        "▶ AVAILABLE";
    }

    // --------------------------------------------------------
    // Stats
    // --------------------------------------------------------

    const stats =
      document.createElement(
        "div"
      );

    stats.className =
      "racenova-campaign-card-stats";

    const wins =
      progress.winCount;

    const completions =
      progress.completionCount;

    if (
      progress.status ===
      "locked"
    ) {

      stats.textContent =
        "Complete the previous race to unlock.";

    } else {

      stats.textContent =
        `WINS ${wins}  •  RUNS ${completions}`;

      if (
        progress.bestPosition > 0
      ) {

        stats.textContent +=
          `  •  BEST #${progress.bestPosition}`;
      }

      if (
        progress.bestTime > 0
      ) {

        stats.textContent +=
          `  •  ${this.formatTime(
            progress.bestTime
          )}`;
      }
    }

    // --------------------------------------------------------
    // Boss badge
    // --------------------------------------------------------

    if (
      definition.isBoss
    ) {

      const bossBadge =
        document.createElement(
          "div"
        );

      bossBadge.className =
        "racenova-campaign-boss";

      bossBadge.textContent =
        "BOSS";

      card.appendChild(
        bossBadge
      );
    }

    // --------------------------------------------------------
    // Assemble
    // --------------------------------------------------------

    card.appendChild(
      level
    );

    card.appendChild(
      name
    );

    card.appendChild(
      description
    );

    card.appendChild(
      status
    );

    card.appendChild(
      stats
    );

    // --------------------------------------------------------
    // Selection
    // --------------------------------------------------------

    if (
      progress.status !==
      "locked"
    ) {

      card.addEventListener(
        "click",
        () => {

          this.selectRace(
            definition.id
          );
        }
      );
    }

    return card;
  }

  // ==========================================================
  // Select Race
  // ==========================================================

  private selectRace(
    raceId: string
  ): void {

    if (
      !this.isRaceSelectable(
        raceId
      )
    ) {
      return;
    }

    this.selectedRaceId =
      raceId;

    if (
      this.progressionState
    ) {

      this.progressionState =
        this.cloneState(
          this.progressionState
        );

      this.progressionState.selectedRaceId =
        raceId;
    }

    this.render();
  }

  // ==========================================================
  // Race Progress Lookup
  // ==========================================================

  private getRaceProgress(
    state: RaceProgressionState,
    raceId: string
  ): RaceProgress {

    const found =
      state.races.find(
        (
          progress
        ) =>
          progress.raceId ===
          raceId
      );

    if (
      found
    ) {

      return found;
    }

    // --------------------------------------------------------
    // Safe fallback
    // --------------------------------------------------------

    return {

      raceId,

      status:
        "locked",

      completionCount:
        0,

      winCount:
        0,

      bestPosition:
        0,

      bestTime:
        0,

      bossDefeated:
        false
    };
  }

  // ==========================================================
  // Is Race Selectable
  // ==========================================================

  private isRaceSelectable(
    raceId: string
  ): boolean {

    if (
      !raceId ||
      !this.progressionState
    ) {

      return false;
    }

    const progress =
      this.getRaceProgress(
        this.progressionState,
        raceId
      );

    return (
      progress.status ===
        "available" ||
      progress.status ===
        "completed"
    );
  }

  // ==========================================================
  // Start Race
  // ==========================================================

  private readonly handleStart =
    (): void => {

      if (
        !this.isRaceSelectable(
          this.selectedRaceId
        )
      ) {

        return;
      }

      const raceId =
        this.selectedRaceId;

      this.startButton.disabled =
        true;

      this.onStartRace(
        raceId
      );
    };

  // ==========================================================
  // Back
  // ==========================================================

  private readonly handleBack =
    (): void => {

      this.hide();

      this.onBack();
    };

  // ==========================================================
  // Show
  // ==========================================================

  public show(): void {

    this.root.style.display =
      "flex";

    this.root.classList.add(
      "is-visible"
    );

    this.render();
  }

  // ==========================================================
  // Hide
  // ==========================================================

  public hide(): void {

    this.root.classList.remove(
      "is-visible"
    );

    this.root.style.display =
      "none";
  }

  // ==========================================================
  // Visibility
  // ==========================================================

  public isVisible(): boolean {

    return (
      this.root.style.display !==
      "none"
    );
  }

  // ==========================================================
  // Reset
  // ==========================================================

  public reset(): void {

    this.selectedRaceId =
      "";

    this.progressionState =
      null;

    this.startButton.disabled =
      true;

    this.selectedRaceLabel.textContent =
      "SELECT A RACE";

    this.list.innerHTML =
      "";

    this.hide();
  }

  // ==========================================================
  // Format Time
  // ==========================================================

  private formatTime(
    seconds: number
  ): string {

    if (
      !Number.isFinite(
        seconds
      ) ||
      seconds <= 0
    ) {

      return "—";
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    const remaining =
      seconds % 60;

    return (
      `${minutes}:` +
      `${remaining
        .toFixed(2)
        .padStart(5, "0")}`
    );
  }

  // ==========================================================
  // Clone State
  // ==========================================================

  private cloneState(
    state: RaceProgressionState
  ): RaceProgressionState {

    return {

      version:
        state.version,

      unlockedLevel:
        state.unlockedLevel,

      selectedRaceId:
        state.selectedRaceId,

      racesCompleted:
        state.racesCompleted,

      racesWon:
        state.racesWon,

      bossesDefeated:
        state.bossesDefeated,

      races:
        state.races.map(
          (
            race
          ) => ({
            raceId:
              race.raceId,

            status:
              race.status,

            completionCount:
              race.completionCount,

            winCount:
              race.winCount,

            bestPosition:
              race.bestPosition,

            bestTime:
              race.bestTime,

            bossDefeated:
              race.bossDefeated
          })
        )
    };
  }

  // ==========================================================
  // Styles
  // ==========================================================

  private injectStyles(): void {

    const styleId =
      "racenova-campaign-menu-styles";

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
    .racenova-campaign-menu {
        position: fixed;
        inset: 0;
        z-index: 11000;

        display: none;
        flex-direction: column;

        box-sizing: border-box;

        width: 100%;
        height: 100%;

        padding:
          28px
          20px
          24px;

        overflow-y: auto;

        background:
          linear-gradient(
            180deg,
            rgba(5, 8, 14, 0.98),
            rgba(10, 13, 22, 0.98)
          );

        color: #ffffff;

        font-family:
          Arial,
          Helvetica,
          sans-serif;

        -webkit-tap-highlight-color:
          transparent;
      }

      .racenova-campaign-menu.is-visible {
        display: flex;
      }

      .racenova-campaign-header {
        width: 100%;
        max-width: 760px;

        margin:
          0 auto
          20px;

        text-align: center;
      }

      .racenova-campaign-title {
        font-size: 34px;
        font-weight: 900;

        letter-spacing:
          0.14em;

        line-height: 1;
      }

      .racenova-campaign-subtitle {
        margin-top: 10px;

        font-size: 13px;

        line-height: 1.5;

        opacity: 0.72;
      }

      .racenova-campaign-progress {
        display: inline-block;

        margin-top: 14px;

        padding:
          7px
          14px;

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.16
          );

        border-radius: 999px;

        background:
          rgba(
            255,
            255,
            255,
            0.05
          );

        font-size: 12px;
        font-weight: 800;

        letter-spacing:
          0.08em;
      }

      .racenova-campaign-list {
        display: grid;

        grid-template-columns:
          repeat(
            auto-fit,
            minmax(
              250px,
              1fr
            )
          );

        gap: 12px;

        width: 100%;
        max-width: 900px;

        margin:
          0 auto;
      }

      .racenova-campaign-card {
        position: relative;

        display: flex;
        flex-direction: column;

        min-height: 150px;

        padding:
          17px;

        box-sizing: border-box;

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.14
          );

        border-radius: 16px;

        background:
          rgba(
            255,
            255,
            255,
            0.055
          );

        color: #ffffff;

        text-align: left;

        cursor: pointer;

        transition:
          transform
          0.16s ease,
          border-color
          0.16s ease,
          background
          0.16s ease;
      }

      .racenova-campaign-card:hover {
        transform:
          translateY(-2px);

        background:
          rgba(
            255,
            255,
            255,
            0.09
          );
      }

      .racenova-campaign-card:active {
        transform:
          translateY(0);
      }

      .racenova-campaign-card.is-selected {
        border-color:
          rgba(
            255,
            255,
            255,
            0.72
          );

        background:
          rgba(
            255,
            255,
            255,
            0.11
          );
      }

      .racenova-campaign-card.state-locked {
        opacity: 0.48;

        cursor:
          not-allowed;
      }

      .racenova-campaign-card-level {
        font-size: 10px;
        font-weight: 900;

        letter-spacing:
          0.12em;

        opacity: 0.6;
      }

      .racenova-campaign-card-name {
        margin-top: 7px;

        font-size: 21px;
        font-weight: 900;

        letter-spacing:
          0.02em;
      }

      .racenova-campaign-card-description {
        margin-top: 7px;

        min-height: 34px;

        font-size: 11px;

        line-height: 1.45;

        opacity: 0.68;
      }

      .racenova-campaign-card-status {
        margin-top: 10px;

        font-size: 11px;
        font-weight: 900;

        letter-spacing:
          0.06em;
      }

      .racenova-campaign-card-stats {
        margin-top: 7px;

        font-size: 9px;

        line-height: 1.4;

        opacity: 0.55;
      }

      .racenova-campaign-boss {
        position: absolute;

        top: 12px;
        right: 12px;

        padding:
          5px
          8px;

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.28
          );

        border-radius: 6px;

        font-size: 9px;
        font-weight: 900;

        letter-spacing:
          0.1em;
      }

      .racenova-campaign-selected {
        width: 100%;
        max-width: 900px;

        margin:
          18px auto
          12px;

        min-height: 18px;

        text-align: center;

        font-size: 12px;
        font-weight: 900;

        letter-spacing:
          0.08em;

        opacity: 0.78;
      }

      .racenova-campaign-footer {
        display: flex;

        gap: 10px;

        width: 100%;
        max-width: 900px;

        margin:
          0 auto;

        padding-top: 4px;
      }

      .racenova-campaign-back,
      .racenova-campaign-start {
        flex: 1;

        min-height: 52px;

        border:
          1px solid
          rgba(
            255,
            255,
            255,
            0.18
          );

        border-radius: 12px;

        font-size: 13px;
        font-weight: 900;

        letter-spacing:
          0.08em;

        cursor: pointer;

        transition:
          transform
          0.14s ease,
          opacity
          0.14s ease,
          background
          0.14s ease;
      }

      .racenova-campaign-back {
        background:
          rgba(
            255,
            255,
            255,
            0.05
          );

        color: #ffffff;
      }

      .racenova-campaign-start {
        background:
          rgba(
            255,
            255,
            255,
            0.16
          );

        color: #ffffff;
      }

      .racenova-campaign-back:hover,
      .racenova-campaign-start:hover:not(:disabled) {
        background:
          rgba(
            255,
            255,
            255,
            0.22
          );

        transform:
          translateY(-1px);
      }

      .racenova-campaign-start:disabled {
        opacity: 0.35;

        cursor:
          not-allowed;
      }

      @media (
        max-width: 560px
      ) {

        .racenova-campaign-menu {
          padding:
            22px
            14px
            18px;
        }

        .racenova-campaign-title {
          font-size: 28px;
        }

        .racenova-campaign-list {
          grid-template-columns:
            1fr;
        }

        .racenova-campaign-card {
          min-height: 138px;
        }

        .racenova-campaign-footer {
          position: sticky;

          bottom: 0;

          padding-top: 10px;
          padding-bottom: 2px;

          background:
            linear-gradient(
              180deg,
              transparent,
              rgba(
                10,
                13,
                22,
                0.98
              ) 25%
            );
        }
      }

    `;
    
    // ==========================================================
  // Dispose
  // ==========================================================

  public dispose(): void {

    this.backButton.removeEventListener(
      "click",
      this.handleBack
    );

    this.startButton.removeEventListener(
      "click",
      this.handleStart
    );

    this.root.remove();
  }
}
