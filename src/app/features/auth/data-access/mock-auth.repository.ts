import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';

import { AuthError, AuthErrorCode } from '../contracts/auth-error.contract';
import { AuthRepositoryContract } from '../contracts/auth-repository.contract';
import { ForgotPasswordRequest } from '../contracts/forgot-password-request.contract';
import { LoginRequest } from '../contracts/login-request.contract';
import { ResetPasswordRequest } from '../contracts/reset-password-request.contract';
import {
  MOCK_AUTH_CREDENTIALS,
  MOCK_AUTH_DELAY_MS,
  MOCK_AUTH_USER,
  MOCK_RESET_TOKENS,
  MOCK_SESSION_DURATION_MS,
} from '../constants/mock-auth.constants';
import { isPasswordPolicySatisfied } from '../constants/password-policy.constants';
import { AuthSession } from '../models/auth-session.model';
import { AuthStorageService } from './auth-storage.service';

type ResetTokenStatus = 'active' | 'expired' | 'consumed';

/**
 * Simulates a backend with RxJS instead of a real HTTP call. Not registered
 * with `providedIn: 'root'` on purpose — it must only be reachable through
 * the `AuthRepositoryContract` DI binding (see auth-repository.token.ts), so
 * nothing outside data-access/ can depend on the mock concretely.
 */
@Injectable()
export class MockAuthRepository implements AuthRepositoryContract {
  private readonly authStorage = inject(AuthStorageService);

  private readonly resetTokenStatus = new Map<string, ResetTokenStatus>([
    [MOCK_RESET_TOKENS.valid, 'active'],
    [MOCK_RESET_TOKENS.expired, 'expired'],
  ]);

  login(request: LoginRequest): Observable<AuthSession> {
    return this.simulateLatency().pipe(
      switchMap(() => {
        const email = request.email.trim().toLowerCase();
        const isValid =
          email === MOCK_AUTH_CREDENTIALS.email &&
          request.password === MOCK_AUTH_CREDENTIALS.password;
        return isValid ? of(this.createSession(email)) : this.fail('AUTH_INVALID_CREDENTIALS');
      }),
    );
  }

  forgotPassword(_request: ForgotPasswordRequest): Observable<void> {
    return this.simulateLatency().pipe(
      map(() => {
        // Re-arm the demo token on every request so manual/local testing can repeat the flow.
        this.resetTokenStatus.set(MOCK_RESET_TOKENS.valid, 'active');
      }),
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.simulateLatency().pipe(
      switchMap(() => {
        const tokenError = this.checkTokenStatus(request.token);
        if (tokenError) {
          return this.fail(tokenError);
        }

        const policyFailed =
          request.newPassword !== request.confirmPassword ||
          !isPasswordPolicySatisfied(request.newPassword);
        if (policyFailed) {
          return this.fail('AUTH_PASSWORD_POLICY_FAILED');
        }

        this.resetTokenStatus.set(request.token, 'consumed');
        return of(undefined);
      }),
    );
  }

  validateResetToken(token: string): Observable<void> {
    return this.simulateLatency().pipe(
      switchMap(() => {
        const tokenError = this.checkTokenStatus(token);
        return tokenError ? this.fail(tokenError) : of(undefined);
      }),
    );
  }

  restoreSession(): Observable<AuthSession | null> {
    return this.simulateLatency().pipe(map(() => this.authStorage.read()));
  }

  logout(): Observable<void> {
    return this.simulateLatency().pipe(map(() => undefined));
  }

  private simulateLatency(): Observable<unknown> {
    return of(null).pipe(delay(MOCK_AUTH_DELAY_MS));
  }

  /** Read-only status check shared by resetPassword (which also consumes) and validateResetToken (which doesn't). */
  private checkTokenStatus(
    token: string,
  ): Extract<AuthErrorCode, 'AUTH_RESET_TOKEN_INVALID' | 'AUTH_RESET_TOKEN_EXPIRED'> | null {
    const status = this.resetTokenStatus.get(token);
    if (!status) {
      return 'AUTH_RESET_TOKEN_INVALID';
    }
    if (status === 'expired') {
      return 'AUTH_RESET_TOKEN_EXPIRED';
    }
    if (status === 'consumed') {
      return 'AUTH_RESET_TOKEN_INVALID';
    }
    return null;
  }

  private createSession(email: string): AuthSession {
    return {
      user: { ...MOCK_AUTH_USER, email },
      accessToken: `mock-access-token.${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}`,
      expiresAt: new Date(Date.now() + MOCK_SESSION_DURATION_MS).toISOString(),
    };
  }

  private fail(code: AuthErrorCode): Observable<never> {
    return throwError(() => ({ code }) satisfies AuthError);
  }
}
