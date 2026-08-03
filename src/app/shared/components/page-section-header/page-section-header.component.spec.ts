import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import {
  PageSectionHeaderActionsDirective,
  PageSectionHeaderLeadingDirective,
  PageSectionHeaderSupportingDirective,
} from './page-section-header-slot.directive';
import { PageSectionHeaderComponent } from './page-section-header.component';

@Component({
  imports: [
    PageSectionHeaderActionsDirective,
    PageSectionHeaderComponent,
    PageSectionHeaderLeadingDirective,
    PageSectionHeaderSupportingDirective,
  ],
  template: `
    <app-page-section-header
      [title]="title()"
      [subtitle]="subtitle()"
      [headingLevel]="headingLevel()"
      [compact]="compact()"
    >
      <a pageSectionHeaderLeading href="/context" data-slot="leading">Context</a>
      <button pageSectionHeaderActions type="button" data-slot="actions" (click)="handleAction()">
        Action
      </button>
      <span pageSectionHeaderSupporting data-slot="supporting">Supporting</span>
    </app-page-section-header>
  `,
})
class HeaderHostComponent {
  readonly title = signal({ key: 'TEST.TITLE' });
  readonly subtitle = signal<{ readonly key: string } | null>({ key: 'TEST.SUBTITLE' });
  readonly headingLevel = signal<1 | 2 | 3>(2);
  readonly compact = signal(false);
  clicks = 0;

  handleAction(): void {
    this.clicks += 1;
  }
}

