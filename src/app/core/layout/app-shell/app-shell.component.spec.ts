import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { AppShellComponent } from './app-shell.component';
import { NavigationMenuComponent } from '../../../shared/components/navigation-menu/navigation-menu.component';

describe('AppShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();
  });

  it('opens and closes the mobile drawer', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    const component = fixture.componentInstance as unknown as { closeMobileMenu(): void };
    fixture.detectChanges();

    const menuButton = fixture.nativeElement.querySelector('header button') as HTMLButtonElement;
    menuButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();

    component.closeMobileMenu();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeFalsy();
  });

  it('closes the mobile drawer after selecting a navigation item', () => {
    const fixture = TestBed.createComponent(AppShellComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('header button') as HTMLButtonElement).click();
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
});
