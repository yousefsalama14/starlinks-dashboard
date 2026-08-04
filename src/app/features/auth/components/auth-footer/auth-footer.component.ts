import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-footer',
  imports: [TranslatePipe],
  templateUrl: './auth-footer.component.html',
  styleUrl: './auth-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFooterComponent {
  protected readonly currentYear = new Date().getFullYear();
}
