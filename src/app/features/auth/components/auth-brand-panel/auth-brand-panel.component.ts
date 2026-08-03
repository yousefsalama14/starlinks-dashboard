import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Purely decorative marketing panel shared by every auth page. Kept as its
 * own isolated component so the absolute-positioned artwork inside it never
 * leaks into the layout that hosts it.
 */
@Component({
  selector: 'app-auth-brand-panel',
  imports: [TranslatePipe],
  templateUrl: './auth-brand-panel.component.html',
  styleUrl: './auth-brand-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthBrandPanelComponent {}
