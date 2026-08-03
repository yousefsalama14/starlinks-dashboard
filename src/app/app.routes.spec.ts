import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { TEST_AUTH_SESSION } from './features/auth/testing/auth-test-data';
import {
  provideAuthFormlyTesting,
  provideFakeAuthRepository,
} from './features/auth/testing/auth-test-providers';
import { routes } from './app.routes';

describe('application routes', () => {
  it('redirects the root route to Home', () => {
    const rootRoute = routes.find((route) => route.path === '');

    expect(rootRoute?.redirectTo).toBe('app/home');
  });

  it('exposes only Home and the not-found page', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const destinations = appRoute?.children
      ?.filter((route) => route.path !== '')
      .map((route) => route.path);

    expect(destinations).toEqual(['home', 'not-found', '**']);
  });

  it('uses Home metadata and redirects removed destinations to not found', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const homeRoute = appRoute?.children?.find((route) => route.path === 'home');
    const appWildcard = appRoute?.children?.find((route) => route.path === '**');
    const rootWildcard = routes.find((route) => route.path === '**');

    expect(homeRoute?.data?.['headerTitleKey']).toBe('STARLINKS.NAV.HOME');
    expect(appRoute?.children?.some((route) => route.path === 'shipments')).toBe(false);
    expect(appWildcard?.redirectTo).toBe('not-found');
    expect(rootWildcard?.redirectTo).toBe('app/not-found');
  });

  it('protects the app shell with the auth guard', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    expect(appRoute?.canActivate).toBeDefined();
  });

  it('lazy-loads the auth routes under /auth', () => {
    const authRoute = routes.find((route) => route.path === 'auth');
    expect(authRoute?.loadChildren).toBeDefined();
  });

  it('resolves removed and unknown URLs to the in-shell not-found page for an authenticated user', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideFakeAuthRepository({ restoreSessionResult: () => of(TEST_AUTH_SESSION) }),
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create('/app/shipments');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/app/not-found');
    expect(harness.routeNativeElement?.querySelector('.not-found')).toBeTruthy();

    await router.navigateByUrl('/unknown-page');
    expect(router.url).toBe('/app/not-found');
  });

  it('redirects an unauthenticated direct visit to a protected route to login with a returnUrl', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideAuthFormlyTesting(),
        provideFakeAuthRepository({ restoreSessionResult: () => of(null) }),
      ],
    }).compileComponents();

    await RouterTestingHarness.create('/app/home');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/auth/login?returnUrl=%2Fapp%2Fhome');
  });

  it('redirects an authenticated user away from the login page to the default route', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideFakeAuthRepository({ restoreSessionResult: () => of(TEST_AUTH_SESSION) }),
      ],
    }).compileComponents();

    await RouterTestingHarness.create('/auth/login');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/app/home');
  });

  it('resolves an unknown path under /auth without looping, ending at login with a returnUrl', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideAuthFormlyTesting(),
        provideFakeAuthRepository({ restoreSessionResult: () => of(null) }),
      ],
    }).compileComponents();

    await RouterTestingHarness.create('/auth/this-does-not-exist');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/auth/login?returnUrl=%2Fapp%2Fnot-found');
  });
});
