import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { AUTH_SESSION_STORAGE_KEY } from '../constants/auth-storage.constants';
import { AuthSession } from '../models/auth-session.model';
import { AuthUser } from '../models/auth-user.model';

/**
 * The only place in the app allowed to touch localStorage/sessionStorage for
 * auth. Everything else (facade, repository, pages) goes through this.
 */
@Injectable({ providedIn: 'root' })
export class AuthStorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  save(session: AuthSession, rememberMe: boolean): void {
    if (!this.isBrowser) {
      return;
    }
    // Clear both locations first so a stale duplicate never lingers in the
    // storage area this login isn't using.
    this.clear();
    const target = rememberMe ? window.localStorage : window.sessionStorage;
    target.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  read(): AuthSession | null {
    if (!this.isBrowser) {
      return null;
    }
    // Persistent storage wins if both happen to hold a session.
    return this.readFrom(window.localStorage) ?? this.readFrom(window.sessionStorage);
  }

  clear(): void {
    if (!this.isBrowser) {
      return;
    }
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }

  private readFrom(storage: Storage): AuthSession | null {
    const raw = storage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      storage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }

    if (!this.isAuthSession(parsed) || this.isExpired(parsed)) {
      storage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return null;
    }

    return parsed;
  }

  private isAuthSession(value: unknown): value is AuthSession {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const candidate = value as Partial<AuthSession>;
    if (typeof candidate.accessToken !== 'string' || typeof candidate.expiresAt !== 'string') {
      return false;
    }
    return this.isAuthUser(candidate.user);
  }

  private isAuthUser(value: unknown): value is AuthUser {
    if (typeof value !== 'object' || value === null) {
      return false;
    }
    const candidate = value as Partial<AuthUser>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.email === 'string' &&
      typeof candidate.displayName === 'string' &&
      Array.isArray(candidate.roles)
    );
  }

  private isExpired(session: AuthSession): boolean {
    const expiresAtMs = Date.parse(session.expiresAt);
    return Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now();
  }
}
