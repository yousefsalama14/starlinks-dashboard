import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TableSearchOptionDefDirective } from './table-search-option-def.directive';
import { TableSearchComponent } from './table-search.component';
import {
  TableRecentSearch,
  TableSearchField,
  TableSearchSuggestion,
  TableSearchSuggestionsState,
} from './table-search.types';

const FIELDS: readonly TableSearchField[] = Object.freeze([
  Object.freeze({ key: 'name', label: { key: 'TEST.NAME' } }),
  Object.freeze({ key: 'code', label: { key: 'TEST.CODE' } }),
  Object.freeze({ key: 'disabled', label: { key: 'TEST.DISABLED' }, searchable: false }),
]);

const RECENT: readonly TableRecentSearch[] = Object.freeze([
  Object.freeze({ id: 'recent-name', fieldKey: 'name', value: 'Alpha' }),
  Object.freeze({ id: 'recent-code', fieldKey: 'code', value: 'A-1' }),
  Object.freeze({ id: 'recent-unknown', fieldKey: 'unknown', value: 'Hidden' }),
]);

const SUGGESTIONS: readonly TableSearchSuggestion<string>[] = Object.freeze([
  Object.freeze({ id: 'alpha', value: 'Alpha' }),
  Object.freeze({ id: 'alpine', value: 'Alpine' }),
  Object.freeze({ id: 0, value: 'Zero' }),
]);

