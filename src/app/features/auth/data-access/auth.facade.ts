import { Injectable, inject } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import { AuthError, AuthErrorCode } from '../contracts/auth-error.contract';
import { AuthRepositoryContract } from '../contracts/auth-repository.contract';
import { ForgotPasswordRequest } from '../contracts/forgot-password-request.contract';
import { LoginRequest } from '../contracts/login-request.contract';
import { ResetPasswordRequest } from '../contracts/reset-password-request.contract';
import { AuthStateService } from './auth-state.service';
import { AuthStorageService } from './auth-storage.service';

type ExclusiveOperationKey = 'login' | 'forgotPassword' | 'resetPassword' | 'logout';

/**
 * The only thing pages, guards, and the app shell talk to. Owns
 * orchestration (repository + storage + state); never touches browser
 * storage directly itself.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly repository = inject(AuthRepositoryContract);
  private readonly state = inject(AuthStateService);
  private readonly storage = inject(AuthStorageService);

  readonly status = this.state.status;
  readonly user = this.state.user;
  readonly session = this.state.session;
  readonly isAuthenticated = this.state.isAuthenticated;
  readonly isChecking = this.state.isChecking;
  readonly isSubmitting = this.state.isSubmitting;
  readonly errorCode = this.state.errorCode;

  private initialization$: Observable<void> | null = null;
  private readonly inFlight = new Map<ExclusiveOperationKey, Observable<void>>();

  /** Restores the session once per app lifetime; later callers replay the same result. */
  initialize(): Observable<void> {
    if (!this.initialization$) {
      this.initialization$ = this.repository.restoreSession().pipe(
        tap((session) => {
          if (session) {
            this.state.setAuthenticated(session);
          } else {
            this.storage.clear();
            this.state.setUnauthenticated();
          }
        }),
        map(() => undefined),
        catchError(() => {
          this.storage.clear();
          this.state.setUnauthenticated();
          return of(undefined);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.initialization$;
  }

  login(request: LoginRequest): Observable<void> {
    return this.runExclusive('login', () => {
      this.state.setSubmitting(true);
      this.state.setErrorCode(null);
      return this.repository.login(request).pipe(
        tap((session) => {
          this.storage.save(session, request.rememberMe);
          this.state.setAuthenticated(session);
        }),
        map(() => undefined),
        catchError((error: unknown) => {
          // A failed login definitively means "not authenticated" regardless of prior status.
          this.state.setUnauthenticated(this.normalizeErrorCode(error));
          return throwError(() => error);
        }),
        finalize(() => this.state.setSubmitting(false)),
      );
    });
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<void> {
    return this.runExclusive('forgotPassword', () => {
      this.state.setSubmitting(true);
      this.state.setErrorCode(null);
      return this.repository.forgotPassword(request).pipe(
        catchError((error: unknown) => {
          this.state.setErrorCode(this.normalizeErrorCode(error));
          return throwError(() => error);
        }),
        finalize(() => this.state.setSubmitting(false)),
      );
    });
  }

  resetPassword(request: ResetPasswordRequest): Observable<void> {
    return this.runExclusive('resetPassword', () => {
      this.state.setSubmitting(true);
      this.state.setErrorCode(null);
      return this.repository.resetPassword(request).pipe(
        catchError((error: unknown) => {
          this.state.setErrorCode(this.normalizeErrorCode(error));
          return throwError(() => error);
        }),
        finalize(() => this.state.setSubmitting(false)),
      );
    });
  }

  logout(): Observable<void> {
    return this.runExclusive('logout', () =>
      this.repository.logout().pipe(
        catchError(() => of(undefined)),
        tap(() => {
          this.storage.clear();
          this.state.setUnauthenticated();
        }),
      ),
    );
  }

  /**
   * Page-specific check (not a form submission), so it intentionally does
   * not touch isSubmitting/errorCode — the reset-password page owns how it
   * reacts to this.
   */
  validateResetToken(token: string): Observable<void> {
    return this.repository.validateResetToken(token);
  }

  clearError(): void {
    this.state.setErrorCode(null);
  }

  /** Collapses concurrent calls for the same operation onto a single in-flight execution. */
  private runExclusive(
    key: ExclusiveOperationKey,
    factory: () => Observable<void>,
  ): Observable<void> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }
    const shared$ = factory().pipe(
      finalize(() => this.inFlight.delete(key)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.inFlight.set(key, shared$);
    return shared$;
  }

  private normalizeErrorCode(error: unknown): AuthErrorCode {
    return this.isAuthError(error) ? error.code : 'AUTH_UNKNOWN_ERROR';
  }

  private isAuthError(value: unknown): value is AuthError {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Partial<AuthError>).code === 'string'
    );
  }
}
