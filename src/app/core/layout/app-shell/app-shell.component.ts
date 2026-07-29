import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-shell',
  imports: [LanguageSwitcherComponent, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppShellComponent {
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly navItems = [
    { labelKey: 'STARLINKS.NAV.DASHBOARD', route: '/app/dashboard', icon: 'home' },
    { labelKey: 'STARLINKS.NAV.ACTIVITY', route: '/app/dashboard/activity', icon: 'clock' },
  ];

  protected openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
