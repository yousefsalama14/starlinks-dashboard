import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';
import {
  NavigationMenuComponent,
  NavigationMenuItem,
} from '../../../shared/components/navigation-menu/navigation-menu.component';

@Component({
  selector: 'app-shell',
  imports: [
    LanguageSwitcherComponent,
    NavigationMenuComponent,
    RouterLink,
    RouterOutlet,
    TranslatePipe,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppShellComponent {
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly navItems: readonly NavigationMenuItem[] = [
    { id: 'home', labelKey: 'STARLINKS.NAV.HOME', route: '/app/home', icon: 'home', exact: true },
    {
      id: 'dashboard',
      labelKey: 'STARLINKS.NAV.DASHBOARD',
      route: '/app/dashboard',
      icon: 'category',
      exact: true,
    },
    {
      id: 'shipments',
      labelKey: 'STARLINKS.NAV.SHIPMENTS',
      route: '/app/shipments',
      icon: 'box',
      exact: true,
    },
    {
      id: 'fulfillment',
      labelKey: 'STARLINKS.NAV.FULFILLMENT',
      route: '/app/fulfillment',
      icon: 'box-tick',
      exact: true,
    },
    {
      id: 'surveys',
      labelKey: 'STARLINKS.NAV.SURVEYS',
      route: '/app/surveys',
      icon: 'clipboard-text',
      exact: true,
      hasNotification: true,
    },
    {
      id: 'invoices',
      labelKey: 'STARLINKS.NAV.INVOICES',
      route: '/app/invoices',
      icon: 'receipt-text',
      exact: true,
      hasNotification: true,
    },
    {
      id: 'support',
      labelKey: 'STARLINKS.NAV.SUPPORT',
      route: '/app/support',
      icon: 'headphone',
      exact: true,
    },
  ];
  protected readonly logoutItems: readonly NavigationMenuItem[] = [
    {
      id: 'logout',
      labelKey: 'STARLINKS.NAV.LOGOUT',
      icon: 'logout-02',
      iconTone: 'danger',
    },
  ];

  protected openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected handleMenuItemSelection(): void {
    this.closeMobileMenu();
  }
}
