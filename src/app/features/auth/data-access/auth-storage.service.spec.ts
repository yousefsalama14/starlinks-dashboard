import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AUTH_SESSION_STORAGE_KEY } from '../constants/auth-storage.constants';
import { TEST_AUTH_SESSION, TEST_EXPIRED_AUTH_SESSION } from '../testing/auth-test-data';
import { AuthStorageService } from './auth-storage.service';

describe('AuthStorageService', () => {
  let service: AuthStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStorageService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('saves to local storage when rememberMe is true', () => {
    service.save(TEST_AUTH_SESSION, true);
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toContain(TEST_AUTH_SESSION.accessToken);
    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('saves to session storage when rememberMe is false', () => {
    service.save(TEST_AUTH_SESSION, false);
    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toContain(
      TEST_AUTH_SESSION.accessToken,
    );
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('reads a session persisted in local storage', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_AUTH_SESSION));
    expect(service.read()).toEqual(TEST_AUTH_SESSION);
  });

  it('reads a session persisted in session storage', () => {
    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_AUTH_SESSION));
    expect(service.read()).toEqual(TEST_AUTH_SESSION);
  });

  it('prefers local storage when both locations are populated', () => {
    const other = { ...TEST_AUTH_SESSION, accessToken: 'session-storage-token' };
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_AUTH_SESSION));
    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(other));
    expect(service.read()?.accessToken).toBe(TEST_AUTH_SESSION.accessToken);
  });

  it('clears stale duplicates from the other storage location on save', () => {
    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_AUTH_SESSION));
    service.save(TEST_AUTH_SESSION, true);
    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
  });

  it('clears both storage locations', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_AUTH_SESSION));
    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_AUTH_SESSION));
    service.clear();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('treats malformed JSON as absent and removes it', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, '{not-json');
    expect(service.read()).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('treats a malformed session object as absent and removes it', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(service.read()).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('treats an expired session as absent and removes it', () => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_EXPIRED_AUTH_SESSION));
    expect(service.read()).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('does not touch storage when not running in a browser platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const serverService = TestBed.inject(AuthStorageService);
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_AUTH_SESSION));

    expect(serverService.read()).toBeNull();

    serverService.save(TEST_AUTH_SESSION, true);
    serverService.clear();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBe(JSON.stringify(TEST_AUTH_SESSION));
  });
});
