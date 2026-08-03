import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

import { AuthRepositoryContract } from '../../contracts/auth-repository.contract';
import {
  FakeAuthRepository,
  authErrorOf,
  provideAuthFormlyTesting,
  provideFakeAuthRepository,
} from '../../testing/auth-test-providers';
import { ForgotPasswordComponent } from './forgot-password.component';

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

describe('ForgotPasswordComponent', () => {
  afterEach(() => {
    document.querySelectorAll('.p-dialog-mask').forEach((el) => el.remove());
  });

  async function createFixture(repositoryConfig?: Parameters<typeof provideFakeAuthRepository>[0]) {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideAuthFormlyTesting(),
        provideRouter([
          { path: 'auth/login', component: DummyComponent },
          { path: 'auth/forgot-password', component: DummyComponent },
        ]),
        provideFakeAuthRepository(repositoryConfig),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return {
      fixture,
      repository: TestBed.inject(AuthRepositoryContract) as FakeAuthRepository,
      router: TestBed.inject(Router),
    };
  }

  function submit(fixture: ReturnType<typeof TestBed.createComponent<ForgotPasswordComponent>>) {
    fixture.nativeElement
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }

  it('blocks submission when the email is empty', async () => {
    const { fixture, repository } = await createFixture();
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.forgotPassword).toBe(0);
  });

  it('blocks submission for an invalid email', async () => {
    const { fixture, repository } = await createFixture();
    setInputValue(fixture.nativeElement, 'input[type="email"]', 'not-an-email');
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.forgotPassword).toBe(0);
  });

  it('submits a normalized, lowercased email and shows the success dialog', async () => {
    const { fixture, repository } = await createFixture();
    setInputValue(fixture.nativeElement, 'input[type="email"]', '  Someone@Example.com  ');
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(repository.calls.forgotPassword).toBe(1);
    expect(document.body.textContent).toContain('STARLINKS.AUTH.FORGOT_PASSWORD.SUCCESS_TITLE');
  });

  it('always shows the same success dialog regardless of whether the account exists', async () => {
    const { fixture } = await createFixture();
    setInputValue(fixture.nativeElement, 'input[type="email"]', 'unknown.person@example.com');
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(document.body.textContent).toContain('STARLINKS.AUTH.FORGOT_PASSWORD.SUCCESS_MESSAGE');
  });

  it('navigates to login when the success dialog is confirmed', async () => {
    const { fixture, router } = await createFixture();
    setInputValue(fixture.nativeElement, 'input[type="email"]', 'someone@example.com');
    fixture.detectChanges();
    await fixture.whenStable();

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

  it('shows a generic error dialog without exposing repository details on technical failure', async () => {
    const { fixture, router } = await createFixture({
      forgotPasswordResult: () => authErrorOf('AUTH_UNKNOWN_ERROR'),
    });
    setInputValue(fixture.nativeElement, 'input[type="email"]', 'someone@example.com');
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const text = document.body.textContent ?? '';
    expect(text).toContain('STARLINKS.COMMON.GENERIC_ERROR_TITLE');
    expect(text).not.toContain('AUTH_UNKNOWN_ERROR');

    document.querySelector<HTMLButtonElement>('.auth-feedback-dialog__action')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).not.toBe('/auth/login');
  });

  it('preserves the entered email after a technical error', async () => {
    const { fixture } = await createFixture({
      forgotPasswordResult: () => authErrorOf('AUTH_UNKNOWN_ERROR'),
    });
    setInputValue(fixture.nativeElement, 'input[type="email"]', 'someone@example.com');
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe(
      'someone@example.com',
    );
  });

  it('navigates to login when the back action is used', async () => {
    const { fixture, router } = await createFixture();
    const root: HTMLElement = fixture.nativeElement;
    root.querySelector<HTMLButtonElement>('.auth-page__back')?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/auth/login');
  });

  it('links to the sign-in page', async () => {
    const { fixture } = await createFixture();
    expect(fixture.nativeElement.querySelector('a[href="/auth/login"]')).toBeTruthy();
  });

  it('prevents a second concurrent submission from calling the repository twice', async () => {
    const requestSubject = new Subject<void>();
    const { fixture, repository } = await createFixture({
      forgotPasswordResult: () => requestSubject.asObservable(),
    });
    setInputValue(fixture.nativeElement, 'input[type="email"]', 'someone@example.com');
    fixture.detectChanges();
    await fixture.whenStable();

    submit(fixture);
    fixture.detectChanges();
    submit(fixture);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.forgotPassword).toBe(1);

    requestSubject.next();
    requestSubject.complete();
  });
});
