import { Observable } from 'rxjs';

import { AuthSession } from '../models/auth-session.model';
import { ForgotPasswordRequest } from './forgot-password-request.contract';
import { LoginRequest } from './login-request.contract';
import { ResetPasswordRequest } from './reset-password-request.contract';

/**
 * Abstraction the rest of the app (facade, guards, pages) depends on.
 * Swapping `MockAuthRepository` for a future `HttpAuthRepository` only
 * requires changing the DI provider — see auth-repository.token.ts.
 */
export abstract class AuthRepositoryContract {
  abstract login(request: LoginRequest): Observable<AuthSession>;

  abstract forgotPassword(request: ForgotPasswordRequest): Observable<void>;

  abstract resetPassword(request: ResetPasswordRequest): Observable<void>;

  /** Checks token validity without consuming it, so the reset page can show an error before the user types anything. */
  abstract validateResetToken(token: string): Observable<void>;

  abstract restoreSession(): Observable<AuthSession | null>;

  abstract logout(): Observable<void>;
}
