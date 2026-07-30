import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { I18nService, LanguageCode } from '../../../core/i18n/i18n.service';

export type LanguageSwitcherVariant = 'default' | 'account';

@Component({
  selector: 'app-language-switcher',
  imports: [FormsModule, SelectModule, TranslatePipe],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LanguageSwitcherComponent {
  readonly variant = input<LanguageSwitcherVariant>('default');

  protected readonly i18n = inject(I18nService);
  protected readonly languages = this.i18n.languages;
  protected readonly currentLanguage = this.i18n.currentLanguage;

  protected setLanguage(languageCode: string): void {
    this.i18n.setLanguage(languageCode as LanguageCode);
  }
}
