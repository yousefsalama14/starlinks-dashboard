import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';

import { AUTH_SESSION_STORAGE_KEY } from '../../constants/auth-storage.constants';
import { MOCK_AUTH_CREDENTIALS } from '../../constants/mock-auth.constants';
import { AuthRepositoryContract } from '../../contracts/auth-repository.contract';
import { AuthSession } from '../../models/auth-session.model';
import { TEST_AUTH_SESSION } from '../../testing/auth-test-data';
import {
  FakeAuthRepository,
  authErrorOf,
  provideAuthFormlyTesting,
  provideFakeAuthRepository,
} from '../../testing/auth-test-providers';
import { LoginComponent } from './login.component';

@Component({ template: '' })
class DummyComponent {}

function setInputValue(root: HTMLElement, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (!input) {
    throw new Error(`No input found for selector ${selector}`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('LoginComponent', () => {
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.querySelectorAll('.p-dialog-mask').forEach((el) => el.remove());
  });

  async function createFixture(
    options: {
      returnUrl?: string | null;
      repositoryConfig?: Parameters<typeof provideFakeAuthRepository>[0];
    } = {},
  ) {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideAuthFormlyTesting(),
        provideRouter([
          { path: 'app/home', component: DummyComponent },
          { path: 'app/shipments', component: DummyComponent },
          { path: 'auth/forgot-password', component: DummyComponent },
        ]),
        provideFakeAuthRepository(options.repositoryConfig),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'returnUrl' ? (options.returnUrl ?? null) : null),
              },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const repository = TestBed.inject(AuthRepositoryContract) as FakeAuthRepository;
    const router = TestBed.inject(Router);
    return { fixture, repository, router };
  }

  async function fillValidForm(
    fixture: ReturnType<typeof TestBed.createComponent<LoginComponent>>,
  ) {
    const root: HTMLElement = fixture.nativeElement;
    setInputValue(root, 'input[type="email"]', MOCK_AUTH_CREDENTIALS.email);
    setInputValue(root, '.formly-password-field input', MOCK_AUTH_CREDENTIALS.password);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function submit(fixture: ReturnType<typeof TestBed.createComponent<LoginComponent>>) {
    const form = (fixture.nativeElement as HTMLElement).querySelector('form');
    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }

  it('renders with an empty default form', async () => {
    const { fixture } = await createFixture();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe('');
    expect(root.querySelector<HTMLInputElement>('.formly-password-field input')?.value).toBe('');
  });

  it('blocks submission and does not call the repository for an invalid email', async () => {
    const { fixture, repository } = await createFixture();
    const root: HTMLElement = fixture.nativeElement;
    setInputValue(root, 'input[type="email"]', 'not-an-email');
    setInputValue(root, '.formly-password-field input', MOCK_AUTH_CREDENTIALS.password);
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.login).toBe(0);
  });

  it('blocks submission and does not call the repository for a missing password', async () => {
    const { fixture, repository } = await createFixture();
    setInputValue(fixture.nativeElement, 'input[type="email"]', MOCK_AUTH_CREDENTIALS.email);
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.login).toBe(0);
  });

  it('logs in successfully and navigates to the default route with no returnUrl', async () => {
    const { fixture, router } = await createFixture({
      repositoryConfig: { loginResult: () => of(TEST_AUTH_SESSION) },
    });
    await fillValidForm(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/app/home');
  });

  it('navigates to a safe returnUrl when one is present', async () => {
    const { fixture, router } = await createFixture({
      returnUrl: '/app/shipments',
      repositoryConfig: { loginResult: () => of(TEST_AUTH_SESSION) },
    });
    await fillValidForm(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/app/shipments');
  });

  it('falls back to the default route for an unsafe returnUrl', async () => {
    const { fixture, router } = await createFixture({
      returnUrl: 'https://evil.example.com',
      repositoryConfig: { loginResult: () => of(TEST_AUTH_SESSION) },
    });
    await fillValidForm(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/app/home');
  });

  it('persists the session to sessionStorage (not localStorage) when rememberMe stays unchecked', async () => {
    const { fixture } = await createFixture({
      repositoryConfig: { loginResult: () => of(TEST_AUTH_SESSION) },
    });
    await fillValidForm(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
  });

  it('persists the session to localStorage when rememberMe is checked', async () => {
    const { fixture } = await createFixture({
      repositoryConfig: { loginResult: () => of(TEST_AUTH_SESSION) },
    });
    await fillValidForm(fixture);
    const root: HTMLElement = fixture.nativeElement;
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]');
    checkbox?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(localStorage.getItem(AUTH_SESSION_STORAGE_KEY)).not.toBeNull();
  });

  it('shows the error dialog, clears the password, and preserves the email on invalid credentials', async () => {
    const { fixture } = await createFixture({
      repositoryConfig: { loginResult: () => authErrorOf('AUTH_INVALID_CREDENTIALS') },
    });
    await fillValidForm(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('STARLINKS.AUTH.LOGIN.INVALID_CREDENTIALS_TITLE');
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe(
      MOCK_AUTH_CREDENTIALS.email,
    );
    expect(root.querySelector<HTMLInputElement>('.formly-password-field input')?.value).toBe('');
  });

  it('clears the facade error and returns focus to the password field after the dialog closes', async () => {
    const { fixture } = await createFixture({
      repositoryConfig: { loginResult: () => authErrorOf('AUTH_INVALID_CREDENTIALS') },
    });
    await fillValidForm(fixture);
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const actionButton = document.querySelector<HTMLButtonElement>('.auth-feedback-dialog__action');
    actionButton?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.querySelector('.auth-feedback-dialog')).toBeNull();
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('.formly-password-field input'),
    );
  });

  it('prevents a second concurrent submission from calling the repository twice', async () => {
    const loginSubject = new Subject<AuthSession>();
    const { fixture, repository } = await createFixture({
      repositoryConfig: { loginResult: () => loginSubject.asObservable() },
    });
    await fillValidForm(fixture);

    submit(fixture);
    fixture.detectChanges();
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.login).toBe(1);

    loginSubject.next(TEST_AUTH_SESSION);
    loginSubject.complete();
  });

  it('links to the forgot-password page', async () => {
    const { fixture } = await createFixture();
    const link = fixture.nativeElement.querySelector('a[href="/auth/forgot-password"]');
    expect(link).toBeTruthy();
  });
});
