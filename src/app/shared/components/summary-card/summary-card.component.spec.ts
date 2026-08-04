import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { SummaryCardComponent } from './summary-card.component';

describe('SummaryCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SummaryCardComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      TEST: { LABEL: 'In transit', TREND: 'On-time rate increased' },
    });
  });

  it('renders a translated label, finite value, tone, and linear Iconsax icon', () => {
    const fixture = createFixture();
    const card = fixture.nativeElement.querySelector('.summary-card') as HTMLElement;

    expect(card.dataset['tone']).toBe('info');
    expect(card.getAttribute('aria-labelledby')?.split(' ')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.summary-card__label').textContent).toContain(
      'In transit',
    );
    expect(fixture.nativeElement.querySelector('.summary-card__value').textContent).toContain(
      '415',
    );
    expect(
      fixture.nativeElement.querySelector('iconsax-icon[name="truck"][type="linear"]'),
    ).toBeTruthy();
  });

  it('supports zero and renders an accessible directional trend', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('value', 0);
    fixture.componentRef.setInput('trend', {
      direction: 'up',
      accessibleLabel: { key: 'TEST.TREND' },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.summary-card__value').textContent).toContain('0');
    expect(fixture.nativeElement.querySelector('iconsax-icon[name="arrow-up-02"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.visually-hidden').textContent).toContain(
      'On-time rate increased',
    );
  });

  it('omits optional icon and trend markup when they are not configured', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('icon', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.summary-card__icon')).toBeNull();
    expect(fixture.nativeElement.querySelector('.summary-card__trend')).toBeNull();
  });

  it.each([
    ['tone', 'accent', /Unsupported tone/],
    ['value', Number.NaN, /finite/],
    ['value', Number.POSITIVE_INFINITY, /finite/],
    ['value', '   ', /whitespace-only/],
    ['icon', ' ', /non-empty/],
  ] as const)('rejects an invalid %s contract', (inputName, value, error) => {
    expect(() => createFixture({ [inputName]: value })).toThrowError(error);
  });

  it('keeps semantic order and rendering in RTL', () => {
    document.documentElement.dir = 'rtl';
    const fixture = createFixture();

    expect(fixture.nativeElement.querySelector('article')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.summary-card__label').textContent).toContain(
      'In transit',
    );
    document.documentElement.dir = 'ltr';
  });
});

function createFixture(overrides: Readonly<Record<string, unknown>> = {}) {
  const fixture: ComponentFixture<SummaryCardComponent> =
    TestBed.createComponent(SummaryCardComponent);
  fixture.componentRef.setInput('label', { key: 'TEST.LABEL' });
  fixture.componentRef.setInput('value', 415);
  fixture.componentRef.setInput('icon', 'truck');
  fixture.componentRef.setInput('tone', 'info');
  Object.entries(overrides).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
  fixture.detectChanges();
  return fixture;
}
