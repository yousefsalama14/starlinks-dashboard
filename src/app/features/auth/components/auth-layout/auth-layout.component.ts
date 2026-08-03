import { ChangeDetectionStrategy, Component } from '@angular/core';

import { AuthBrandPanelComponent } from '../auth-brand-panel/auth-brand-panel.component';

/**
 * Shared two-column visual shell for every auth page. Pages project their
 * page-specific heading/subtitle/form/actions into the default slot, an
 * optional back action into `[authLayoutBack]`, and their footer links into
 * `[authLayoutFooter]`. The brand panel is identical on every page, so it is
 * embedded here rather than re-projected by each page.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [AuthBrandPanelComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent {}
