# Authentication (mock-first)

> **This is not production authentication.** There is no backend. Mock
> credentials, mock tokens, and mock sessions only. Do not reuse this code
> path, the mock secrets, or the storage format as-is against a real identity
> provider.

## Routes

| Route                      | Guard        | Notes                                                         |
| -------------------------- | ------------ | ------------------------------------------------------------- |
| `/auth/login`              | `guestGuard` | Supports `?returnUrl=<internal-path>`                         |
| `/auth/forgot-password`    | `guestGuard` |                                                               |
| `/auth/reset-password`     | `guestGuard` | Requires `?token=<reset-token>`                               |
| `/app/**` (existing shell) | `authGuard`  | Redirects to `/auth/login?returnUrl=...` when unauthenticated |

`guestGuard` sends an already-authenticated user to `/app/home` (see
`DEFAULT_AUTHENTICATED_ROUTE` in `constants/auth-routes.constants.ts`).
`authGuard` and `guestGuard` both call `AuthFacade.initialize()`, which is
idempotent — the session is only ever restored once per app lifetime,
however many guards/components call it.

## Development credentials

```
Email:    admin@starlinks.com
Password: Starlinks@123
```

Defined in `src/app/features/auth/constants/mock-auth.constants.ts`. Never
shown in the UI — only usable by typing them into the login form yourself,
or in tests.

## Mock reset tokens

| Token                                             | Behaviour                                                                               |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `mock-valid-reset-token`                          | Valid once; resets password then becomes consumed (a second use is rejected as invalid) |
| `mock-expired-reset-token`                        | Always rejected as `AUTH_RESET_TOKEN_EXPIRED`                                           |
| any other string, e.g. `mock-invalid-reset-token` | Rejected as `AUTH_RESET_TOKEN_INVALID`                                                  |

Try it: `/auth/reset-password?token=mock-valid-reset-token`.

Submitting the forgot-password form re-arms `mock-valid-reset-token` (sets
it back to active) so the happy path can be repeated locally without
restarting the app.

## Architecture

```
Page component (Login / ForgotPassword / ResetPassword)
        │  owns: FormGroup, Formly model instance, submission state
        ▼
AuthFacade                                    ◄── guards also call this
        │  owns: orchestration, error normalization, in-flight de-duplication
        ▼
AuthRepositoryContract  (abstract class — the DI seam)
        │
        ▼
MockAuthRepository  ──uses──► AuthStorageService (read-only, for restoreSession)
```

Everything above `AuthRepositoryContract` (pages, Formly models, guards,
`AuthStateService`, layout, dialogs, translation keys) depends only on the
abstract contract, never on `MockAuthRepository` directly. The binding
lives in one place: `data-access/auth-repository.token.ts`.

`AuthStateService` is a plain signal store (status/session/errorCode/
isSubmitting); `AuthFacade` is the only thing allowed to write to it, and
the only thing pages/guards are allowed to inject.

`AuthStorageService` is the only code in the app that touches
`localStorage`/`sessionStorage` for auth. Both `AuthFacade` (saving on
login, clearing on logout) and `MockAuthRepository` (reading during
`restoreSession`, simulating "the backend remembers your session" the way
a real `HttpAuthRepository` would read a stored token) go through it.

## How Remember Me works

- Storage key: `starlinks.auth.session` (see
  `constants/auth-storage.constants.ts`), used in **either**
  `localStorage` (rememberMe = true) **or** `sessionStorage`
  (rememberMe = false) — never both.
- On every successful login, `AuthStorageService.save()` clears both
  locations first, then writes to just the one that matches the current
  `rememberMe` value, so a stale copy never lingers in the other storage.
- On read, `localStorage` wins if (through manual tampering) both
  happen to be populated.
- Passwords and reset tokens are never persisted — only
  `{ user, accessToken, expiresAt }`.
- A stored session past its `expiresAt` is treated as absent and removed
  the next time it's read.

## Security limitations of this mock

- `accessToken` is an opaque, locally-generated string
  (`mock-access-token.<timestamp>.<random>`) — **not** a JWT, not signed,
  not verifiable, carries no real claims.
- There is no real password hashing, no rate limiting, no CSRF/XSS
  hardening beyond what Angular provides by default, and no real session
  revocation — logout just clears local storage and local state.
- "Forgot password" never sends an email. Nothing external happens.
- Token/session data lives in plain `localStorage`/`sessionStorage`,
  readable by any script in the page — acceptable for a mock, not for a
  real deployment (a real implementation would likely prefer an
  httpOnly cookie set by the backend).

## Backend handoff

Replacing the mock with a real backend should touch **only**:

1. **A new `HttpAuthRepository`** implementing `AuthRepositoryContract`
   (same 6 methods: `login`, `forgotPassword`, `resetPassword`,
   `validateResetToken`, `restoreSession`, `logout`), doing real
   `HttpClient` calls and mapping backend error responses to the existing
   `AuthErrorCode` union.
2. **`data-access/auth-repository.token.ts`** — change
   `provideAuthRepository()` to bind `AuthRepositoryContract` to
   `HttpAuthRepository` instead of `MockAuthRepository`.
3. **Environment configuration** — add an `environments/` setup (none
   exists yet in this app) for the API base URL, consumed only by
   `HttpAuthRepository`.
4. **Token refresh strategy**, if the real backend uses short-lived
   access tokens — an `HttpInterceptor` reading the session via
   `AuthStorageService`/`AuthFacade`, added alongside the new repository.
5. **DTO mapping** inside `HttpAuthRepository` — translating backend
   request/response shapes into the existing `LoginRequest`,
   `AuthSession`, `AuthUser`, etc.

None of the following should need to change: page components, Formly
models, `AuthLayoutComponent`/`AuthBrandPanelComponent`/`AuthFooterComponent`,
`AuthFeedbackDialogComponent`, `PasswordRequirementsComponent`, guards,
`AuthFacade`'s public API, `AuthStateService`, or the translation keys.

### Expected future backend endpoints (suggested)

```
POST /auth/login              { email, password, rememberMe } -> { user, accessToken, expiresAt }
POST /auth/forgot-password    { email }                       -> 204 (always, regardless of account existence)
POST /auth/reset-password     { token, newPassword }          -> 204
GET  /auth/reset-password/:token  (validate only, no side effect) -> 200 | 404 | 410 (expired)
GET  /auth/session            (Authorization: Bearer <token>)  -> { user, accessToken, expiresAt } | 401
POST /auth/logout             (Authorization: Bearer <token>)  -> 204
```

### Expected future error mapping

| HTTP outcome                            | `AuthErrorCode`               |
| --------------------------------------- | ----------------------------- |
| 401 on login                            | `AUTH_INVALID_CREDENTIALS`    |
| 404 on reset-password validate/submit   | `AUTH_RESET_TOKEN_INVALID`    |
| 410 (or expired flag) on reset-password | `AUTH_RESET_TOKEN_EXPIRED`    |
| 422 password policy violation           | `AUTH_PASSWORD_POLICY_FAILED` |
| anything else / network failure         | `AUTH_UNKNOWN_ERROR`          |

`HttpAuthRepository` should only ever throw one of these codes (see
`contracts/auth-error.contract.ts`) — never a raw HTTP error or backend
message — so the UI's existing "no raw error text" behavior keeps working
unchanged.
