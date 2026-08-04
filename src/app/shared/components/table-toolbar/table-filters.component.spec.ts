import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TableFiltersComponent } from './table-filters.component';
import { TableFilterField, TableFilterModel } from './table-toolbar.types';

const FIELDS: readonly TableFilterField[] = Object.freeze([
  Object.freeze({
    key: 'status',
    kind: 'multiple-select',
    presentation: 'chips',
    label: { key: 'TEST.STATUS' },
    options: Object.freeze([
      Object.freeze({ value: 'open', label: { key: 'TEST.OPEN' }, tone: 'success' }),
      Object.freeze({ value: 'closed', label: { key: 'TEST.CLOSED' }, tone: 'danger' }),
    ]),
  }),
  Object.freeze({
    key: 'service',
    kind: 'single-select',
    presentation: 'segments',
    label: { key: 'TEST.SERVICE' },
    clearOption: { value: '__all__', label: { key: 'STARLINKS.TABLE.FILTERS.ALL' } },
    options: Object.freeze([
      Object.freeze({ value: 'first', label: { key: 'TEST.FIRST' } }),
      Object.freeze({ value: 'second', label: { key: 'TEST.SECOND' } }),
    ]),
  }),
  Object.freeze({
    key: 'period',
    kind: 'single-select',
    presentation: 'segments',
    label: { key: 'TEST.PERIOD' },
    options: Object.freeze([
      Object.freeze({ value: '7', label: { key: 'TEST.SEVEN' } }),
      Object.freeze({ value: '30', label: { key: 'TEST.THIRTY' } }),
    ]),
  }),
  Object.freeze({ key: 'name', kind: 'text', label: { key: 'TEST.NAME' } }),
  Object.freeze({ key: 'date', kind: 'date', label: { key: 'TEST.DATE' } }),
  Object.freeze({
    key: 'location',
    kind: 'single-select',
    label: { key: 'TEST.LOCATION' },
    options: Object.freeze([Object.freeze({ value: 'north', label: { key: 'TEST.NORTH' } })]),
  }),
]);

const DRAFT: TableFilterModel = Object.freeze({
  status: Object.freeze(['open']),
  service: 'first',
  period: null,
  name: 'Alpha',
  date: '2026-08-01',
  location: null,
  unknown: 'preserved',
});

