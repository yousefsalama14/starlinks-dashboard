import { TestBed } from '@angular/core/testing';
import { Subject, firstValueFrom, of, throwError } from 'rxjs';

import { AUTH_SESSION_STORAGE_KEY } from '../constants/auth-storage.constants';
import { AuthRepositoryContract } from '../contracts/auth-repository.contract';
import { AuthSession } from '../models/auth-session.model';
import {
  FakeAuthRepository,
  authErrorOf,
  provideFakeAuthRepository,
} from '../testing/auth-test-providers';
import {
  TEST_AUTH_SESSION,
  TEST_FORGOT_PASSWORD_REQUEST,
  TEST_LOGIN_REQUEST,
  TEST_RESET_PASSWORD_REQUEST,
} from '../testing/auth-test-data';
import { AuthFacade } from './auth.facade';
import { AuthStorageService } from './auth-storage.service';

describe('AuthFacade', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  function setup(config?: Parameters<typeof provideFakeAuthRepository>[0]) {
    TestBed.configureTestingModule({ providers: [provideFakeAuthRepository(config)] });
    return {
      facade: TestBed.inject(AuthFacade),
      repository: TestBed.inject(AuthRepositoryContract) as FakeAuthRepository,
      storage: TestBed.inject(AuthStorageService),
    };
  }

  it('resolves to an unauthenticated state when there is no session to restore', async () => {
    const { facade } = setup({ restoreSessionResult: () => of(null) });
    await firstValueFrom(facade.initialize());
    expect(facade.status()).toBe('unauthenticated');
    expect(facade.isAuthenticated()).toBe(false);
    expect(facade.user()).toBeNull();
  });

  it('restores an authenticated session on initialize', async () => {
    const { facade } = setup({ restoreSessionResult: () => of(TEST_AUTH_SESSION) });
    await firstValueFrom(facade.initialize());
    expect(facade.status()).toBe('authenticated');
    expect(facade.isAuthenticated()).toBe(true);
    expect(facade.user()).toEqual(TEST_AUTH_SESSION.user);
  });

  it('treats an expired/rejected restored session as unauthenticated', async () => {
    const { facade } = setup({ restoreSessionResult: () => of(null) });
    await firstValueFrom(facade.initialize());
    expect(facade.isAuthenticated()).toBe(false);
  });

  it('only restores the session once, replaying the same result to later callers', async () => {
    const { facade, repository } = setup({ restoreSessionResult: () => of(TEST_AUTH_SESSION) });
    await firstValueFrom(facade.initialize());
    await firstValueFrom(facade.initialize());
    expect(repository.calls.restoreSession).toBe(1);
  });

  it('logs in successfully and persists the session according to rememberMe', async () => {
    const { facade, storage } = setup({ loginResult: () => of(TEST_AUTH_SESSION) });
    await firstValueFrom(facade.login({ ...TEST_LOGIN_REQUEST, rememberMe: true }));

    expect(facade.isAuthenticated()).toBe(true);
    expect(facade.user()).toEqual(TEST_AUTH_SESSION.user);
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
    expect(storage.read()).toEqual(TEST_AUTH_SESSION);
  });

  it('persists to session storage (not local) when rememberMe is false', async () => {
    const { facade } = setup({ loginResult: () => of(TEST_AUTH_SESSION) });
    await firstValueFrom(facade.login({ ...TEST_LOGIN_REQUEST, rememberMe: false }));

    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('normalizes a failed login into a typed error code and stays unauthenticated', async () => {
    const { facade } = setup({ loginResult: () => authErrorOf('AUTH_INVALID_CREDENTIALS') });

    await expect(firstValueFrom(facade.login(TEST_LOGIN_REQUEST))).rejects.toBeTruthy();
    expect(facade.isAuthenticated()).toBe(false);
    expect(facade.errorCode()).toBe('AUTH_INVALID_CREDENTIALS');
    expect(facade.isSubmitting()).toBe(false);
  });

  it('normalizes an unrecognized error shape to AUTH_UNKNOWN_ERROR', async () => {
    const { facade } = setup({ loginResult: () => throwError(() => new Error('boom')) });

    await expect(firstValueFrom(facade.login(TEST_LOGIN_REQUEST))).rejects.toBeTruthy();
    expect(facade.errorCode()).toBe('AUTH_UNKNOWN_ERROR');
  });

  it('flips isSubmitting during a login and back to false afterward', async () => {
    const loginSubject = new Subject<AuthSession>();
    const { facade } = setup({ loginResult: () => loginSubject.asObservable() });

    const result$ = facade.login(TEST_LOGIN_REQUEST);
    const done = firstValueFrom(result$);
    expect(facade.isSubmitting()).toBe(true);

    loginSubject.next(TEST_AUTH_SESSION);
    loginSubject.complete();
    await done;

    expect(facade.isSubmitting()).toBe(false);
  });

  it('prevents a second concurrent login from re-invoking the repository', async () => {
    const loginSubject = new Subject<AuthSession>();
    const { facade, repository } = setup({ loginResult: () => loginSubject.asObservable() });

    const first$ = facade.login(TEST_LOGIN_REQUEST);
    const firstDone = firstValueFrom(first$);
    const second$ = facade.login(TEST_LOGIN_REQUEST);
    const secondDone = firstValueFrom(second$);

    expect(repository.calls.login).toBe(1);

    loginSubject.next(TEST_AUTH_SESSION);
    loginSubject.complete();
    await Promise.all([firstDone, secondDone]);

    expect(facade.isAuthenticated()).toBe(true);
  });

  it('logs out, clearing state and storage', async () => {
    const { facade, storage } = setup({ loginResult: () => of(TEST_AUTH_SESSION) });
    await firstValueFrom(facade.login({ ...TEST_LOGIN_REQUEST, rememberMe: true }));
    expect(facade.isAuthenticated()).toBe(true);

    await firstValueFrom(facade.logout());

    expect(facade.isAuthenticated()).toBe(false);
    expect(facade.user()).toBeNull();
    expect(storage.read()).toBeNull();
  });

  it('handles repeated logout clicks without erroring', async () => {
    const { facade } = setup({ loginResult: () => of(TEST_AUTH_SESSION) });
    await firstValueFrom(facade.login(TEST_LOGIN_REQUEST));

    await Promise.all([firstValueFrom(facade.logout()), firstValueFrom(facade.logout())]);
    expect(facade.isAuthenticated()).toBe(false);
  });

  it('completes forgotPassword successfully without setting an error', async () => {
    const { facade } = setup();
    await expect(
      firstValueFrom(facade.forgotPassword(TEST_FORGOT_PASSWORD_REQUEST)),
    ).resolves.toBeUndefined();
    expect(facade.errorCode()).toBeNull();
    expect(facade.isSubmitting()).toBe(false);
  });

  it('completes resetPassword successfully without setting an error', async () => {
    const { facade } = setup();
    await expect(
      firstValueFrom(facade.resetPassword(TEST_RESET_PASSWORD_REQUEST)),
    ).resolves.toBeUndefined();
    expect(facade.errorCode()).toBeNull();
    expect(facade.isSubmitting()).toBe(false);
  });

  it('normalizes a resetPassword failure into a typed error code', async () => {
    const { facade } = setup({
      resetPasswordResult: () => authErrorOf('AUTH_RESET_TOKEN_EXPIRED'),
    });
    await expect(
      firstValueFrom(facade.resetPassword(TEST_RESET_PASSWORD_REQUEST)),
    ).rejects.toBeTruthy();
    expect(facade.errorCode()).toBe('AUTH_RESET_TOKEN_EXPIRED');
  });

  it('clears the error code on demand without touching status or session', async () => {
    const { facade } = setup({ loginResult: () => authErrorOf('AUTH_INVALID_CREDENTIALS') });
    await expect(firstValueFrom(facade.login(TEST_LOGIN_REQUEST))).rejects.toBeTruthy();
    expect(facade.errorCode()).toBe('AUTH_INVALID_CREDENTIALS');

    facade.clearError();
    expect(facade.errorCode()).toBeNull();
    expect(facade.status()).toBe('unauthenticated');
  });
});
