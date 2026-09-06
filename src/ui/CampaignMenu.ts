/**
 * ============================================================
 * RaceNova V2
 * Campaign Menu
 * M7.9.9
 * ============================================================
 *
 * Responsibilities:
 * - Display campaign races
 * - Show locked / available / completed states
 * - Show campaign progress
 * - Select a race
 * - Start selected race
 * - Return to Main Menu
 *
 * IMPORTANT:
 * - No Three.js dependency
 * - No localStorage dependency
 * - No gameplay logic
 * - RaceDefinitions remain authoritative
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
  onBack: () => void;

  onStartRace: (
    raceId: string
  ) => void;
}

// ============================================================
// Campaign Menu
// ============================================================

export class CampaignMenu {

  private readonly root: HTMLDivElement;

  private readonly list: HTMLDivElement;

  private readonly progressLabel: HTMLDivElement;

  private readonly selectedLabel: HTMLDivElement;

  private readonly backButton: HTMLButtonElement;

  private readonly startButton: HTMLButtonElement;

  private readonly onBack: () => void;

  private readonly onStartRace: (
    raceId: string
  ) => void;

  private progressionState:
    RaceProgressionState | null = null;

  private selectedRaceId = "";

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

    const title =
      document.createElement(
        "div"
      );

    title.className =
      "racenova-campaign-title";

    title.textContent =
      "CAMPAIGN";

    const subtitle =
      document.createElement(
        "div"
      );

    subtitle.className =
      "racenova-campaign-subtitle";

    subtitle.textContent =
      "Complete races and defeat every rival.";

    this.progressLabel =
      document.createElement(
        "div"
      );

    this.progressLabel.className =
      "racenova-campaign-progress";

    this.progressLabel.textContent =
      "0 / 8 CLEARED";

    header.appendChild(
      title
    );

    header.appendChild(
      subtitle
    );

    header.appendChild(
      this.progressLabel
    );

    // --------------------------------------------------------
    // Race List
    // --------------------------------------------------------

    this.list =
      document.createElement(
        "div"
      );

    this.list.className =
      "racenova-campaign-list";

    // --------------------------------------------------------
    // Selected Race
    // --------------------------------------------------------

    this.selectedLabel =
      document.createElement(
        "div"
      );

    this.selectedLabel.className =
      "racenova-campaign-selected";

    this.selectedLabel.textContent =
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
      this.selectedLabel
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
    // Style
    // --------------------------------------------------------

    this.injectStyles();

    // --------------------------------------------------------
    // Initial state
    // --------------------------------------------------------

    this.hide();
  }

  // ==========================================================
  // Set Progress
  // ==========================================================

  public setProgress(
    state: RaceProgressionState
  ): void {

    this.progressionState =
      state;

    const currentSelection =
      state.selectedRaceId;

    if (
      this.isSelectable(
        currentSelection
      )
    ) {

      this.selectedRaceId =
        currentSelection;

    } else {

      const firstAvailable =
        RACE_DEFINITIONS.find(
          (
            definition
          ) => {

            const progress =
              this.getProgress(
                definition.id
              );

            return (
              progress.status ===
                "available" ||
              progress.status ===
                "completed"
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

      this.selectedLabel.textContent =
        "SELECT A RACE";

      this.startButton.disabled =
        true;

      return;
    }

    // --------------------------------------------------------
    // Completed count
    // --------------------------------------------------------

    let completedCount = 0;

    for (
      const definition
      of RACE_DEFINITIONS
    ) {

      const progress =
        this.getProgress(
          definition.id
        );

      if (
        progress.status ===
        "completed"
      ) {

        completedCount++;
      }
    }

    this.progressLabel.textContent =
      `${completedCount} / ${RACE_DEFINITIONS.length} CLEARED`;

    // --------------------------------------------------------
    // Cards
    // --------------------------------------------------------

    for (
      const definition
      of RACE_DEFINITIONS
    ) {

      const progress =
        this.getProgress(
          definition.id
        );

      const card =
        this.createCard(
          definition,
          progress
        );

      this.list.appendChild(
        card
      );
    }

    // --------------------------------------------------------
    // Selected label
    // --------------------------------------------------------

    const selected =
      RACE_DEFINITIONS.find(
        (
          definition
        ) =>
          definition.id ===
          this.selectedRaceId
      );

    if (selected) {

      this.selectedLabel.textContent =
        `SELECTED: ${selected.name}`;

    } else {

      this.selectedLabel.textContent =
        "SELECT A RACE";
    }

    // --------------------------------------------------------
    // Start button
    // --------------------------------------------------------

    this.startButton.disabled =
      !this.isSelectable(
        this.selectedRaceId
      );
  }

  // ==========================================================
  // Create Card
  // ==========================================================

  private createCard(
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
      "RaceNova campaign race.";

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
        "LOCKED";

    } else if (
      progress.status ===
      "completed"
    ) {

      if (
        definition.isBoss &&
        progress.bossDefeated
      ) {

        status.textContent =
          "BOSS DEFEATED";

      } else {

        status.textContent =
          "COMPLETED";
      }

    } else {

      status.textContent =
        "AVAILABLE";
    }

    // --------------------------------------------------------
    // Statistics
    // --------------------------------------------------------

    const stats =
      document.createElement(
        "div"
      );

    stats.className =
      "racenova-campaign-card-stats";

    if (
      progress.status ===
      "locked"
    ) {

      stats.textContent =
        "Complete the previous race.";

    } else {

      stats.textContent =
        `WINS ${progress.winCount}` +
        `  •  RUNS ${progress.completionCount}`;

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
    // Boss Badge
    // --------------------------------------------------------

    if (
      definition.isBoss
    ) {

      const boss =
        document.createElement(
          "div"
        );

      boss.className =
        "racenova-campaign-boss";

      boss.textContent =
        "BOSS";

      card.appendChild(
        boss
      );
    }

    // --------------------------------------------------------
    // Assemble card
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
    // Click
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
  // Get Progress
  // ==========================================================

  private getProgress(
    raceId: string
  ): RaceProgress {

    if (
      !this.progressionState
    ) {

      return this.defaultProgress(
        raceId
      );
    }

    const progress =
      this.progressionState.races.find(
        (
          item
        ) =>
          item.raceId ===
          raceId
      );

    if (progress) {

      return progress;
    }

    return this.defaultProgress(
      raceId
    );
  }

  // ==========================================================
  // Default Progress
  // ==========================================================

  private defaultProgress(
    raceId: string
  ): RaceProgress {

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
  // Select Race
  // ==========================================================

  private selectRace(
    raceId: string
  ): void {

    if (
      !this.isSelectable(
        raceId
      )
    ) {

      return;
    }

    this.selectedRaceId =
      raceId;

    this.render();
  }

  // ==========================================================
  // Selectable Check
  // ==========================================================

  private isSelectable(
    raceId: string
  ): boolean {

    if (
      !raceId ||
      !this.progressionState
    ) {

      return false;
    }

    const progress =
      this.getProgress(
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
        !this.isSelectable(
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

    this.render();
  }

  // ==========================================================
  // Hide
  // ==========================================================

  public hide(): void {

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

    this.list.innerHTML =
      "";

    this.selectedLabel.textContent =
      "SELECT A RACE";

    this.progressLabel.textContent =
      "0 / 8 CLEARED";

    this.startButton.disabled =
      true;

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

        padding: 24px 16px;

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
      }

      .racenova-campaign-header {
        width: 100%;
        max-width: 900px;

        margin: 0 auto 18px;

        text-align: center;
      }

      .racenova-campaign-title {
        font-size: 32px;
        font-weight: 900;

        letter-spacing: 0.14em;
      }

      .racenova-campaign-subtitle {
        margin-top: 8px;

        font-size: 12px;

        opacity: 0.65;
      }

      .racenova-campaign-progress {
        display: inline-block;

        margin-top: 12px;

        padding: 7px 13px;

        border:
          1px solid
          rgba(255, 255, 255, 0.18);

        border-radius: 999px;

        background:
          rgba(255, 255, 255, 0.05);

        font-size: 11px;
        font-weight: 900;

        letter-spacing: 0.08em;
      }

      .racenova-campaign-list {
        display: grid;

        grid-template-columns:
          repeat(
            auto-fit,
         minmax(
              240px,
              1fr
            )
          );

        gap: 12px;

        width: 100%;
        max-width: 900px;

        margin: 0 auto;
      }

      .racenova-campaign-card {
        position: relative;

        display: flex;
        flex-direction: column;

        min-height: 145px;

        box-sizing: border-box;

        padding: 16px;

        border:
          1px solid
          rgba(255, 255, 255, 0.14);

        border-radius: 15px;

        background:
          rgba(255, 255, 255, 0.055);

        color: #ffffff;

        text-align: left;

        cursor: pointer;

        transition:
          transform 0.15s ease,
          background 0.15s ease,
          border-color 0.15s ease;
      }

      .racenova-campaign-card:hover {
        transform:
          translateY(-2px);

        background:
          rgba(255, 255, 255, 0.09);
      }

      .racenova-campaign-card.is-selected {
        border-color:
          rgba(255, 255, 255, 0.75);

        background:
          rgba(255, 255, 255, 0.12);
      }

      .racenova-campaign-card.state-locked {
        opacity: 0.42;

        cursor: not-allowed;
      }

      .racenova-campaign-card-level {
        font-size: 9px;
        font-weight: 900;

        letter-spacing: 0.12em;

        opacity: 0.55;
      }

      .racenova-campaign-card-name {
        margin-top: 7px;

        font-size: 20px;
        font-weight: 900;
      }

      .racenova-campaign-card-description {
        margin-top: 7px;

        min-height: 32px;

        font-size: 11px;

        line-height: 1.4;

        opacity: 0.65;
      }

      .racenova-campaign-card-status {
        margin-top: 9px;

        font-size: 10px;
        font-weight: 900;

        letter-spacing: 0.08em;
      }

      .racenova-campaign-card-stats {
        margin-top: 6px;

        font-size: 9px;

        line-height: 1.4;

        opacity: 0.5;
      }

      .racenova-campaign-boss {
        position: absolute;

        top: 11px;
        right: 11px;

        padding: 5px 8px;

        border:
          1px solid
          rgba(255, 255, 255, 0.3);

        border-radius: 6px;

        font-size: 8px;
        font-weight: 900;

        letter-spacing: 0.1em;
      }

      .racenova-campaign-selected {
        width: 100%;
        max-width: 900px;

        min-height: 18px;

        margin: 16px auto 10px;

        text-align: center;

        font-size: 11px;
        font-weight: 900;

        letter-spacing: 0.08em;

        opacity: 0.75;
      }

      .racenova-campaign-footer {
        display: flex;

        gap: 10px;

        width: 100%;
        max-width: 900px;

        margin: 0 auto;
      }

      .racenova-campaign-back,
      .racenova-campaign-start {
        flex: 1;

        min-height: 50px;

        border:
          1px solid
          rgba(255, 255, 255, 0.18);

        border-radius: 11px;

        font-size: 12px;
        font-weight: 900;

        letter-spacing: 0.08em;

        cursor: pointer;
      }

      .racenova-campaign-back {
        background:
          rgba(255, 255, 255, 0.05);

        color: #ffffff;
      }

      .racenova-campaign-start {
        background:
          rgba(255, 255, 255, 0.15);

        color: #ffffff;
      }

      .racenova-campaign-start:disabled {
        opacity: 0.35;

        cursor: not-allowed;
      }

      @media (
        max-width: 560px
      ) {

        .racenova-campaign-menu {
          padding:
            20px 12px;
        }

        .racenova-campaign-title {
          font-size: 27px;
        }

        .racenova-campaign-list {
          grid-template-columns: 1fr;
        }

        .racenova-campaign-card {
          min-height: 135px;
        }
      }
    `;

    document.head.appendChild(
      style
    );
  }

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

  
