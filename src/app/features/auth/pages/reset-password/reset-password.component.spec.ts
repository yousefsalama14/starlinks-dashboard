import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { AuthRepositoryContract } from '../../contracts/auth-repository.contract';
import {
  FakeAuthRepository,
  authErrorOf,
  provideAuthFormlyTesting,
  provideFakeAuthRepository,
} from '../../testing/auth-test-providers';
import { ResetPasswordComponent } from './reset-password.component';

@Component({ template: '' })
class DummyComponent {}

function setInputValue(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelectorAll<HTMLInputElement>(selector);
  if (input.length === 0) {
    throw new Error(`No input found for selector ${selector}`);
  }
  input[0].value = value;
  input[0].dispatchEvent(new Event('input'));
}

describe('ResetPasswordComponent', () => {
  afterEach(() => {
    document.querySelectorAll('.p-dialog-mask').forEach((el) => el.remove());
  });

  async function createFixture(
    options: {
      token?: string | null;
      repositoryConfig?: Parameters<typeof provideFakeAuthRepository>[0];
    } = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideAuthFormlyTesting(),
        provideRouter([
          { path: 'auth/login', component: DummyComponent },
          { path: 'auth/forgot-password', component: DummyComponent },
        ]),
        provideFakeAuthRepository(options.repositoryConfig),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => {
                  if (key !== 'token') {
                    return null;
                  }
                  return 'token' in options ? options.token : 'valid-token';
                },
              },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return {
      fixture,
      repository: TestBed.inject(AuthRepositoryContract) as FakeAuthRepository,
      router: TestBed.inject(Router),
    };
  }

  function submit(fixture: ReturnType<typeof TestBed.createComponent<ResetPasswordComponent>>) {
    fixture.nativeElement
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }

  async function fillMatchingPasswords(
    fixture: ReturnType<typeof TestBed.createComponent<ResetPasswordComponent>>,
    password = 'NewPass@123',
  ) {
    const root: HTMLElement = fixture.nativeElement;
    setInputValue(root, '.formly-password-field input', password);
    fixture.detectChanges();
    await fixture.whenStable();
    const inputs = root.querySelectorAll<HTMLInputElement>('.formly-password-field input');
    inputs[1].value = password;
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('shows the invalid-link dialog immediately and disables the form when the token is missing', async () => {
    const { fixture } = await createFixture({ token: null });
    fixture.detectChanges();

    expect(document.body.textContent).toContain(
      'STARLINKS.AUTH.RESET_PASSWORD.INVALID_TOKEN_TITLE',
    );
    const root: HTMLElement = fixture.nativeElement;
    const submitButton = root.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submitButton?.disabled).toBe(true);
  });

  it('does not show a token error dialog for a present, valid token', async () => {
    const { fixture } = await createFixture({ token: 'mock-valid-reset-token' });
    expect(document.body.textContent).not.toContain(
      'STARLINKS.AUTH.RESET_PASSWORD.INVALID_TOKEN_TITLE',
    );
    expect(document.body.textContent).not.toContain(
      'STARLINKS.AUTH.RESET_PASSWORD.EXPIRED_TOKEN_TITLE',
    );
  });

  it('eagerly shows the invalid-link dialog and disables the form for a syntactically-present but unknown token', async () => {
    const { fixture, repository } = await createFixture({
      token: 'mock-invalid-reset-token',
      repositoryConfig: { validateResetTokenResult: () => authErrorOf('AUTH_RESET_TOKEN_INVALID') },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(repository.calls.validateResetToken).toBe(1);
    expect(repository.calls.resetPassword).toBe(0);
    expect(document.body.textContent).toContain(
      'STARLINKS.AUTH.RESET_PASSWORD.INVALID_TOKEN_TITLE',
    );
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });

  it('eagerly shows the expired-link dialog for an expired token before any submission', async () => {
    const { fixture } = await createFixture({
      token: 'mock-expired-reset-token',
      repositoryConfig: { validateResetTokenResult: () => authErrorOf('AUTH_RESET_TOKEN_EXPIRED') },
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.body.textContent).toContain(
      'STARLINKS.AUTH.RESET_PASSWORD.EXPIRED_TOKEN_TITLE',
    );
  });

  it('blocks submission for an empty password', async () => {
    const { fixture, repository } = await createFixture();
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.resetPassword).toBe(0);
  });

  it('blocks submission when the password fails the policy', async () => {
    const { fixture, repository } = await createFixture();
    await fillMatchingPasswords(fixture, 'weak');
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.resetPassword).toBe(0);
  });

  it('blocks submission when the passwords do not match', async () => {
    const { fixture, repository } = await createFixture();
    const root: HTMLElement = fixture.nativeElement;
    const inputs = root.querySelectorAll<HTMLInputElement>('.formly-password-field input');
    inputs[0].value = 'NewPass@123';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    inputs[1].value = 'Different@123';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.resetPassword).toBe(0);
  });

  it('re-checks the match once the original password changes after confirm was already filled in matching', async () => {
    const { fixture, repository } = await createFixture();
    const root: HTMLElement = fixture.nativeElement;
    const inputs = root.querySelectorAll<HTMLInputElement>('.formly-password-field input');
    inputs[0].value = 'NewPass@123';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    inputs[1].value = 'NewPass@123';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    // Now change the original password without touching confirm again — it was matching, should become a mismatch.
    inputs[0].value = 'SomethingElse@1';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.resetPassword).toBe(0);
  });

  it('resets successfully with matching, policy-compliant passwords and shows the success dialog', async () => {
    const { fixture, repository } = await createFixture();
    await fillMatchingPasswords(fixture);

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(repository.calls.resetPassword).toBe(1);
    expect(document.body.textContent).toContain('STARLINKS.AUTH.RESET_PASSWORD.SUCCESS_TITLE');
  });

  it('navigates to login when the success dialog is confirmed', async () => {
    const { fixture, router } = await createFixture();
    await fillMatchingPasswords(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    document.querySelector<HTMLButtonElement>('.auth-feedback-dialog__action')?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/auth/login');
  });

  it('shows the invalid-token dialog, disables the form, and clears passwords on AUTH_RESET_TOKEN_INVALID', async () => {
    const { fixture } = await createFixture({
      repositoryConfig: { resetPasswordResult: () => authErrorOf('AUTH_RESET_TOKEN_INVALID') },
    });
    await fillMatchingPasswords(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.body.textContent).toContain(
      'STARLINKS.AUTH.RESET_PASSWORD.INVALID_TOKEN_TITLE',
    );
    const root: HTMLElement = fixture.nativeElement;
    const inputs = root.querySelectorAll<HTMLInputElement>('.formly-password-field input');
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toBe('');
    expect(root.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });

  it('shows the expired-token dialog on AUTH_RESET_TOKEN_EXPIRED', async () => {
    const { fixture } = await createFixture({
      repositoryConfig: { resetPasswordResult: () => authErrorOf('AUTH_RESET_TOKEN_EXPIRED') },
    });
    await fillMatchingPasswords(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.body.textContent).toContain(
      'STARLINKS.AUTH.RESET_PASSWORD.EXPIRED_TOKEN_TITLE',
    );
  });

  it('navigates to forgot-password from the token-error dialog action', async () => {
    const { fixture, router } = await createFixture({ token: null });
    fixture.detectChanges();

    document.querySelector<HTMLButtonElement>('.auth-feedback-dialog__action')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/auth/forgot-password');
  });

  it('links to the login page for "back to login"', async () => {
    const { fixture } = await createFixture();
    expect(fixture.nativeElement.querySelector('a[href="/auth/login"]')).toBeTruthy();
  });

  it('prevents a second concurrent submission from calling the repository twice', async () => {
    const resetSubject = new Subject<void>();
    const { fixture, repository } = await createFixture({
      repositoryConfig: { resetPasswordResult: () => resetSubject.asObservable() },
    });
    await fillMatchingPasswords(fixture);

    submit(fixture);
    fixture.detectChanges();
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.resetPassword).toBe(1);

    resetSubject.next();
    resetSubject.complete();
  });
});
