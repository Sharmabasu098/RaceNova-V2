export enum AuthenticationProvider {
  PI = "pi",
  GOOGLE = "google"
}

export enum AuthenticationStatus {
  SIGNED_OUT = "signed-out",
  AUTHENTICATING = "authenticating",
  AUTHENTICATED = "authenticated",
  ERROR = "error"
}

export interface AuthenticationIdentity {
  subject: string;
  provider: AuthenticationProvider;
  displayName: string;
}

export interface AuthenticationSession {
  status: AuthenticationStatus;
  identity: AuthenticationIdentity | null;
}

export interface AuthenticationResult {
  success: boolean;
  session: AuthenticationSession;
  message?: string;
}

export interface AuthenticationBoundary {
  signIn(): Promise<AuthenticationResult>;
  signOut(): Promise<AuthenticationResult>;
  getSession(): AuthenticationSession;
  isAuthenticated(): boolean;
}
