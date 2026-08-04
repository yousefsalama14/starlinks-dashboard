import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { I18nService } from './core/i18n/i18n.service';
import { AuthFacade } from './features/auth/data-access/auth.facade';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly i18n = inject(I18nService);
  private readonly authFacade = inject(AuthFacade);

  constructor() {
    this.i18n.initialize();
    // Idempotent/cached — guards that also call this replay the same result,
    // so the session is only ever restored once per app lifetime.
    this.authFacade.initialize().subscribe();
  }
}
