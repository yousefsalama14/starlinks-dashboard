import { TestBed } from '@angular/core/testing';

import { TEST_AUTH_SESSION } from '../testing/auth-test-data';
import { AuthStateService } from './auth-state.service';

describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStateService);
  });

  it('starts checking, unauthenticated-shaped, with no user/session/error', () => {
    expect(service.status()).toBe('checking');
    expect(service.isChecking()).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.user()).toBeNull();
    expect(service.session()).toBeNull();
    expect(service.errorCode()).toBeNull();
    expect(service.isSubmitting()).toBe(false);
  });

  it('setAuthenticated stores the session, derives the user, and clears any error', () => {
    service.setErrorCode('AUTH_INVALID_CREDENTIALS');
    service.setAuthenticated(TEST_AUTH_SESSION);

    expect(service.status()).toBe('authenticated');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.session()).toEqual(TEST_AUTH_SESSION);
    expect(service.user()).toEqual(TEST_AUTH_SESSION.user);
    expect(service.errorCode()).toBeNull();
  });

  it('setUnauthenticated clears the session and user, optionally with an error code', () => {
    service.setAuthenticated(TEST_AUTH_SESSION);
    service.setUnauthenticated('AUTH_INVALID_CREDENTIALS');

    expect(service.status()).toBe('unauthenticated');
    expect(service.isAuthenticated()).toBe(false);
    expect(service.session()).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.errorCode()).toBe('AUTH_INVALID_CREDENTIALS');
  });

  it('setSubmitting toggles independently of status', () => {
    service.setSubmitting(true);
    expect(service.isSubmitting()).toBe(true);
    service.setSubmitting(false);
    expect(service.isSubmitting()).toBe(false);
  });

  it('setErrorCode sets and clears without touching status or session', () => {
    service.setAuthenticated(TEST_AUTH_SESSION);
    service.setErrorCode('AUTH_UNKNOWN_ERROR');
    expect(service.errorCode()).toBe('AUTH_UNKNOWN_ERROR');
    expect(service.status()).toBe('authenticated');

    service.setErrorCode(null);
    expect(service.errorCode()).toBeNull();
  });
});