describe('TableFiltersComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableFiltersComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', translations());
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
    document.body.style.overflow = '';
  });

  it('uses immutable controlled required/default inputs', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance.fields()).toBe(FIELDS);
    expect(fixture.componentInstance.draftValue()).toBe(DRAFT);
    expect(fixture.componentInstance.activeCount()).toBe(0);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(Object.isFrozen(FIELDS)).toBe(true);
    expect(Object.isFrozen(DRAFT)).toBe(true);
  });

  it.each([
    { fields: [{ key: '', kind: 'text', label: { key: 'TEST.NAME' } }], error: /Invalid/ },
    { fields: [{ key: ' ', kind: 'text', label: { key: 'TEST.NAME' } }], error: /Invalid/ },
    { fields: [FIELDS[0], { ...FIELDS[0] }], error: /Duplicate/ },
    { fields: [{ key: 'x', kind: 'unknown', label: { key: 'TEST.NAME' } }], error: /Unsupported/ },
    {
      fields: [{ key: 'x', kind: 'single-select', label: { key: 'TEST.NAME' }, options: [] }],
      error: /at least one/,
    },
    {
      fields: [
        {
          key: 'x',
          kind: 'multiple-select',
          label: { key: 'TEST.NAME' },
          options: [
            { value: 'a', label: { key: 'TEST.FIRST' } },
            { value: 'a', label: { key: 'TEST.SECOND' } },
          ],
        },
      ],
      error: /Duplicate option/,
    },
  ])(
    'rejects invalid field contracts',
    ({ fields, error }: { fields: readonly unknown[]; error: RegExp }) => {
      expect(() => createFixture({ fields: fields as readonly TableFilterField[] })).toThrowError(
        error,
      );
    },
  );

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid activeCount %s',
    (activeCount) => {
      expect(() => createFixture({ activeCount })).toThrowError(/finite non-negative integer/);
    },
  );

  it('opens as a shared drawer with compact Status, Services, Period, detailed filters, and sticky footer', async () => {
    const fixture = createFixture({ activeCount: 2 });
    await open(fixture);

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.toolbar-panel')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.filters__section')).toHaveLength(4);
    expect(fixture.nativeElement.querySelectorAll('.filters__chips button')).toHaveLength(2);
    expect(fixture.nativeElement.querySelectorAll('.filters__segments')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('input[type="text"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[type="date"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('select')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[sideDrawerFooter] .filters__apply')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.filters__count').textContent).toBe('2');
    expect(fixture.nativeElement.querySelector('.pi')).toBeNull();
  });

  it('emits complete immutable chip and segment drafts without applying them', async () => {
    const fixture = createFixture({ activeCount: 1 });
    const values: TableFilterModel[] = [];
    const applied: TableFilterModel[] = [];
    fixture.componentInstance.draftChange.subscribe((value) => values.push(value));
    fixture.componentInstance.apply.subscribe((value) => applied.push(value));
    await open(fixture);
    const statusButtons = fixture.nativeElement.querySelectorAll('.filters__chips button');
    (statusButtons[1] as HTMLButtonElement).click();
    const serviceButtons = fixture.nativeElement
      .querySelectorAll('.filters__segments')[0]
      .querySelectorAll('button');
    (serviceButtons[0] as HTMLButtonElement).click();

    expect(values[0]['status']).toEqual(['open', 'closed']);
    expect(values[0]['unknown']).toBe('preserved');
    expect(values[1]['service']).toBeNull();
    expect(Object.isFrozen(values[0])).toBe(true);
    expect(applied).toEqual([]);
    expect(fixture.nativeElement.querySelector('.filters__count').textContent).toBe('1');
    expect(DRAFT['status']).toEqual(['open']);
  });

  it('emits controlled detailed text, date, and select changes while preserving unknown keys', async () => {
    const fixture = createFixture();
    const values: TableFilterModel[] = [];
    fixture.componentInstance.draftChange.subscribe((value) => values.push(value));
    await open(fixture);
    const text = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    text.value = 'Beta';
    text.dispatchEvent(new Event('input', { bubbles: true }));
    const date = fixture.nativeElement.querySelector('input[type="date"]') as HTMLInputElement;
    date.value = '';
    date.dispatchEvent(new Event('change', { bubbles: true }));
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = 'north';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(values[0]['name']).toBe('Beta');
    expect(values[1]['date']).toBeNull();
    expect(values[2]['location']).toBe('north');
    expect(values.every((value) => value['unknown'] === 'preserved')).toBe(true);
  });

  it('Apply emits the controlled model and starts drawer close exactly once', async () => {
    const fixture = createFixture();
    const applied: TableFilterModel[] = [];
    let closed = 0;
    fixture.componentInstance.apply.subscribe((value) => applied.push(value));
    fixture.componentInstance.closed.subscribe(() => closed++);
    await open(fixture);
    (fixture.nativeElement.querySelector('.filters__apply') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(applied).toEqual([DRAFT]);
    expect(closed).toBe(1);
    expect(getTrigger(fixture).getAttribute('aria-expanded')).toBe('false');
    expect(fixture.nativeElement.querySelector('[data-phase="closing"]')).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve, 210));
  });

  it('Reset emits only reset, remains open, and reflects parent draft replacement', async () => {
    const fixture = createFixture();
    let resets = 0;
    fixture.componentInstance.reset.subscribe(() => resets++);
    await open(fixture);
    (fixture.nativeElement.querySelector('.filters__reset') as HTMLButtonElement).click();
    fixture.componentRef.setInput('draftValue', Object.freeze({ name: '', status: [] }));
    fixture.detectChanges();

    expect(resets).toBe(1);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement).value,
    ).toBe('');
  });

  it('closes from backdrop and Escape, restores focus, and blocks disabled interaction', async () => {
    const fixture = createFixture();
    await open(fixture);
    (fixture.nativeElement.querySelector('.side-drawer__backdrop') as HTMLElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 210));
    await Promise.resolve();
    expect(document.activeElement).toBe(getTrigger(fixture));

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    getTrigger(fixture).click();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('preserves configured option order and physical-right drawer behavior in Arabic RTL', async () => {
    document.documentElement.dir = 'rtl';
    const fixture = createFixture();
    await open(fixture);
    const labels = [...fixture.nativeElement.querySelectorAll('.filters__section h3')].map((item) =>
      item.textContent?.trim(),
    );
    expect(labels.slice(0, 3)).toEqual(['Status', 'Service', 'Period']);
    expect(fixture.nativeElement.querySelector('.side-drawer')).toBeTruthy();
  });
});

function createFixture(
  config: {
    fields?: readonly TableFilterField[];
    draft?: TableFilterModel;
    activeCount?: number;
  } = {},
) {
  const fixture = TestBed.createComponent(TableFiltersComponent);
  fixture.componentRef.setInput('fields', config.fields ?? FIELDS);
  fixture.componentRef.setInput('draftValue', config.draft ?? DRAFT);
  fixture.componentRef.setInput('activeCount', config.activeCount ?? 0);
  fixture.detectChanges();
  return fixture;
}

async function open(fixture: ComponentFixture<TableFiltersComponent>): Promise<void> {
  getTrigger(fixture).focus();
  getTrigger(fixture).click();
  fixture.detectChanges();
  await Promise.resolve();
  fixture.detectChanges();
}

function getTrigger(fixture: ComponentFixture<TableFiltersComponent>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.toolbar-trigger') as HTMLButtonElement;
}

function translations() {
  return {
    STARLINKS: {
      DRAWER: { CLOSE: 'Close drawer' },
      TABLE: {
        FILTERS: {
          TITLE: 'Filters',
          TRIGGER: 'Filters',
          RESET: 'Reset',
          APPLY: 'Apply',
          ACTIVE_FILTERS: '{{count}} active filters',
          SELECT_PLACEHOLDER: 'Select an option',
          NO_FILTERS: 'No filters',
          ALL: 'All',
          DETAILS: 'More filters',
        },
      },
    },
    TEST: {
      NAME: 'Name',
      SERVICE: 'Service',
      STATUS: 'Status',
      PERIOD: 'Period',
      DATE: 'Date',
      LOCATION: 'Location',
      FIRST: 'First',
      SECOND: 'Second',
      OPEN: 'Open',
      CLOSED: 'Closed',
      SEVEN: 'Seven',
      THIRTY: 'Thirty',
      NORTH: 'North',
    },
  };
}
