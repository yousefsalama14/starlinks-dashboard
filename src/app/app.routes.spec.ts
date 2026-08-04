import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SHIPMENTS_ROUTES } from './features/shipments/shipments.routes';
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

  it('exposes Home, Shipments, and the not-found page', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const destinations = appRoute?.children
      ?.filter((route) => route.path !== '')
      .map((route) => route.path);

    expect(destinations).toEqual(['home', 'shipments', 'not-found', '**']);
  });

  it('uses Home metadata, lazily loads Shipments, and redirects unknown destinations', () => {
    const appRoute = routes.find((route) => route.path === 'app');
    const homeRoute = appRoute?.children?.find((route) => route.path === 'home');
    const shipmentsRoute = appRoute?.children?.find((route) => route.path === 'shipments');
    const appWildcard = appRoute?.children?.find((route) => route.path === '**');
    const rootWildcard = routes.find((route) => route.path === '**');

    expect(homeRoute?.data?.['headerTitleKey']).toBe('STARLINKS.NAV.HOME');
    expect(shipmentsRoute?.loadChildren).toBeTypeOf('function');
    expect(SHIPMENTS_ROUTES[0].data?.['headerTitleKey']).toBe('STARLINKS.SHIPMENTS.PAGE_TITLE');
    expect(SHIPMENTS_ROUTES[0].data?.['headerMode']).toBe('root');
    expect(SHIPMENTS_ROUTES[0].data?.['headerSupportingTextKey']).toBe(
      'STARLINKS.SHIPMENTS.PAGE_SUPPORTING_TEXT',
    );
    expect(SHIPMENTS_ROUTES[0].data?.['contentOwnsHeading']).toBeUndefined();
    expect(SHIPMENTS_ROUTES[0].data?.['breadcrumbs']).toBeUndefined();
    expect(SHIPMENTS_ROUTES[0].data?.['backRoute']).toBeUndefined();
    expect(appWildcard?.redirectTo).toBe('not-found');
    expect(rootWildcard?.redirectTo).toBe('app/not-found');
  });

  it('loads Shipments in the shell and resolves unknown URLs to not found', async () => {
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

      expect(router.url).toBe('/app/shipments');
      expect(harness.routeNativeElement?.querySelector('.shipments-page')).toBeTruthy();
      expect(harness.routeNativeElement?.querySelectorAll('h1')).toHaveLength(1);
      expect(harness.routeNativeElement?.querySelector('.app-header h1')).toBeTruthy();
      expect(harness.routeNativeElement?.querySelector('app-page-section-header')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.app-header__breadcrumbs')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('.app-header__back')).toBeNull();
      expect(
        harness.routeNativeElement?.querySelector('.app-header__supporting-text'),
      ).toBeTruthy();
      expect(harness.routeNativeElement?.querySelector('.shipments-table-card h2')).toBeTruthy();

      await router.navigateByUrl('/unknown-page');
      expect(router.url).toBe('/app/not-found');
    }, 10_000);
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
