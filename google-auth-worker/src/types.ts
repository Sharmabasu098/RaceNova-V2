export interface GoogleVerificationRequest {
  credential: string;
}

export interface VerifiedGoogleIdentity {
  subject: string;
  displayName: string;
}

export interface GoogleVerificationSuccess {
  success: true;
  provider: "google";
  identity: VerifiedGoogleIdentity;
}

export type GoogleVerificationErrorCode =
  | "INVALID_REQUEST"
  | "INVALID_GOOGLE_CREDENTIAL"
  | "METHOD_NOT_ALLOWED"
  | "INTERNAL_VERIFICATION_ERROR";

export interface GoogleVerificationFailure {
  success: false;
  error: GoogleVerificationErrorCode;
}

export type GoogleVerificationResponse =
  | GoogleVerificationSuccess
  | GoogleVerificationFailure;

export interface GoogleIdTokenPayload {
  iss?: string;
  aud?: string | string[];
  sub?: string;
  exp?: number;
  iat?: number;
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
}
