import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TableToolbarComponent } from './table-toolbar.component';

@Component({
  imports: [TableToolbarComponent],
  template: `
    <app-table-toolbar>
      <input tableToolbarSearch data-kind="search" />
      <button tableToolbarViewOptions data-kind="view">View</button>
      <button tableToolbarFilters data-kind="filters">Filters</button>
    </app-table-toolbar>
  `,
})
class ToolbarHostComponent {}

describe('TableToolbarComponent', () => {
  let fixture: ComponentFixture<ToolbarHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToolbarHostComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', {
      STARLINKS: { TABLE: { TOOLBAR: { LABEL: 'Table controls' } } },
    });
    fixture = TestBed.createComponent(ToolbarHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
  });

  it('renders a translated semantic toolbar with projected controls in natural order', () => {
    const toolbar = fixture.nativeElement.querySelector('[role="toolbar"]') as HTMLElement;
    const controls = [...toolbar.querySelectorAll('[data-kind]')].map((item) =>
      item.getAttribute('data-kind'),
    );

    expect(toolbar.getAttribute('aria-label')).toBe('Table controls');
    expect(controls).toEqual(['search', 'view', 'filters']);
    expect(toolbar.querySelector('input')).toBeTruthy();
    expect(toolbar.querySelectorAll('button')).toHaveLength(2);
  });

  it('preserves DOM order in RTL and does not intercept child keyboard events', () => {
    document.documentElement.dir = 'rtl';
    const toolbar = fixture.nativeElement.querySelector('[role="toolbar"]') as HTMLElement;
    const search = toolbar.querySelector('input') as HTMLInputElement;
    let handled = 0;
    search.addEventListener('keydown', () => handled++);

    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));

    expect(handled).toBe(1);
    expect(
      [...toolbar.querySelectorAll('[data-kind]')].map((item) => item.getAttribute('data-kind')),
    ).toEqual(['search', 'view', 'filters']);
  });

  it('contains responsive wrapping hooks and no unrelated actions', () => {
    const toolbar = fixture.nativeElement.querySelector('.table-toolbar') as HTMLElement;

    expect(toolbar.querySelector('.table-toolbar__search')).toBeTruthy();
    expect(toolbar.querySelector('.table-toolbar__controls')).toBeTruthy();
    expect(toolbar.textContent).not.toContain('Export');
    expect(toolbar.textContent).not.toContain('Add Shipment');
  });
});
