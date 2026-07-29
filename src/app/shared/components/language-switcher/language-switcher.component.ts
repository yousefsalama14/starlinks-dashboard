import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PackI18nService, PackLanguageCode } from '../../../core/i18n/pack-i18n.service';

@Component({
  selector: 'app-language-switcher',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcherComponent {
  protected readonly i18n = inject(PackI18nService);
  protected readonly languages = this.i18n.languages;
  protected readonly currentLanguage = this.i18n.currentLanguage;

  protected setLanguage(languageCode: string): void {
    this.i18n.setLanguage(languageCode as PackLanguageCode);
  }
}
