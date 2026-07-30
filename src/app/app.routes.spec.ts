import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
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

  it('resolves removed and unknown URLs to the in-shell not-found page', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      ],
    }).compileComponents();

    const harness = await RouterTestingHarness.create('/app/shipments');
    const router = TestBed.inject(Router);

    expect(router.url).toBe('/app/not-found');
    expect(harness.routeNativeElement?.querySelector('.not-found')).toBeTruthy();

    await router.navigateByUrl('/unknown-page');
    expect(router.url).toBe('/app/not-found');
  });
});
