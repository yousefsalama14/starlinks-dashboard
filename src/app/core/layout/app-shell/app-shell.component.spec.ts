import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject, of } from 'rxjs';
import { AppShellComponent } from './app-shell.component';
import { NavigationMenuComponent } from '../../../shared/components/navigation-menu/navigation-menu.component';
import { AuthRepositoryContract } from '../../../features/auth/contracts/auth-repository.contract';
import { TEST_AUTH_SESSION } from '../../../features/auth/testing/auth-test-data';
import {
  FakeAuthRepository,
  provideFakeAuthRepository,
} from '../../../features/auth/testing/auth-test-providers';

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
            ],
          },
          { path: 'auth/login', component: TestPageComponent },
        ]),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideFakeAuthRepository({ restoreSessionResult: () => of(TEST_AUTH_SESSION) }),
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
      id: 'shipments',
      labelKey: 'STARLINKS.NAV.SHIPMENTS',
      icon: 'box',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
  });

  it('configures Home as the only routed menu item', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    const routedItems = fixture.nativeElement.querySelectorAll('app-navigation-menu a');
    expect(routedItems).toHaveLength(1);
    expect(routedItems[0].getAttribute('href')).toBe('/app/home');
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

  it('updates the desktop header title from the deepest active route', async () => {
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

  it('logs out and navigates to login when the Logout item is selected', async () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    const router = TestBed.inject(Router);
    const repository = TestBed.inject(AuthRepositoryContract) as FakeAuthRepository;
    fixture.detectChanges();
    await fixture.whenStable();

    const logoutMenu = fixture.debugElement
      .queryAll(By.directive(NavigationMenuComponent))
      .map((debugElement) => debugElement.componentInstance as NavigationMenuComponent)
      .find((menu) => menu.items().some((item) => item.id === 'logout'));

    logoutMenu!.itemSelected.emit({
      id: 'logout',
      labelKey: 'STARLINKS.NAV.LOGOUT',
      icon: 'logout-02',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    expect(repository.calls.logout).toBe(1);
    expect(router.url).toBe('/auth/login');
  });

  it('handles a repeated logout click without double-invoking the repository', async () => {
    const logoutSubject = new Subject<void>();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AppShellComponent, TestPageComponent],
      providers: [
        provideRouter([
          { path: 'app', children: [{ path: 'home', component: TestPageComponent }] },
          { path: 'auth/login', component: TestPageComponent },
        ]),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
        provideFakeAuthRepository({
          restoreSessionResult: () => of(TEST_AUTH_SESSION),
          logoutResult: () => logoutSubject.asObservable(),
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppShellComponent);
    const router = TestBed.inject(Router);
    const repository = TestBed.inject(AuthRepositoryContract) as FakeAuthRepository;
    fixture.detectChanges();
    await fixture.whenStable();

    const logoutMenu = fixture.debugElement
      .queryAll(By.directive(NavigationMenuComponent))
      .map((debugElement) => debugElement.componentInstance as NavigationMenuComponent)
      .find((menu) => menu.items().some((item) => item.id === 'logout'));

    logoutMenu!.itemSelected.emit({
      id: 'logout',
      labelKey: 'STARLINKS.NAV.LOGOUT',
      icon: 'logout-02',
    });
    logoutMenu!.itemSelected.emit({
      id: 'logout',
      labelKey: 'STARLINKS.NAV.LOGOUT',
      icon: 'logout-02',
    });
    fixture.detectChanges();

    expect(repository.calls.logout).toBe(1);

    logoutSubject.next();
    logoutSubject.complete();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.url).toBe('/auth/login');
  });
});
