import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AUTH_SESSION_STORAGE_KEY } from '../constants/auth-storage.constants';
import { MOCK_AUTH_CREDENTIALS, MOCK_RESET_TOKENS } from '../constants/mock-auth.constants';
import { AuthError } from '../contracts/auth-error.contract';
import { TEST_AUTH_SESSION, TEST_EXPIRED_AUTH_SESSION } from '../testing/auth-test-data';
import { AuthStorageService } from './auth-storage.service';
import { MockAuthRepository } from './mock-auth.repository';

describe('MockAuthRepository', () => {
  let repository: MockAuthRepository;
  let storage: AuthStorageService;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [MockAuthRepository] });
    repository = TestBed.inject(MockAuthRepository);
    storage = TestBed.inject(AuthStorageService);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('login', () => {
    it('resolves a session for valid credentials', async () => {
      const session = await firstValueFrom(
        repository.login({
          email: MOCK_AUTH_CREDENTIALS.email,
          password: MOCK_AUTH_CREDENTIALS.password,
          rememberMe: false,
        }),
      );
      expect(session.user.email).toBe(MOCK_AUTH_CREDENTIALS.email);
      expect(session.accessToken).toBeTruthy();
      expect(Date.parse(session.expiresAt)).toBeGreaterThan(Date.now());
    });

    it('accepts the email case-insensitively and trims whitespace', async () => {
      const session = await firstValueFrom(
        repository.login({
          email: `  ${MOCK_AUTH_CREDENTIALS.email.toUpperCase()}  `,
          password: MOCK_AUTH_CREDENTIALS.password,
          rememberMe: false,
        }),
      );
      expect(session.user.email).toBe(MOCK_AUTH_CREDENTIALS.email);
    });

    it('rejects an invalid password with a typed error code', async () => {
      await expect(
        firstValueFrom(
          repository.login({
            email: MOCK_AUTH_CREDENTIALS.email,
            password: 'wrong',
            rememberMe: false,
          }),
        ),
      ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' } satisfies AuthError);
    });

    it('rejects an unknown email with a typed error code', async () => {
      await expect(
        firstValueFrom(
          repository.login({
            email: 'nobody@starlinks.com',
            password: MOCK_AUTH_CREDENTIALS.password,
            rememberMe: false,
          }),
        ),
      ).rejects.toMatchObject({ code: 'AUTH_INVALID_CREDENTIALS' });
    });
  });

  describe('forgotPassword', () => {
    it('always succeeds for a syntactically valid email', async () => {
      await expect(
        firstValueFrom(repository.forgotPassword({ email: 'someone@starlinks.com' })),
      ).resolves.toBeUndefined();
    });
  });

  describe('resetPassword', () => {
    it('succeeds with the valid mock token and a policy-compliant password', async () => {
      await expect(
        firstValueFrom(
          repository.resetPassword({
            token: MOCK_RESET_TOKENS.valid,
            newPassword: 'NewPass@123',
            confirmPassword: 'NewPass@123',
          }),
        ),
      ).resolves.toBeUndefined();
    });

    it('rejects an unrecognized token as invalid', async () => {
      await expect(
        firstValueFrom(
          repository.resetPassword({
            token: 'mock-invalid-reset-token',
            newPassword: 'NewPass@123',
            confirmPassword: 'NewPass@123',
          }),
        ),
      ).rejects.toMatchObject({ code: 'AUTH_RESET_TOKEN_INVALID' });
    });

    it('rejects the expired token', async () => {
      await expect(
        firstValueFrom(
          repository.resetPassword({
            token: MOCK_RESET_TOKENS.expired,
            newPassword: 'NewPass@123',
            confirmPassword: 'NewPass@123',
          }),
        ),
      ).rejects.toMatchObject({ code: 'AUTH_RESET_TOKEN_EXPIRED' });
    });

    it('rejects a password that fails the policy', async () => {
      await expect(
        firstValueFrom(
          repository.resetPassword({
            token: MOCK_RESET_TOKENS.valid,
            newPassword: 'weak',
            confirmPassword: 'weak',
          }),
        ),
      ).rejects.toMatchObject({ code: 'AUTH_PASSWORD_POLICY_FAILED' });
    });

    it('rejects mismatched passwords even with a valid token', async () => {
      await expect(
        firstValueFrom(
          repository.resetPassword({
            token: MOCK_RESET_TOKENS.valid,
            newPassword: 'NewPass@123',
            confirmPassword: 'Different@123',
          }),
        ),
      ).rejects.toMatchObject({ code: 'AUTH_PASSWORD_POLICY_FAILED' });
    });

    it('consumes the token so a second attempt fails as invalid', async () => {
      await firstValueFrom(
        repository.resetPassword({
          token: MOCK_RESET_TOKENS.valid,
          newPassword: 'NewPass@123',
          confirmPassword: 'NewPass@123',
        }),
      );
      await expect(
        firstValueFrom(
          repository.resetPassword({
            token: MOCK_RESET_TOKENS.valid,
            newPassword: 'NewPass@123',
            confirmPassword: 'NewPass@123',
          }),
        ),
      ).rejects.toMatchObject({ code: 'AUTH_RESET_TOKEN_INVALID' });
    });
  });

  describe('validateResetToken', () => {
    it('succeeds for the valid mock token', async () => {
      await expect(
        firstValueFrom(repository.validateResetToken(MOCK_RESET_TOKENS.valid)),
      ).resolves.toBeUndefined();
    });

    it('rejects an unrecognized token as invalid', async () => {
      await expect(
        firstValueFrom(repository.validateResetToken('mock-invalid-reset-token')),
      ).rejects.toMatchObject({
        code: 'AUTH_RESET_TOKEN_INVALID',
      });
    });

    it('rejects the expired token', async () => {
      await expect(
        firstValueFrom(repository.validateResetToken(MOCK_RESET_TOKENS.expired)),
      ).rejects.toMatchObject({
        code: 'AUTH_RESET_TOKEN_EXPIRED',
      });
    });

    it('does not consume the token — a later resetPassword call can still use it', async () => {
      await firstValueFrom(repository.validateResetToken(MOCK_RESET_TOKENS.valid));
      await expect(
        firstValueFrom(
          repository.resetPassword({
            token: MOCK_RESET_TOKENS.valid,
            newPassword: 'NewPass@123',
            confirmPassword: 'NewPass@123',
          }),
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('logout', () => {
    it('completes without error', async () => {
      await expect(firstValueFrom(repository.logout())).resolves.toBeUndefined();
    });
  });

  describe('restoreSession', () => {
    it('returns null when nothing is stored', async () => {
      await expect(firstValueFrom(repository.restoreSession())).resolves.toBeNull();
    });

    it('returns the session stored via AuthStorageService', async () => {
      storage.save(TEST_AUTH_SESSION, true);
      await expect(firstValueFrom(repository.restoreSession())).resolves.toEqual(TEST_AUTH_SESSION);
    });

    it('returns null for an expired stored session', async () => {
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(TEST_EXPIRED_AUTH_SESSION));
      await expect(firstValueFrom(repository.restoreSession())).resolves.toBeNull();
    });
  });
});
