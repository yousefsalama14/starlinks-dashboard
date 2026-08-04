export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_RESET_TOKEN_INVALID'
  | 'AUTH_RESET_TOKEN_EXPIRED'
  | 'AUTH_PASSWORD_POLICY_FAILED'
  | 'AUTH_UNKNOWN_ERROR';

export interface AuthError {
  readonly code: AuthErrorCode;
}
