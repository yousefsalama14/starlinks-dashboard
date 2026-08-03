import { AuthErrorCode } from '../contracts/auth-error.contract';
import { AuthSession } from './auth-session.model';
import { AuthUser } from './auth-user.model';

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  readonly status: AuthStatus;
  readonly user: AuthUser | null;
  readonly session: AuthSession | null;
  readonly errorCode: AuthErrorCode | null;
}
