import { AuthSession } from '../models/auth-session.model';
import { AuthUser } from '../models/auth-user.model';
import { ForgotPasswordRequest } from '../contracts/forgot-password-request.contract';
import { LoginRequest } from '../contracts/login-request.contract';
import { ResetPasswordRequest } from '../contracts/reset-password-request.contract';

export const TEST_AUTH_USER: AuthUser = {
  id: 'test-user-1',
  email: 'test.user@starlinks.com',
  displayName: 'Test User',
  roles: ['admin'],
};

export const TEST_AUTH_SESSION: AuthSession = {
  user: TEST_AUTH_USER,
  accessToken: 'test-access-token',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
};

export const TEST_EXPIRED_AUTH_SESSION: AuthSession = {
  ...TEST_AUTH_SESSION,
  expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
};

export const TEST_LOGIN_REQUEST: LoginRequest = {
  email: TEST_AUTH_USER.email,
  password: 'Starlinks@123',
  rememberMe: false,
};

export const TEST_FORGOT_PASSWORD_REQUEST: ForgotPasswordRequest = {
  email: TEST_AUTH_USER.email,
};

export const TEST_RESET_PASSWORD_REQUEST: ResetPasswordRequest = {
  token: 'test-reset-token',
  newPassword: 'NewPass@123',
  confirmPassword: 'NewPass@123',
};
