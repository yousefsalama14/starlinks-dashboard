import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthRepositoryContract } from './features/auth/contracts/auth-repository.contract';
import { TEST_AUTH_SESSION } from './features/auth/testing/auth-test-data';
import {
  FakeAuthRepository,
  provideFakeAuthRepository,
} from './features/auth/testing/auth-test-providers';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideTranslateService({
          fallbackLang: 'en',
          lang: 'en',
        }),
        provideFakeAuthRepository({ restoreSessionResult: () => of(TEST_AUTH_SESSION) }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('restores the session once on construction', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const repository = TestBed.inject(AuthRepositoryContract) as FakeAuthRepository;
    expect(repository.calls.restoreSession).toBe(1);
  });
});
