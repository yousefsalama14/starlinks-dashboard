import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../shared/components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-shell',
  imports: [LanguageSwitcherComponent, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly navItems = [
    { labelKey: 'PACKMATCH.NAV.DASHBOARD', route: '/app/dashboard', icon: 'pi pi-home' },
    { labelKey: 'PACKMATCH.NAV.ACTIVITY', route: '/app/dashboard/activity', icon: 'pi pi-clock' },
  ];

  protected openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
