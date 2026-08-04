import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SHIPMENTS_ROUTES } from './features/shipments/shipments.routes';
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
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
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
    expect(harness.routeNativeElement?.querySelector('.app-header__supporting-text')).toBeTruthy();
    expect(harness.routeNativeElement?.querySelector('.shipments-table-card h2')).toBeTruthy();

    await router.navigateByUrl('/unknown-page');
    expect(router.url).toBe('/app/not-found');
  }, 10_000);
});
