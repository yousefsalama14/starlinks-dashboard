import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type PackLanguageCode = 'en' | 'ar';

export interface PackLanguage {
  code: PackLanguageCode;
  labelKey: string;
  nativeLabel: string;
  direction: 'ltr' | 'rtl';
}

const STORAGE_KEY = 'packmatch.language';

@Injectable({ providedIn: 'root' })
export class PackI18nService {
  private readonly document = inject(DOCUMENT);
  private readonly translate = inject(TranslateService);

  readonly languages: PackLanguage[] = [
    { code: 'en', labelKey: 'PACKMATCH.LANGUAGES.ENGLISH', nativeLabel: 'English', direction: 'ltr' },
    { code: 'ar', labelKey: 'PACKMATCH.LANGUAGES.ARABIC', nativeLabel: 'العربية', direction: 'rtl' },
  ];

  readonly currentLanguage = signal<PackLanguageCode>('en');

  initialize(): void {
    this.translate.addLangs(this.languages.map((item) => item.code));
    this.setLanguage(this.resolveInitialLanguage());
  }

  setLanguage(languageCode: PackLanguageCode): void {
    const language = this.languages.find((item) => item.code === languageCode) ?? this.languages[0];

    this.currentLanguage.set(language.code);
    this.translate.use(language.code);
    this.document.documentElement.lang = language.code;
    this.document.documentElement.dir = language.direction;
    localStorage.setItem(STORAGE_KEY, language.code);
  }

  private resolveInitialLanguage(): PackLanguageCode {
    const storedLanguage = localStorage.getItem(STORAGE_KEY);
    if (this.isSupportedLanguage(storedLanguage)) {
      return storedLanguage;
    }

    const browserLanguage = this.translate.getBrowserLang();
    return this.isSupportedLanguage(browserLanguage) ? browserLanguage : 'en';
  }

  private isSupportedLanguage(language: string | null | undefined): language is PackLanguageCode {
    return this.languages.some((item) => item.code === language);
  }
}