describe('TableSearchComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableSearchComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', translations());
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
  });

  it('uses controlled required inputs and default optional inputs without mutation', () => {
    const fixture = createFixture();
    const component = fixture.componentInstance;

    expect(component.fields()).toBe(FIELDS);
    expect(component.recentSearches()).toBe(RECENT);
    expect(component.suggestions()).toEqual([]);
    expect(component.disabled()).toBe(false);
    expect(component.minimumQueryLength()).toBe(2);
    expect(Object.isFrozen(FIELDS)).toBe(true);
    expect(Object.isFrozen(RECENT)).toBe(true);
  });

  it('exposes responsive sizing and reduced-motion hooks while idle', () => {
    const fixture = createFixture();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.classList).toContain('table-search-host--responsive-width');
    expect(host.classList).toContain('table-search-host--motion-safe');
    expect(host.classList).not.toContain('table-search-host--expanded');
  });

  it('opens immediately from a control click and expands without duplicate opened intent', () => {
    const fixture = createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const searchInput = input(fixture);
    let opened = 0;
    fixture.componentInstance.opened.subscribe(() => opened++);

    (host.querySelector('.table-search__search-icon') as HTMLElement).click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(searchInput);
    expect(host.querySelector('.table-search__overlay')).toBeTruthy();
    expect(host.querySelector('.table-search__fields')).toBeTruthy();
    expect(host.querySelector('.table-search__recent-group')).toBeTruthy();
    expect(host.classList).toContain('table-search-host--focused');
    expect(host.classList).toContain('table-search-host--open');
    expect(host.classList).toContain('table-search-host--expanded');
    expect(opened).toBe(1);

    searchInput.click();
    fixture.detectChanges();
    expect(opened).toBe(1);
  });

  it('keeps the overlay-open search expanded, then collapses only after close and blur', () => {
    const fixture = createFixture();
    const host = fixture.nativeElement as HTMLElement;
    const searchInput = input(fixture);

    expect(host.classList).not.toContain('table-search-host--expanded');
    expect(host.classList).not.toContain('table-search-host--focused');
    expect(host.classList).not.toContain('table-search-host--open');

    searchInput.focus();
    fixture.detectChanges();
    expect(host.classList).toContain('table-search-host--focused');
    expect(host.classList).toContain('table-search-host--open');
    expect(host.classList).toContain('table-search-host--expanded');

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(host.classList).not.toContain('table-search-host--open');
    expect(host.classList).toContain('table-search-host--expanded');

    searchInput.blur();
    fixture.detectChanges();
    expect(host.classList).not.toContain('table-search-host--focused');
    expect(host.classList).not.toContain('table-search-host--expanded');
  });

  it('keeps any non-empty controlled query expanded after the overlay closes and input blurs', () => {
    const fixture = createFixture({ selectedFieldKey: 'name', query: 'Alpha' });
    const host = fixture.nativeElement as HTMLElement;

    expect(host.classList).toContain('table-search-host--expanded');

    input(fixture).focus();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    input(fixture).blur();
    fixture.detectChanges();
    expect(host.classList).not.toContain('table-search-host--open');
    expect(host.classList).not.toContain('table-search-host--focused');
    expect(host.classList).toContain('table-search-host--expanded');

    fixture.componentRef.setInput('query', ' ');
    fixture.detectChanges();
    expect(host.classList).toContain('table-search-host--expanded');

    fixture.componentRef.setInput('query', '');
    fixture.detectChanges();
    expect(host.classList).not.toContain('table-search-host--expanded');
  });

  it('renders translated initial presentation, Iconsax, fields, and valid recent buttons', () => {
    const fixture = createFixture();
    open(fixture);
    const element = fixture.nativeElement as HTMLElement;

    expect(input(fixture).placeholder).toBe('Select search field');
    expect(element.querySelector('iconsax-icon[name="search-normal"]')).toBeTruthy();
    expect(element.querySelectorAll('.table-search__field')).toHaveLength(3);
    expect(
      (element.querySelectorAll('.table-search__field')[2] as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(element.querySelectorAll('.table-search__recent')).toHaveLength(2);
    expect(element.textContent).not.toContain('Hidden');
    expect(element.querySelector('iconsax-icon[name="clock"]')).toBeTruthy();
    expect(element.querySelector('.table-search__clear-recent')).toBeTruthy();
  });

  it('omits empty recent content and optional title when not configured', () => {
    const fixture = createFixture({ recentSearches: [] });
    open(fixture);

    expect(fixture.nativeElement.querySelector('.table-search__recent-group')).toBeNull();
    expect(fixture.nativeElement.querySelector('.table-search__group h2')).toBeNull();
  });

  it('renders selected prefix separately from the controlled query and emits typing and clear', () => {
    const fixture = createFixture({ selectedFieldKey: 'name', query: 'Al' });
    const queries: string[] = [];
    let clears = 0;
    fixture.componentInstance.queryChange.subscribe((value) => queries.push(value));
    fixture.componentInstance.clearSearch.subscribe(() => clears++);
    const searchInput = input(fixture);

    expect(fixture.nativeElement.querySelector('.table-search__prefix').textContent).toContain(
      'Name',
    );
    expect(searchInput.value).toBe('Al');
    expect(searchInput.value).not.toContain('Name');
    searchInput.value = 'Alp';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    (fixture.nativeElement.querySelector('.table-search__clear') as HTMLButtonElement).click();

    expect(queries).toEqual(['Alp']);
    expect(clears).toBe(1);
    expect(fixture.componentInstance.query()).toBe('Al');
    expect(fixture.componentInstance.selectedFieldKey()).toBe('name');
  });

  it('handles unknown selected fields defensively', () => {
    const fixture = createFixture({ selectedFieldKey: 'unknown', query: 'value' });

    expect(fixture.nativeElement.querySelector('.table-search__prefix')).toBeNull();
    expect(input(fixture).readOnly).toBe(true);
  });

  it.each([
    { fields: [{ key: '', label: { key: 'TEST.NAME' } }], error: /Invalid field key/ },
    { fields: [{ key: '   ', label: { key: 'TEST.NAME' } }], error: /Invalid field key/ },
    {
      fields: [FIELDS[0], { ...FIELDS[0] }],
      error: /Duplicate field key "name"/,
    },
  ])('rejects invalid field contracts', ({ fields, error }) => {
    expect(() => createFixture({ fields })).toThrowError(error);
  });

  it.each([
    { recent: [{ id: '', fieldKey: 'name', value: 'A' }], error: /Invalid recent search ID/ },
    { recent: [{ id: ' ', fieldKey: 'name', value: 'A' }], error: /Invalid recent search ID/ },
    { recent: [{ id: 'a', fieldKey: 'name', value: '' }], error: /Invalid recent search value/ },
    { recent: [{ id: 'a', fieldKey: 'name', value: '   ' }], error: /Invalid recent search value/ },
    {
      recent: [RECENT[0], { ...RECENT[0] }],
      error: /Duplicate recent search ID "recent-name"/,
    },
  ])('rejects invalid recent contracts', ({ recent, error }) => {
    expect(() => createFixture({ recentSearches: recent })).toThrowError(error);
  });

  it.each([
    { suggestions: [{ id: '', value: 'A' }], error: /Invalid suggestion ID/ },
    { suggestions: [{ id: ' ', value: 'A' }], error: /Invalid suggestion ID/ },
    { suggestions: [{ id: Number.NaN, value: 'A' }], error: /Invalid suggestion ID/ },
    {
      suggestions: [SUGGESTIONS[0], { ...SUGGESTIONS[0] }],
      error: /Duplicate suggestion ID "alpha"/,
    },
  ])('rejects invalid suggestion contracts without fabricating IDs', ({ suggestions, error }) => {
    expect(() =>
      createFixture({
        selectedFieldKey: 'name',
        query: 'al',
        suggestions,
        suggestionsState: { kind: 'ready' },
      }),
    ).toThrowError(error);
  });

  it('emits field and recent selection payloads from native buttons', () => {
    const fixture = createFixture();
    const fields: string[] = [];
    const recent: TableRecentSearch[] = [];
    fixture.componentInstance.fieldChange.subscribe((value) => fields.push(value));
    fixture.componentInstance.recentSearchSelected.subscribe((value) => recent.push(value));
    open(fixture);
    const element = fixture.nativeElement as HTMLElement;

    (element.querySelector('.table-search__field') as HTMLButtonElement).click();
    (element.querySelector('.table-search__recent') as HTMLButtonElement).click();

    expect(fields).toEqual(['name']);
    expect(recent).toEqual([RECENT[0]]);
    expect(element.querySelector('.table-search__field')?.tagName).toBe('BUTTON');
    expect(element.querySelector('.table-search__recent')?.tagName).toBe('BUTTON');
  });

  it('emits clear recent and retry only when available', () => {
    const fixture = createFixture();
    let clearCount = 0;
    let retryCount = 0;
    fixture.componentInstance.clearRecent.subscribe(() => clearCount++);
    fixture.componentInstance.retry.subscribe(() => retryCount++);
    open(fixture);
    (
      fixture.nativeElement.querySelector('.table-search__clear-recent') as HTMLButtonElement
    ).click();

    fixture.componentRef.setInput('selectedFieldKey', 'name');
    fixture.componentRef.setInput('query', 'al');
    fixture.componentRef.setInput('suggestionsState', { kind: 'error', retryable: true });
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector('.table-search__state--error button') as HTMLButtonElement
    ).click();

    expect(clearCount).toBe(1);
    expect(retryCount).toBe(1);
  });

  it('emits opened and closed once per actual transition and closes outside', () => {
    const fixture = createFixture();
    let opened = 0;
    let closed = 0;
    fixture.componentInstance.opened.subscribe(() => opened++);
    fixture.componentInstance.closed.subscribe(() => closed++);

    open(fixture);
    input(fixture).click();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

    expect(opened).toBe(1);
    expect(closed).toBe(1);
    expect(fixture.nativeElement.querySelector('.table-search__overlay')).toBeNull();
  });

  it('does not close before an internal field action runs', () => {
    const fixture = createFixture();
    const values: string[] = [];
    fixture.componentInstance.fieldChange.subscribe((value) => values.push(value));
    open(fixture);
    const field = fixture.nativeElement.querySelector('.table-search__field') as HTMLButtonElement;

    field.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    field.click();

    expect(values).toEqual(['name']);
    expect(fixture.nativeElement.querySelector('.table-search__overlay')).toBeTruthy();
  });

  it('supports field/recent keyboard navigation without wrapping', () => {
    const fixture = createFixture();
    const selectedFields: string[] = [];
    const selectedRecent: TableRecentSearch[] = [];
    fixture.componentInstance.fieldChange.subscribe((value) => selectedFields.push(value));
    fixture.componentInstance.recentSearchSelected.subscribe((value) => selectedRecent.push(value));
    open(fixture);

    key(fixture, 'ArrowDown');
    expect(activeControl(fixture)?.textContent).toContain('Name');
    key(fixture, 'ArrowUp');
    expect(activeControl(fixture)?.textContent).toContain('Name');
    key(fixture, 'Enter');
    expect(selectedFields).toEqual(['name']);

    key(fixture, 'End');
    expect(activeControl(fixture)?.textContent).toContain('A-1');
    key(fixture, 'ArrowDown');
    expect(activeControl(fixture)?.textContent).toContain('A-1');
    key(fixture, 'Enter');
    expect(selectedRecent).toEqual([RECENT[1]]);

    key(fixture, 'Home');
    expect(activeControl(fixture)?.textContent).toContain('Name');
  });

  it('does not trap Tab and Escape closes while restoring focus', () => {
    const fixture = createFixture();
    open(fixture);
    const tab = key(fixture, 'Tab');
    expect(tab.defaultPrevented).toBe(false);

    input(fixture).blur();
    key(fixture, 'Escape');
    expect(document.activeElement).toBe(input(fixture));
    expect(fixture.nativeElement.querySelector('.table-search__overlay')).toBeNull();
  });

  it('renders ready suggestions with listbox semantics and stable safe IDs', () => {
    const fixture = suggestionFixture();
    open(fixture);
    const element = fixture.nativeElement as HTMLElement;
    const listbox = element.querySelector('[role="listbox"]') as HTMLElement;
    const options = element.querySelectorAll('[role="option"]');

    expect(input(fixture).getAttribute('role')).toBe('combobox');
    expect(input(fixture).getAttribute('aria-expanded')).toBe('true');
    expect(input(fixture).getAttribute('aria-controls')).toBe(listbox.id);
    expect(input(fixture).getAttribute('aria-autocomplete')).toBe('list');
    expect(options).toHaveLength(3);
    expect(options[0].id).toMatch(/^table-search-\d+-option-s-alpha$/);
    expect(options[2].id).toMatch(/-option-n-0$/);
    expect(Array.from(options).map((option) => option.textContent?.trim())).toEqual([
      'Alpha',
      'Alpine',
      'Zero',
    ]);
  });

  it('navigates suggestions by ID, preserves valid active IDs, and selects by keyboard', () => {
    const fixture = suggestionFixture();
    const selected: TableSearchSuggestion<string>[] = [];
    fixture.componentInstance.suggestionSelected.subscribe((value) => selected.push(value));
    open(fixture);

    key(fixture, 'ArrowDown');
    expect(activeOption(fixture)?.textContent).toContain('Alpha');
    const activeId = input(fixture).getAttribute('aria-activedescendant');
    key(fixture, 'ArrowDown');
    expect(activeOption(fixture)?.textContent).toContain('Alpine');
    key(fixture, 'ArrowUp');
    expect(input(fixture).getAttribute('aria-activedescendant')).toBe(activeId);

    fixture.componentRef.setInput('suggestions', [
      { id: 'alpha', value: 'Updated Alpha' },
      { id: 'other', value: 'Other' },
    ]);
    fixture.detectChanges();
    expect(input(fixture).getAttribute('aria-activedescendant')).toBe(activeId);
    key(fixture, 'End');
    expect(activeOption(fixture)?.textContent).toContain('Other');
    key(fixture, 'Home');
    key(fixture, 'Enter');

    expect(selected[0].id).toBe('alpha');
    expect(fixture.nativeElement.querySelector('.table-search__overlay')).toBeNull();
  });

  it('does not emit Enter without an active suggestion and pointer emits the same payload', () => {
    const fixture = suggestionFixture();
    const selected: TableSearchSuggestion<string>[] = [];
    fixture.componentInstance.suggestionSelected.subscribe((value) => selected.push(value));
    open(fixture);

    key(fixture, 'Enter');
    expect(selected).toEqual([]);
    const option = fixture.nativeElement.querySelector('[role="option"]') as HTMLButtonElement;
    option.dispatchEvent(new Event('pointerenter'));
    option.click();
    expect(selected).toEqual([SUGGESTIONS[0]]);
  });

  it.each<TableSearchSuggestionsState>([
    { kind: 'loading' },
    { kind: 'empty' },
    { kind: 'error', retryable: true },
  ])('clears stale active suggestions for $kind state', (state) => {
    const fixture = suggestionFixture();
    open(fixture);
    key(fixture, 'ArrowDown');
    expect(input(fixture).getAttribute('aria-activedescendant')).toBeTruthy();

    fixture.componentRef.setInput('suggestionsState', state);
    fixture.detectChanges();

    expect(input(fixture).getAttribute('aria-activedescendant')).toBeNull();
    key(fixture, 'Enter');
  });

  it('clears active state when its stable ID disappears', () => {
    const fixture = suggestionFixture();
    open(fixture);
    key(fixture, 'ArrowDown');
    fixture.componentRef.setInput('suggestions', [{ id: 'different', value: 'Different' }]);
    fixture.detectChanges();

    expect(input(fixture).getAttribute('aria-activedescendant')).toBeNull();
  });

  it('renders loading, defensive ready-empty, empty, and error with correct live semantics', () => {
    const fixture = createFixture({ selectedFieldKey: 'name', query: 'al' });
    open(fixture);

    fixture.componentRef.setInput('suggestionsState', { kind: 'loading' });
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[role="status"][aria-live="polite"]'),
    ).toHaveLength(1);

    fixture.componentRef.setInput('suggestionsState', { kind: 'ready' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'No suggestions',
    );

    fixture.componentRef.setInput('suggestionsState', { kind: 'empty' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeTruthy();

    fixture.componentRef.setInput('suggestionsState', { kind: 'error', retryable: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[role="alert"] button')).toBeNull();
  });

  it('disables every interaction, closes open content, and emits nothing', () => {
    const fixture = createFixture();
    const events: unknown[] = [];
    fixture.componentInstance.opened.subscribe(() => events.push('opened'));
    fixture.componentInstance.fieldChange.subscribe((value) => events.push(value));
    open(fixture);
    events.length = 0;
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    input(fixture).click();
    key(fixture, 'ArrowDown');
    expect(input(fixture).disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.table-search__overlay')).toBeNull();
    expect(events).toEqual([]);
  });

  it('uses unique IDs and preserves configured order in RTL', () => {
    document.documentElement.dir = 'rtl';
    const first = createFixture();
    open(first);
    expect(
      Array.from(
        first.nativeElement.querySelectorAll('.table-search__field') as NodeListOf<HTMLElement>,
      ).map((item) => item.textContent?.trim()),
    ).toEqual(['Name', 'Code', 'Disabled']);
    expect(
      Array.from(
        first.nativeElement.querySelectorAll('.table-search__recent') as NodeListOf<HTMLElement>,
      ).map((item) => item.textContent?.replace(/\s+/g, ' ').trim()),
    ).toEqual(['Name / Alpha', 'Code / A-1']);

    const second = createFixture();
    open(second);
    expect(input(first).id).not.toBe(input(second).id);
  });

  it('hides every decorative icon from assistive technology and uses no PrimeIcons', () => {
    const fixture = createFixture({ selectedFieldKey: 'name', query: 'al' });
    open(fixture);
    fixture.componentRef.setInput('suggestionsState', { kind: 'error', retryable: true });
    fixture.detectChanges();
    const icons = fixture.nativeElement.querySelectorAll('iconsax-icon') as NodeListOf<HTMLElement>;

    expect(Array.from(icons).every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(
      true,
    );
    expect(fixture.nativeElement.querySelector('.pi')).toBeNull();
  });
});

@Component({
  imports: [TableSearchComponent, TableSearchOptionDefDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <app-table-search
      [fields]="fields"
      selectedFieldKey="name"
      query="al"
      [suggestions]="suggestions"
      [suggestionsState]="{ kind: 'ready' }"
    >
      <ng-template
        appTableSearchOptionDef
        [appTableSearchOptionDefOf]="suggestions"
        let-item
        let-suggestion="suggestion"
        let-value="value"
        let-index="index"
        let-active="active"
      >
        {{ item.name }}|{{ suggestion.id }}|{{ value.name }}|{{ index }}|{{ active }}
      </ng-template>
    </app-table-search>
  `,
})
class ProjectedHostComponent {
  readonly fields = FIELDS;
  readonly suggestions: readonly TableSearchSuggestion<{ readonly name: string }>[] = [
    { id: 'typed', value: { name: 'Typed result' } },
  ];
}

describe('TableSearch projected options', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProjectedHostComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', translations());
  });

  it('renders the complete strictly typed projected context and updates active state', () => {
    const fixture = TestBed.createComponent(ProjectedHostComponent);
    fixture.detectChanges();
    const searchInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    searchInput.focus();
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="option"]').textContent).toContain(
      'Typed result|typed|Typed result|0|true',
    );
  });
});

interface FixtureOptions {
  readonly fields?: readonly TableSearchField[];
  readonly selectedFieldKey?: string | null;
  readonly query?: string;
  readonly suggestions?: readonly TableSearchSuggestion<string>[];
  readonly suggestionsState?: TableSearchSuggestionsState;
  readonly recentSearches?: readonly TableRecentSearch[];
}

function createFixture(
  options: FixtureOptions = {},
): ComponentFixture<TableSearchComponent<string>> {
  const fixture = TestBed.createComponent(TableSearchComponent<string>);
  fixture.componentRef.setInput('fields', options.fields ?? FIELDS);
  fixture.componentRef.setInput('selectedFieldKey', options.selectedFieldKey ?? null);
  fixture.componentRef.setInput('query', options.query ?? '');
  fixture.componentRef.setInput('suggestions', options.suggestions ?? []);
  fixture.componentRef.setInput('suggestionsState', options.suggestionsState ?? { kind: 'idle' });
  fixture.componentRef.setInput('recentSearches', options.recentSearches ?? RECENT);
  fixture.detectChanges();
  return fixture;
}

function suggestionFixture(): ComponentFixture<TableSearchComponent<string>> {
  return createFixture({
    selectedFieldKey: 'name',
    query: 'al',
    suggestions: SUGGESTIONS,
    suggestionsState: { kind: 'ready' },
  });
}

function input(fixture: ComponentFixture<TableSearchComponent<string>>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input') as HTMLInputElement;
}

function open(fixture: ComponentFixture<TableSearchComponent<string>>): void {
  input(fixture).focus();
  fixture.detectChanges();
}

function key(
  fixture: ComponentFixture<TableSearchComponent<string>>,
  value: string,
): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: value, bubbles: true, cancelable: true });
  input(fixture).dispatchEvent(event);
  fixture.detectChanges();
  return event;
}

function activeControl(
  fixture: ComponentFixture<TableSearchComponent<string>>,
): HTMLElement | null {
  return fixture.nativeElement.querySelector(
    '.table-search__field--active, .table-search__recent--active',
  );
}

function activeOption(fixture: ComponentFixture<TableSearchComponent<string>>): HTMLElement | null {
  return fixture.nativeElement.querySelector('.table-search__suggestion--active');
}

function translations() {
  return {
    STARLINKS: {
      TABLE: {
        MISSING_VALUE: 'Not available',
        SEARCH: {
          SELECT_FIELD: 'Select search field',
          SEARCH_PLACEHOLDER: 'Search',
          RECENT_SEARCHES: 'Recent searches',
          CLEAR_RECENT: 'Clear recent',
          CLEAR_SEARCH: 'Clear search',
          SUGGESTIONS: 'Suggestions',
          LOADING: 'Loading suggestions',
          NO_RESULTS: 'No suggestions found',
          NO_RESULTS_DESCRIPTION: 'Try a different value.',
          ERROR: 'Unable to load suggestions',
          RETRY: 'Retry',
          SEPARATOR: '/',
          COMBOBOX_LABEL: 'Table search',
          FIELD_GROUP_LABEL: 'Search fields',
          SUGGESTIONS_LIST_LABEL: 'Search suggestions',
        },
      },
    },
    TEST: { NAME: 'Name', CODE: 'Code', DISABLED: 'Disabled' },
  };
}
