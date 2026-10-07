/**
 * ============================================================
 * RaceNova V2
 * Account Storage Key Builder
 * M11.8.7
 * ============================================================
 *
 * Responsibilities:
 * - Build deterministic account-scoped save keys
 * - Build deterministic account-scoped profile keys
 *
 * IMPORTANT:
 * - No authentication dependency
 * - No SDK dependency
 * - No browser storage access
 * - Base64URL is encoding, not encryption
 * - Account IDs must be non-empty
 * ============================================================
 */

const SAVE_KEY_PREFIX =
  "racenova-v2:save:";

const PROFILE_KEY_PREFIX =
  "racenova-v2:profile:";

export class AccountStorageKeyBuilder {

  private constructor() {
    // Static utility class.
  }

  public static buildSaveKey(
    accountId: string
  ): string {

    return (
      SAVE_KEY_PREFIX +
      AccountStorageKeyBuilder.encodeAccountId(
        accountId
      )
    );
  }

  public static buildProfileKey(
    accountId: string
  ): string {

    return (
      PROFILE_KEY_PREFIX +
      AccountStorageKeyBuilder.encodeAccountId(
        accountId
      )
    );
  }

  private static encodeAccountId(
    accountId: string
  ): string {

    if (
      typeof accountId !== "string" ||
      accountId.trim().length === 0
    ) {
      throw new Error(
        "AccountStorageKeyBuilder: accountId must be a non-empty string."
      );
    }

    const bytes =
      new TextEncoder().encode(
        accountId
      );

    let binary = "";

    for (
      const byte of bytes
    ) {
      binary += String.fromCharCode(
        byte
      );
    }

    const base64 =
      btoa(binary);

    return base64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }
}
