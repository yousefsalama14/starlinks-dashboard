import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideTranslateService({
          fallbackLang: 'en',
          lang: 'en',
        }),
      ],
    });

    service = TestBed.inject(I18nService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    document.documentElement.dir = '';
  });

  it('sets Arabic as RTL', () => {
    service.setLanguage('ar');

    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('sets English as LTR', () => {
    service.setLanguage('en');

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
