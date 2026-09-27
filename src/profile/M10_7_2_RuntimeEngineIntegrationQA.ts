/**
 * ============================================================
 * RaceNova V2
 * M10.7.2 — Runtime Engine Integration QA
 * TEMPORARY QA
 * ============================================================
 *
 * Purpose:
 * - Verify RaceNovaEngine creates the runtime profile
 * - Verify the persisted gameplay save is valid
 * - Verify the persisted profile is valid
 * - Verify PlayerSaveData remains authoritative
 * - Verify profile.saveData matches the gameplay save
 *
 * IMPORTANT:
 * - Temporary QA only
 * - Remove after PASS verification
 * - No gameplay logic
 * - No profile architecture changes
 * ============================================================
 */

import type {
  RaceNovaEngine
} from "../core/RaceNovaEngine";

import {
  isValidPlayerProfile
} from "./PlayerProfile";

import {
  isValidPlayerSaveData,
  isSupportedPlayerSaveVersion
} from "../save/PlayerSaveData";

const GAMEPLAY_SAVE_KEY =
  "racenova-v2-player-save";

const PROFILE_SAVE_KEY =
  "racenova-v2-player-profile";

const LOCAL_PROFILE_ID =
  "racenova-local-player";

export function runM10_7_2_RuntimeEngineIntegrationQA(
  engine: RaceNovaEngine
): void {

  try {

    const engineCreated =
      !!engine &&
      typeof engine.start === "function";

    const gameplayRaw =
      window.localStorage.getItem(
        GAMEPLAY_SAVE_KEY
      );

    const profileRaw =
      window.localStorage.getItem(
        PROFILE_SAVE_KEY
      );

    const gameplaySave =
      gameplayRaw
        ? JSON.parse(gameplayRaw)
        : null;

    const profile =
      profileRaw
        ? JSON.parse(profileRaw)
        : null;

    const gameplaySaveValid =
      isValidPlayerSaveData(
        gameplaySave
      );

    const profileValid =
      isValidPlayerProfile(
        profile
      );

    const profileSaveValid =
      profileValid &&
      isValidPlayerSaveData(
        profile.saveData
      );

    const profileVersionValid =
      profileSaveValid &&
      isSupportedPlayerSaveVersion(
        profile.saveData.version
      );

    const profileIdValid =
      profileValid &&
      profile.profileId ===
        LOCAL_PROFILE_ID;

    const profileTimestampsValid =
      profileValid &&
      typeof profile.createdAt ===
        "number" &&
      Number.isFinite(
        profile.createdAt
      ) &&
      profile.createdAt > 0 &&
      typeof profile.updatedAt ===
        "number" &&
      Number.isFinite(
        profile.updatedAt
      ) &&
      profile.updatedAt > 0;

    const saveSynchronized =
      gameplaySaveValid &&
      profileSaveValid &&
      JSON.stringify(
        profile.saveData
      ) ===
      JSON.stringify(
        gameplaySave
      );

    const pass =
      engineCreated &&
      gameplaySaveValid &&
      profileValid &&
      profileSaveValid &&
      profileVersionValid &&
      profileIdValid &&
      profileTimestampsValid &&
      saveSynchronized;

    console.log(
      "[RaceNova] M10.7.2 Runtime Engine Integration QA",
      {
        engineCreated,
        gameplaySaveValid,
        profileValid,
        profileSaveValid,
        profileVersionValid,
        profileIdValid,
        profileTimestampsValid,
        saveSynchronized,
        pass
      }
    );

    window.alert(
      pass
        ? "M10.7.2 Runtime Engine Integration QA — PASS ✅"
        : "M10.7.2 Runtime Engine Integration QA — FAIL ❌"
    );

  } catch (
    error
  ) {

    console.error(
      "[RaceNova] M10.7.2 Runtime Engine Integration QA failed:",
      error
    );

    window.alert(
      "M10.7.2 Runtime Engine Integration QA — FAIL ❌"
    );
  }
}
