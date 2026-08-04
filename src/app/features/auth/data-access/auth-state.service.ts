import { Injectable, computed, signal } from '@angular/core';

import { AuthErrorCode } from '../contracts/auth-error.contract';
import { AuthSession } from '../models/auth-session.model';
import { AuthStatus } from '../models/auth-state.model';
import { AuthUser } from '../models/auth-user.model';

/**
 * Pure state container — signals only, no repository/storage access. The
 * facade is the only writer; everything else only reads the public signals.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly _status = signal<AuthStatus>('checking');
  private readonly _session = signal<AuthSession | null>(null);
  private readonly _errorCode = signal<AuthErrorCode | null>(null);
  private readonly _isSubmitting = signal(false);

  readonly status = this._status.asReadonly();
  readonly session = this._session.asReadonly();
  readonly errorCode = this._errorCode.asReadonly();
  readonly isSubmitting = this._isSubmitting.asReadonly();

  readonly user = computed<AuthUser | null>(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => this._status() === 'authenticated');
  readonly isChecking = computed(() => this._status() === 'checking');

  setAuthenticated(session: AuthSession): void {
    this._session.set(session);
    this._status.set('authenticated');
    this._errorCode.set(null);
  }

  setUnauthenticated(errorCode: AuthErrorCode | null = null): void {
    this._session.set(null);
    this._status.set('unauthenticated');
    this._errorCode.set(errorCode);
  }

  setSubmitting(isSubmitting: boolean): void {
    this._isSubmitting.set(isSubmitting);
  }

  setErrorCode(errorCode: AuthErrorCode | null): void {
    this._errorCode.set(errorCode);
  }
}
