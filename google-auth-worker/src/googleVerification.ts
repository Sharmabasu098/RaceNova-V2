import {
  createRemoteJWKSet,
  jwtVerify
} from "jose";

import type {
  GoogleIdTokenPayload,
  VerifiedGoogleIdentity
} from "./types";

const GOOGLE_ISSUER =
  "https://accounts.google.com";

const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/oauth2/v3/certs";

const GOOGLE_JWKS =
  createRemoteJWKSet(
    new URL(GOOGLE_JWKS_URL)
  );

export async function verifyGoogleCredential(
  credential: string,
  clientId: string
): Promise<VerifiedGoogleIdentity> {
  if (!credential.trim()) {
    throw new Error(
      "Missing Google credential"
    );
  }

  if (!clientId.trim()) {
    throw new Error(
      "Missing Google client ID"
    );
  }

  const { payload } =
    await jwtVerify<GoogleIdTokenPayload>(
      credential,
      GOOGLE_JWKS,
      {
        issuer: GOOGLE_ISSUER,
        audience: clientId
      }
    );

  if (
    typeof payload.sub !== "string" ||
    payload.sub.trim().length === 0
  ) {
    throw new Error(
      "Missing Google subject"
    );
  }

  if (
    typeof payload.exp !== "number"
  ) {
    throw new Error(
      "Missing Google expiration"
    );
  }

  if (
    payload.exp <=
    Math.floor(Date.now() / 1000)
  ) {
    throw new Error(
      "Google credential expired"
    );
  }

  const displayName =
    typeof payload.name === "string" &&
    payload.name.trim().length > 0
      ? payload.name.trim()
      : "Google User";

  return {
    subject: payload.sub,
    displayName
  };
}
