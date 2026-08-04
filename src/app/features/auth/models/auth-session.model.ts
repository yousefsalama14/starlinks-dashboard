import { AuthUser } from './auth-user.model';

/**
 * Shape returned by a successful login/session-restore. This doubles as the
 * repository's "login response" contract — kept as one type to avoid two
 * identical interfaces drifting apart.
 */
export interface AuthSession {
  readonly user: AuthUser;
  readonly accessToken: string;
  readonly expiresAt: string;
}
