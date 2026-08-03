import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { PageRouteData } from '../page-route-data';
import { AUTH_LOGIN_ROUTE } from '../../../features/auth/constants/auth-routes.constants';
import { AuthFacade } from '../../../features/auth/data-access/auth.facade';
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
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacade);
  private readonly navigationEnd = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
    ),
    { initialValue: null },
  );

  protected readonly isMobileMenuOpen = signal(false);
  protected readonly headerTitleKey = computed(() => {
    this.navigationEnd();

    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    return (route.data as Partial<PageRouteData>).headerTitleKey ?? 'STARLINKS.NAV.HOME';
  });
  protected readonly navItems: readonly NavigationMenuItem[] = [
    { id: 'home', labelKey: 'STARLINKS.NAV.HOME', route: '/app/home', icon: 'home', exact: true },
    {
      id: 'dashboard',
      labelKey: 'STARLINKS.NAV.DASHBOARD',
      icon: 'category',
    },
    {
      id: 'shipments',
      labelKey: 'STARLINKS.NAV.SHIPMENTS',
      icon: 'box',
    },
    {
      id: 'fulfillment',
      labelKey: 'STARLINKS.NAV.FULFILLMENT',
      icon: 'box-tick',
    },
    {
      id: 'surveys',
      labelKey: 'STARLINKS.NAV.SURVEYS',
      icon: 'clipboard-text',
      hasNotification: true,
    },
    {
      id: 'invoices',
      labelKey: 'STARLINKS.NAV.INVOICES',
      icon: 'receipt-text',
      hasNotification: true,
    },
    {
      id: 'support',
      labelKey: 'STARLINKS.NAV.SUPPORT',
      icon: 'headphone',
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

  protected handleMenuItemSelection(item: NavigationMenuItem): void {
    if (item.id === 'logout') {
      this.logout();
      return;
    }
    if (item.route) {
      this.closeMobileMenu();
    }
  }

  private logout(): void {
    this.authFacade.logout().subscribe(() => {
      this.closeMobileMenu();
      void this.router.navigateByUrl(AUTH_LOGIN_ROUTE);
    });
  }
}
