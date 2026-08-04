import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AppShellComponent } from './app-shell.component';
import { NavigationMenuComponent } from '../../../shared/components/navigation-menu/navigation-menu.component';

@Component({ template: '', standalone: true })
class TestPageComponent {}

describe('AppShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent, TestPageComponent],
      providers: [
        provideRouter([
          {
            path: 'app',
            children: [
              {
                path: 'home',
                component: TestPageComponent,
                data: { headerTitleKey: 'STARLINKS.NAV.HOME' },
              },
              {
                path: 'not-found',
                component: TestPageComponent,
                data: { headerTitleKey: 'STARLINKS.NOT_FOUND.HEADER_TITLE' },
              },
              {
                path: 'shipments',
                children: [
                  {
                    path: '',
                    component: TestPageComponent,
                    data: {
                      headerTitleKey: 'STARLINKS.SHIPMENTS.PAGE_TITLE',
                      headerMode: 'root',
                      headerSupportingTextKey: 'STARLINKS.SHIPMENTS.PAGE_SUPPORTING_TEXT',
                    },
                  },
                  {
                    path: 'create',
                    component: TestPageComponent,
                    data: {
                      headerTitleKey: 'STARLINKS.SHIPMENTS.CREATE_TITLE',
                      headerMode: 'nested',
                      backRoute: '/app/shipments',
                      breadcrumbs: [
                        {
                          labelKey: 'STARLINKS.SHIPMENTS.PAGE_TITLE',
                          route: '/app/shipments',
                        },
                        { labelKey: 'STARLINKS.SHIPMENTS.CREATE_TITLE' },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ]),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      ],
    }).compileComponents();
  });

  it('opens and closes the mobile drawer', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    const component = fixture.componentInstance as unknown as { closeMobileMenu(): void };
    fixture.detectChanges();

    const menuButton = fixture.nativeElement.querySelector(
      '.app-header__menu-button',
    ) as HTMLButtonElement;
    menuButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="dialog"] app-language-switcher')).toBeNull();

    component.closeMobileMenu();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('closes the mobile drawer after selecting a navigation item', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-header__menu-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const mobileMenu = fixture.debugElement
      .queryAll(By.directive(NavigationMenuComponent))
      .map((debugElement) => debugElement.componentInstance as NavigationMenuComponent)
      .find((menu) => menu.expanded());

    mobileMenu!.itemSelected.emit({
      id: 'home',
      labelKey: 'STARLINKS.NAV.HOME',
      icon: 'home',
      route: '/app/home',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('keeps the mobile drawer open after selecting a non-routing item', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.app-header__menu-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const mobileMenu = fixture.debugElement
      .queryAll(By.directive(NavigationMenuComponent))
      .map((debugElement) => debugElement.componentInstance as NavigationMenuComponent)
      .find((menu) => menu.expanded());

    mobileMenu!.itemSelected.emit({
      id: 'dashboard',
      labelKey: 'STARLINKS.NAV.DASHBOARD',
      icon: 'category',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('configures Home and Shipments as routed menu items', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const routedItems = fixture.nativeElement.querySelectorAll('app-navigation-menu a');
    expect(routedItems).toHaveLength(2);
    expect(routedItems[0].getAttribute('href')).toBe('/app/home');
    expect(routedItems[1].getAttribute('href')).toBe('/app/shipments');
  });

  it('keeps desktop and mobile primary menus scrollable without moving logo or Logout', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const desktopRail = fixture.nativeElement.querySelector('.side-menu-rail') as HTMLElement;
    const desktopScrollRegion = desktopRail.querySelector(
      ':scope > .side-menu__scroll-region',
    ) as HTMLElement;
    expect(desktopScrollRegion.querySelector('app-navigation-menu')).toBeTruthy();
    expect(desktopScrollRegion.querySelector('.side-menu__logo')).toBeNull();
    expect(desktopScrollRegion.textContent).not.toContain('STARLINKS.NAV.LOGOUT');
    expect(desktopRail.querySelector(':scope > .side-menu__logo')).toBeTruthy();

    (fixture.nativeElement.querySelector('.app-header__menu-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    const mobileScrollRegion = drawer.querySelector(
      ':scope > .side-menu__scroll-region',
    ) as HTMLElement;
    expect(mobileScrollRegion.querySelector('app-navigation-menu')).toBeTruthy();
    expect(mobileScrollRegion.querySelector('.side-menu__logo')).toBeNull();
    expect(mobileScrollRegion.textContent).not.toContain('STARLINKS.NAV.LOGOUT');
    expect(drawer.textContent).toContain('STARLINKS.NAV.LOGOUT');
  });

  it('uses direction-aware shell, rail, and drawer layout hooks', () => {
    document.documentElement.dir = 'rtl';
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-shell')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.side-menu-rail')).toBeTruthy();

    (fixture.nativeElement.querySelector('.app-header__menu-button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.side-menu-drawer')).toBeTruthy();
    document.documentElement.dir = 'ltr';
  });

  it('renders root feature pages with supporting text and no navigation aids', async () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/app/home');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-header h1').textContent).toContain(
      'STARLINKS.NAV.HOME',
    );

    await router.navigateByUrl('/app/not-found');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-header h1').textContent).toContain(
      'STARLINKS.NOT_FOUND.HEADER_TITLE',
    );

    await router.navigateByUrl('/app/shipments');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-header h1').textContent).toContain(
      'STARLINKS.SHIPMENTS.PAGE_TITLE',
    );
    expect(
      fixture.nativeElement.querySelector('.app-header__supporting-text').textContent,
    ).toContain('STARLINKS.SHIPMENTS.PAGE_SUPPORTING_TEXT');
    expect(fixture.nativeElement.querySelector('.app-header__breadcrumbs')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-header__back')).toBeNull();
  });

  it('renders nested feature pages with an optional back control and breadcrumbs below the title', async () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    const router = TestBed.inject(Router);
    fixture.detectChanges();

    await router.navigateByUrl('/app/shipments/create');
    fixture.detectChanges();

    const titleRow = fixture.nativeElement.querySelector('.app-header__title-row') as HTMLElement;
    const breadcrumbs = fixture.nativeElement.querySelector(
      '.app-header__breadcrumbs',
    ) as HTMLElement;
    const backControl = fixture.nativeElement.querySelector(
      '.app-header__back',
    ) as HTMLAnchorElement;

    expect(titleRow.querySelector('h1')?.textContent).toContain('STARLINKS.SHIPMENTS.CREATE_TITLE');
    expect(backControl.getAttribute('href')).toBe('/app/shipments');
    expect(backControl.querySelector('iconsax-icon[name="arrow-left-01"]')).toBeTruthy();
    expect(breadcrumbs.querySelector('a')?.getAttribute('href')).toBe('/app/shipments');
    expect(breadcrumbs.querySelector('[aria-current="page"]')?.textContent).toContain(
      'STARLINKS.SHIPMENTS.CREATE_TITLE',
    );
    expect(
      titleRow.compareDocumentPosition(breadcrumbs) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders one unified header with navigation, notification, and identity details', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('header')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.app-header__menu-button')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.app-header__account app-language-switcher'),
    ).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-header__notification-dot')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="notification"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-header__brand-mark')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.app-header__identity small').textContent,
    ).toContain('STARLINKS.APP_SHELL.ADMIN_ROLE');
  });
});
