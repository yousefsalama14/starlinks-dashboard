import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import {
  NavigationMenuComponent,
  NavigationMenuItem,
} from './navigation-menu.component';

@Component({ template: '', standalone: true })
class TestRouteComponent {}

describe('NavigationMenuComponent', () => {
  const items: readonly NavigationMenuItem[] = [
    {
      id: 'parent',
      labelKey: 'STARLINKS.NAV.HOME',
      icon: 'home',
      route: '/home',
      exact: true,
      children: [
        {
          id: 'child',
          labelKey: 'STARLINKS.NAV.SURVEYS',
          icon: 'clipboard-text',
          route: '/surveys',
          exact: true,
          hasNotification: true,
        },
        {
          id: 'action',
          labelKey: 'STARLINKS.NAV.LOGOUT',
          icon: 'logout-02',
          iconTone: 'danger',
        },
      ],
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationMenuComponent, TestRouteComponent],
      providers: [
        provideRouter([
          { path: 'home', component: TestRouteComponent },
          { path: 'surveys', component: TestRouteComponent },
        ]),
        provideTranslateService({ fallbackLang: 'en', lang: 'en' }),
      ],
    }).compileComponents();
  });

  it('renders nested menu items and their notification indicator', () => {
    const fixture = TestBed.createComponent(NavigationMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('iconsax-icon')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('.side-menu__list--nested')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.side-menu__notification')).toBeTruthy();
  });

  it('emits the selected item for a non-routing action', () => {
    const fixture = TestBed.createComponent(NavigationMenuComponent);
    fixture.componentRef.setInput('items', items);
    const selected: NavigationMenuItem[] = [];
    fixture.componentInstance.itemSelected.subscribe((item) => selected.push(item));
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(selected).toEqual([items[0].children![1]]);
  });

  it('uses bold icons for active routes and linear icons for inactive routes', async () => {
    const fixture = TestBed.createComponent(NavigationMenuComponent);
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();

    await TestBed.inject(Router).navigateByUrl('/home');
    fixture.detectChanges();

    const activeLink = fixture.nativeElement.querySelector('a') as HTMLAnchorElement;
    expect(activeLink.classList.contains('side-menu__item--active')).toBe(true);
    expect(activeLink.querySelector('iconsax-icon')?.getAttribute('type')).toBe('bold');

    const nestedLink = fixture.nativeElement.querySelector(
      '.side-menu__list--nested a',
    ) as HTMLAnchorElement;
    expect(nestedLink.querySelector('iconsax-icon')?.getAttribute('type')).toBe('linear');

    await TestBed.inject(Router).navigateByUrl('/surveys');
    fixture.detectChanges();

    expect(nestedLink.classList.contains('side-menu__item--active')).toBe(true);
    expect(nestedLink.querySelector('iconsax-icon')?.getAttribute('type')).toBe('bold');
  });

  it('renders logout as a non-routing action with the danger icon tone', () => {
    const fixture = TestBed.createComponent(NavigationMenuComponent);
    fixture.componentRef.setInput('items', [items[0].children![1]]);
    fixture.detectChanges();

    const logoutButton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const logoutIcon = logoutButton.querySelector('iconsax-icon');

    expect(logoutButton.classList.contains('side-menu__item--danger-icon')).toBe(true);
    expect(logoutButton.querySelector('a')).toBeNull();
    expect(logoutIcon?.getAttribute('name')).toBe('logout-02');
    expect(logoutIcon?.getAttribute('type')).toBe('linear');
  });
});
