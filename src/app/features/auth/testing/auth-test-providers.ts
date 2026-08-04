import { Provider } from '@angular/core';
import { provideFormlyCore } from '@ngx-formly/core';
import { withFormlyPrimeNG } from '@ngx-formly/primeng';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, throwError } from 'rxjs';

import { FormlyEmailFieldComponent } from '../../../lib/formly/fields/formly-email-field/formly-email-field.component';
import { FormlyPasswordFieldComponent } from '../../../lib/formly/fields/formly-password-field/formly-password-field.component';
import { AuthError, AuthErrorCode } from '../contracts/auth-error.contract';
import { AuthRepositoryContract } from '../contracts/auth-repository.contract';
import { ForgotPasswordRequest } from '../contracts/forgot-password-request.contract';
import { LoginRequest } from '../contracts/login-request.contract';
import { ResetPasswordRequest } from '../contracts/reset-password-request.contract';
import { AuthSession } from '../models/auth-session.model';
import { TEST_AUTH_SESSION } from './auth-test-data';

export interface FakeAuthRepositoryConfig {
  loginResult?: () => Observable<AuthSession>;
  forgotPasswordResult?: () => Observable<void>;
  resetPasswordResult?: () => Observable<void>;
  validateResetTokenResult?: () => Observable<void>;
  restoreSessionResult?: () => Observable<AuthSession | null>;
  logoutResult?: () => Observable<void>;
}

export class FakeAuthRepository implements AuthRepositoryContract {
  readonly calls = {
    login: 0,
    forgotPassword: 0,
    resetPassword: 0,
    validateResetToken: 0,
    restoreSession: 0,
    logout: 0,
  };

  constructor(private readonly config: FakeAuthRepositoryConfig = {}) {}

  login(_request: LoginRequest): Observable<AuthSession> {
    this.calls.login += 1;
    return (this.config.loginResult ?? (() => of(TEST_AUTH_SESSION)))();
  }

  forgotPassword(_request: ForgotPasswordRequest): Observable<void> {
    this.calls.forgotPassword += 1;
    return (this.config.forgotPasswordResult ?? (() => of(undefined)))();
  }

  resetPassword(_request: ResetPasswordRequest): Observable<void> {
    this.calls.resetPassword += 1;
    return (this.config.resetPasswordResult ?? (() => of(undefined)))();
  }

  validateResetToken(_token: string): Observable<void> {
    this.calls.validateResetToken += 1;
    return (this.config.validateResetTokenResult ?? (() => of(undefined)))();
  }

  restoreSession(): Observable<AuthSession | null> {
    this.calls.restoreSession += 1;
    return (this.config.restoreSessionResult ?? (() => of(null)))();
  }

  logout(): Observable<void> {
    this.calls.logout += 1;
    return (this.config.logoutResult ?? (() => of(undefined)))();
  }
}

export function provideFakeAuthRepository(config?: FakeAuthRepositoryConfig): Provider {
  return { provide: AuthRepositoryContract, useValue: new FakeAuthRepository(config) };
}

export function authErrorOf(code: AuthErrorCode): Observable<never> {
  return throwError(() => ({ code }) satisfies AuthError);
}

/**
 * Minimal stand-in for TranslateService covering only what Formly form
 * models call (`instant`/`stream`) — avoids spinning up TestBed/HttpLoader
 * for pure model unit tests. Returns the key itself so tests can assert on it.
 */
export function createFakeTranslateService(): TranslateService {
  return {
    instant: (key: string) => key,
    stream: (key: string) => of(key),
  } as unknown as TranslateService;
}

/**
 * Mirrors the Formly registration in auth.routes.ts (PrimeNG types + the
 * custom `password`/`email` types) so page/component specs that render real
 * `<formly-form>`/`formly-field-password`/`formly-field-email` markup don't
 * need to duplicate it.
 */
export function provideAuthFormlyTesting(): Provider[] {
  return [
    provideFormlyCore(withFormlyPrimeNG()),
    provideFormlyCore({
      types: [
        { name: 'password', component: FormlyPasswordFieldComponent, wrappers: ['form-field'] },
        { name: 'email', component: FormlyEmailFieldComponent, wrappers: ['form-field'] },
      ],
    }),
  ];
}