describe('PageSectionHeaderComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HeaderHostComponent, PageSectionHeaderComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      TEST: {
        TITLE: 'Recent shipments',
        NEXT_TITLE: 'Archived shipments',
        SUBTITLE: 'Updated now',
      },
    });
    translate.setTranslation('ar', {
      TEST: {
        TITLE: 'الشحنات الأخيرة',
        NEXT_TITLE: 'الشحنات المؤرشفة',
        SUBTITLE: 'تم التحديث الآن',
      },
    });
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
  });

  it('requires title and exposes semantic defaults without mutating input', () => {
    const title = Object.freeze({ key: 'TEST.TITLE' });
    const fixture = createFixture({ title });

    expect(fixture.componentInstance.title()).toBe(title);
    expect(fixture.componentInstance.subtitle()).toBeNull();
    expect(fixture.componentInstance.headingLevel()).toBe(1);
    expect(fixture.componentInstance.compact()).toBe(false);
    expect(Object.isFrozen(title)).toBe(true);
  });

  it('renders exactly one translated native heading for levels 1, 2, and 3', () => {
    for (const level of [1, 2, 3] as const) {
      const fixture = createFixture({ headingLevel: level });
      const headings = fixture.nativeElement.querySelectorAll('h1, h2, h3');

      expect(headings).toHaveLength(1);
      expect(headings[0].tagName).toBe(`H${level}`);
      expect(headings[0].textContent).toContain('Recent shipments');
      expect(fixture.nativeElement.querySelector('[role="heading"]')).toBeNull();
    }
  });

  it('rejects unsupported heading levels explicitly', () => {
    expect(() => createFixture({ headingLevel: 4 as 1 })).toThrowError(/Invalid headingLevel/);
  });

  it('updates translated title, subtitle, heading level, and compact rendering from inputs', () => {
    const fixture = createFixture();
    fixture.componentRef.setInput('title', { key: 'TEST.NEXT_TITLE' });
    fixture.componentRef.setInput('subtitle', { key: 'TEST.SUBTITLE' });
    fixture.componentRef.setInput('headingLevel', 3);
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h3').textContent).toContain('Archived shipments');
    expect(
      fixture.nativeElement.querySelector('.page-section-header__subtitle').textContent,
    ).toContain('Updated now');
    expect(fixture.nativeElement.querySelector('h3 .page-section-header__subtitle')).toBeNull();
    expect(fixture.nativeElement.querySelector('.page-section-header--compact')).toBeTruthy();
  });

  it('omits subtitle and projection wrappers when content is absent', () => {
    const fixture = createFixture();
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;

    expect(header.querySelector('.page-section-header__subtitle')).toBeNull();
    expect(header.querySelector('.page-section-header__leading')).toBeNull();
    expect(header.querySelector('.page-section-header__actions')).toBeNull();
    expect(header.querySelector('.page-section-header__supporting')).toBeNull();
  });

  it('uses a labelled semantic header with a stable unique title association', () => {
    const first = createFixture();
    const heading = first.nativeElement.querySelector('h1') as HTMLElement;
    const header = first.nativeElement.querySelector('header') as HTMLElement;
    const originalId = heading.id;
    first.componentRef.setInput('title', { key: 'TEST.NEXT_TITLE' });
    first.detectChanges();
    const second = createFixture();

    expect(header.getAttribute('aria-labelledby')).toBe(originalId);
    expect((first.nativeElement.querySelector('h1') as HTMLElement).id).toBe(originalId);
    expect(originalId).not.toContain('Recent');
    expect(originalId).not.toBe((second.nativeElement.querySelector('h1') as HTMLElement).id);
  });

  it('projects leading, actions, and supporting content in stable reading order', () => {
    const fixture = TestBed.createComponent(HeaderHostComponent);
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    const slots = [...header.querySelectorAll('[data-slot]')].map((item) =>
      item.getAttribute('data-slot'),
    );

    expect(slots).toEqual(['leading', 'actions', 'supporting']);
    expect(
      (header.querySelector('[data-slot="leading"]') as HTMLAnchorElement).getAttribute('href'),
    ).toBe('/context');
    (header.querySelector('[data-slot="actions"]') as HTMLButtonElement).click();
    expect(fixture.componentInstance.clicks).toBe(1);
  });

  it('does not intercept projected keyboard events or replace accessible control names', () => {
    const fixture = TestBed.createComponent(HeaderHostComponent);
    fixture.detectChanges();
    const action = fixture.nativeElement.querySelector(
      '[data-slot="actions"]',
    ) as HTMLButtonElement;
    let keydowns = 0;
    action.addEventListener('keydown', () => keydowns++);
    action.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(keydowns).toBe(1);
    expect(action.textContent).toContain('Action');
    expect(action.getAttribute('aria-label')).toBeNull();
  });

  it('preserves projected order and semantic headings in Arabic RTL', () => {
    document.documentElement.dir = 'rtl';
    TestBed.inject(TranslateService).use('ar').subscribe();
    const fixture = TestBed.createComponent(HeaderHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('الشحنات الأخيرة');
    expect(
      [...fixture.nativeElement.querySelectorAll('[data-slot]')].map((item) =>
        item.getAttribute('data-slot'),
      ),
    ).toEqual(['leading', 'actions', 'supporting']);
    expect(fixture.nativeElement.querySelector('.page-section-header__main')).toBeTruthy();
  });

  it('keeps subtitle and all projections visible in compact mode', () => {
    const fixture = TestBed.createComponent(HeaderHostComponent);
    fixture.componentInstance.compact.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h2')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.page-section-header__subtitle')).toBeTruthy();
    expect(fixture.nativeElement.querySelectorAll('[data-slot]')).toHaveLength(3);
  });
});

function createFixture(
  config: {
    title?: { readonly key: string };
    subtitle?: { readonly key: string } | null;
    headingLevel?: 1 | 2 | 3;
    compact?: boolean;
  } = {},
): ComponentFixture<PageSectionHeaderComponent> {
  const fixture = TestBed.createComponent(PageSectionHeaderComponent);
  fixture.componentRef.setInput('title', config.title ?? { key: 'TEST.TITLE' });
  if (config.subtitle !== undefined) {
    fixture.componentRef.setInput('subtitle', config.subtitle);
  }
  if (config.headingLevel !== undefined) {
    fixture.componentRef.setInput('headingLevel', config.headingLevel);
  }
  if (config.compact !== undefined) {
    fixture.componentRef.setInput('compact', config.compact);
  }
  fixture.detectChanges();
  return fixture;
}
