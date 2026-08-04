import { AuthUser } from '../models/auth-user.model';

/**
 * Development-only mock credentials — there is no backend behind this feature.
 * DEV LOGIN: admin@starlinks.com / Starlinks@123
 * Never rendered or prefilled in the UI; documented here and in docs/authentication.md only.
 */
export const MOCK_AUTH_CREDENTIALS = {
  email: 'admin@starlinks.com',
  password: 'Starlinks@123',
} as const;

export const MOCK_AUTH_USER: AuthUser = {
  id: 'mock-user-1',
  email: MOCK_AUTH_CREDENTIALS.email,
  displayName: 'Starlinks Admin',
  roles: ['admin'],
};

/** One consistent, short mock latency for every simulated repository call. */
export const MOCK_AUTH_DELAY_MS = 600;

export const MOCK_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

/**
 * Dev-facing mock reset tokens (see docs/authentication.md):
 * - `valid`: usable once, then becomes consumed (acts invalid afterward).
 * - `expired`: always rejected as AUTH_RESET_TOKEN_EXPIRED.
 * - anything else (e.g. `mock-invalid-reset-token`): rejected as AUTH_RESET_TOKEN_INVALID.
 */
export const MOCK_RESET_TOKENS = {
  valid: 'mock-valid-reset-token',
  expired: 'mock-expired-reset-token',
} as const;
