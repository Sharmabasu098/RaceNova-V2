import {
  getCorsHeaders,
  jsonResponse
} from "./http";

import {
  verifyGoogleCredential
} from "./googleVerification";

import type {
  GoogleVerificationRequest,
  GoogleVerificationResponse
} from "./types";

interface Env {
  GOOGLE_CLIENT_ID: string;
  ALLOWED_ORIGIN: string;
}

function isGoogleVerificationRequest(
  value: unknown
): value is GoogleVerificationRequest {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Record<string, unknown>;

  return (
    typeof candidate.credential ===
      "string" &&
    candidate.credential.trim().length > 0
  );
}

export default {
  async fetch(
    request: Request,
    env: Env
  ): Promise<Response> {
    const corsHeaders =
      getCorsHeaders(
        request,
        env.ALLOWED_ORIGIN
      );

    const url =
      new URL(request.url);

    const pathname =
      url.pathname.replace(/\/+$/, "");

    /*
     * CORS preflight
     */
    if (
      request.method === "OPTIONS"
    ) {
      return new Response(
        null,
        {
          status: 204,
          headers: corsHeaders
        }
      );
    }

    /*
     * Google verification endpoint
     */
    if (
      pathname !==
      "/api/auth/google/verify"
    ) {
      const response:
        GoogleVerificationResponse = {
        success: false,
        error: "INVALID_REQUEST"
      };

      return jsonResponse(
        response,
        404,
        corsHeaders
      );
    }

    /*
     * Only POST is accepted.
     */
    if (
      request.method !== "POST"
    ) {
      const response:
        GoogleVerificationResponse = {
        success: false,
        error: "METHOD_NOT_ALLOWED"
      };

      return jsonResponse(
        response,
        405,
        corsHeaders
      );
    }

    try {
      const body: unknown =
        await request.json();

      /*
       * Validate request body.
       */
      if (
        !isGoogleVerificationRequest(
          body
        )
      ) {
        const response:
          GoogleVerificationResponse = {
          success: false,
          error: "INVALID_REQUEST"
        };

        return jsonResponse(
          response,
          400,
          corsHeaders
        );
      }

      /*
       * Server-side Google ID-token verification.
       */
      const identity =
        await verifyGoogleCredential(
          body.credential,
          env.GOOGLE_CLIENT_ID
        );

      /*
       * Return only verified identity data.
       * The original Google credential is
       * never returned.
       */
      const response:
        GoogleVerificationResponse = {
        success: true,
        provider: "google",
        identity
      };

      return jsonResponse(
        response,
        200,
        corsHeaders
      );
    } catch {
      /*
       * Do not expose verification internals
       * or Google token details to the client.
       */
      const response:
        GoogleVerificationResponse = {
        success: false,
        error:
          "INVALID_GOOGLE_CREDENTIAL"
      };

      return jsonResponse(
        response,
        401,
        corsHeaders
      );
    }
  }
};
