import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.dir = 'ltr';

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.dir = 'ltr';
  });

  it('renders compact codes and full translated options for the account variant', () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.componentRef.setInput('variant', 'account');
    fixture.detectChanges();

    const compactOptions = Array.from(
      fixture.nativeElement.querySelectorAll('.language-switcher__control--compact option'),
    ).map((option) => (option as HTMLOptionElement).textContent?.trim());
    const fullOptions = fixture.nativeElement.querySelectorAll(
      '.language-switcher__control--full option',
    );

    expect(compactOptions).toEqual(['EN', 'AR']);
    expect(fullOptions).toHaveLength(2);
    expect(fullOptions[0].textContent).toContain('STARLINKS.LANGUAGES.ENGLISH');
  });

  it('updates the shared language state from either account control', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.componentRef.setInput('variant', 'account');
    fixture.detectChanges();

    const compactSelect = fixture.nativeElement.querySelector(
      '.language-switcher__control--compact select',
    ) as HTMLSelectElement;
    compactSelect.value = 'ar';
    compactSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(TestBed.inject(I18nService).currentLanguage()).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');

    const fullSelect = fixture.nativeElement.querySelector(
      '.language-switcher__control--full select',
    ) as HTMLSelectElement;
    fullSelect.value = 'en';
    fullSelect.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(TestBed.inject(I18nService).currentLanguage()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
