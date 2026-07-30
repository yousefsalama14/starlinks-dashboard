import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { LanguageSwitcherComponent } from './language-switcher.component';

describe('LanguageSwitcherComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string): MediaQueryList =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => true,
        }) as MediaQueryList,
    });

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    }).compileComponents();
  });

  afterEach(() => {
    document.querySelectorAll('.language-switcher__panel').forEach((panel) => panel.remove());
    localStorage.clear();
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  });

  it('renders a compact account trigger with a language code and Iconsax icons', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.componentRef.setInput('variant', 'account');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('p-select')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="global"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="arrow-down-01"]')).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.language-switcher__label--code').textContent,
    ).toContain('EN');
    expect(fixture.nativeElement.textContent).not.toContain('STARLINKS.LANGUAGES.ENGLISH');
  });

  it('keeps the full translated label in the default variant', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.language-switcher__label').textContent).toContain(
      'STARLINKS.LANGUAGES.ENGLISH',
    );
    expect(fixture.nativeElement.querySelector('.language-switcher__label--code')).toBeNull();
  });

  it('renders translated overlay options and marks the active language', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.p-select') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const panel = document.querySelector('.language-switcher__panel') as HTMLElement;
    const options = Array.from(panel.querySelectorAll('.p-select-option'));

    expect(options).toHaveLength(2);
    expect(options[0].textContent).toContain('STARLINKS.LANGUAGES.ENGLISH');
    expect(options[1].textContent).toContain('STARLINKS.LANGUAGES.ARABIC');
    expect(options[0].querySelector('iconsax-icon[name="tick-circle"]')).toBeTruthy();
    expect(options[1].querySelector('iconsax-icon[name="tick-circle"]')).toBeNull();
  });

  it('updates language, direction, and persistence when an option is selected', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    fixture.componentRef.setInput('variant', 'account');
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.p-select') as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    const options = document.querySelectorAll('.language-switcher__panel .p-select-option');
    (options[1] as HTMLElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(TestBed.inject(I18nService).currentLanguage()).toBe('ar');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem('starlinks.language')).toBe('ar');

    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.language-switcher__label--code').textContent,
    ).toContain('AR');
  });
});
