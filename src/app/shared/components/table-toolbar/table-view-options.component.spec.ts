import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import {
  TableFilterField,
  TableFilterModel,
  TableViewOption,
  TableViewOptionChange,
  TableViewOptionOrderChange,
} from './table-toolbar.types';
import { TableViewOptionsComponent } from './table-view-options.component';

const OPTIONS: readonly TableViewOption[] = Object.freeze([
  Object.freeze({ key: 'name', label: { key: 'TEST.NAME' }, visible: true }),
  Object.freeze({ key: 'service', label: { key: 'TEST.SERVICE' }, visible: true }),
  Object.freeze({ key: 'status', label: { key: 'TEST.STATUS' }, visible: false }),
]);

const FILTER_FIELDS: readonly TableFilterField[] = Object.freeze([
  Object.freeze({
    key: 'statusFilter',
    kind: 'multiple-select',
    presentation: 'chips',
    label: { key: 'TEST.STATUS' },
    options: Object.freeze([
      Object.freeze({ value: 'open', label: { key: 'TEST.OPEN' }, tone: 'success' }),
      Object.freeze({ value: 'closed', label: { key: 'TEST.CLOSED' }, tone: 'danger' }),
    ]),
  }),
  Object.freeze({
    key: 'serviceFilter',
    kind: 'single-select',
    presentation: 'segments',
    label: { key: 'TEST.SERVICES' },
    clearOption: { value: '__all__', label: { key: 'TEST.ALL' } },
    options: Object.freeze([
      Object.freeze({ value: 'freight', label: { key: 'TEST.FREIGHT' } }),
      Object.freeze({ value: 'last-mile', label: { key: 'TEST.LAST_MILE' } }),
    ]),
  }),
  Object.freeze({
    key: 'periodFilter',
    kind: 'single-select',
    presentation: 'segments',
    label: { key: 'TEST.PERIOD' },
    options: Object.freeze([
      Object.freeze({ value: '7', label: { key: 'TEST.SEVEN' } }),
      Object.freeze({ value: '30', label: { key: 'TEST.THIRTY' } }),
    ]),
  }),
]);

const FILTER_DRAFT: TableFilterModel = Object.freeze({
  statusFilter: Object.freeze([]),
  serviceFilter: null,
  periodFilter: null,
});

describe('TableViewOptionsComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TableViewOptionsComponent],
      providers: [provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });
    TestBed.inject(TranslateService).setTranslation('en', translations());
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
    document.body.style.overflow = '';
  });

  it('uses immutable controlled options and default inputs', () => {
    const fixture = createFixture();
    expect(fixture.componentInstance.options()).toBe(OPTIONS);
    expect(fixture.componentInstance.disabled()).toBe(false);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(fixture.componentInstance.filterFields()).toBe(FILTER_FIELDS);
    expect(fixture.componentInstance.draftValue()).toBe(FILTER_DRAFT);
    expect(fixture.componentInstance.title()).toEqual({
      key: 'STARLINKS.TABLE.VIEW_OPTIONS.TITLE',
    });
    expect(Object.isFrozen(OPTIONS)).toBe(true);
  });

  it.each([
    { options: [{ key: '', label: { key: 'TEST.NAME' }, visible: true }], error: /Invalid/ },
    { options: [{ key: '  ', label: { key: 'TEST.NAME' }, visible: true }], error: /Invalid/ },
    { options: [OPTIONS[0], { ...OPTIONS[0] }], error: /Duplicate/ },
    {
      options: [{ key: 'name', label: { key: 'TEST.NAME' }, visible: false }],
      error: /one option/,
    },
    {
      options: [
        { key: 'actions', label: { key: 'TEST.ACTIONS' }, visible: false, hideable: false },
      ],
      error: /must be visible/,
    },
  ])('rejects invalid option contracts', ({ options, error }) => {
    expect(() => createFixture(options)).toThrowError(error);
  });

  it('opens the shared side drawer and removes the legacy popover and checkbox UI', async () => {
    const fixture = createFixture();
    const trigger = getTrigger(fixture);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.querySelector('iconsax-icon[name="sort"][type="linear"]')).toBeTruthy();
    await open(fixture);

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.side-drawer__backdrop')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.toolbar-panel')).toBeNull();
    expect(fixture.nativeElement.querySelector('input[type="checkbox"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.pi')).toBeNull();
  });

  it('renders configured order, drag handles, exact visibility icons, and translated labels', async () => {
    const fixture = createFixture();
    await open(fixture);
    const rows = [
      ...fixture.nativeElement.querySelectorAll('.view-options__option'),
    ] as HTMLElement[];

    expect(rows.map((row) => row.dataset['columnKey'])).toEqual(['name', 'service', 'status']);
    expect(rows).toHaveLength(3);
    expect(rows[0].querySelector('iconsax-icon[name="menu"]')).toBeTruthy();
    expect(rows[0].querySelector('iconsax-icon[name="eye"]')).toBeTruthy();
    expect(rows[2].querySelector('iconsax-icon[name="eye-slash"]')).toBeTruthy();
    expect(rows[2].classList).toContain('view-options__option--hidden');
    expect(rows[0].querySelector('.view-options__visibility')?.getAttribute('aria-label')).toBe(
      'Hide Name column',
    );
  });

  it('renders one unified drawer with Table content, Status, Services, Period and one footer', async () => {
    const fixture = createFixture();
    await open(fixture);
    const headings = [...fixture.nativeElement.querySelectorAll('.view-options__section h3')].map(
      (heading) => (heading as HTMLElement).textContent?.trim(),
    );

    expect(fixture.nativeElement.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(headings).toEqual(['Table content', 'Status', 'Services', 'Period']);
    expect(fixture.nativeElement.querySelectorAll('.side-drawer__footer')).toHaveLength(1);
    expect(fixture.nativeElement.querySelectorAll('.view-options__apply')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('.side-drawer--inset')).toBeTruthy();
  });

  it('renders Status as full-width rows with toned badges and controlled visibility buttons', async () => {
    const fixture = createFixture();
    await open(fixture);
    const rows = [
      ...fixture.nativeElement.querySelectorAll('.view-options__status-option'),
    ] as HTMLElement[];

    expect(rows).toHaveLength(2);
    expect(
      rows.map((row) => row.querySelector('.view-options__status-badge')?.textContent?.trim()),
    ).toEqual(['Open', 'Closed']);
    expect(rows[0].querySelector('.view-options__status-badge[data-tone="success"]')).toBeTruthy();
    expect(rows[1].querySelector('.view-options__status-badge[data-tone="danger"]')).toBeTruthy();
    expect(
      rows[0].querySelector('.view-options__status-toggle[aria-pressed="false"]'),
    ).toBeTruthy();
    expect(rows[0].querySelector('iconsax-icon[name="eye-slash"]')).toBeTruthy();
  });

  it('emits controlled compact-filter drafts and applies without mutating inputs', async () => {
    const fixture = createFixture();
    const drafts: TableFilterModel[] = [];
    const applied: TableFilterModel[] = [];
    fixture.componentInstance.draftChange.subscribe((value) => drafts.push(value));
    fixture.componentInstance.apply.subscribe((value) => applied.push(value));
    await open(fixture);

    (
      fixture.nativeElement.querySelector('.view-options__status-toggle') as HTMLButtonElement
    ).click();
    expect(drafts[0]['statusFilter']).toEqual(['open']);
    expect(fixture.componentInstance.draftValue()).toBe(FILTER_DRAFT);

    fixture.componentRef.setInput('draftValue', drafts[0]);
    fixture.detectChanges();
    (
      fixture.nativeElement
        .querySelectorAll('.view-options__segments')[0]
        .querySelectorAll('button')[1] as HTMLButtonElement
    ).click();
    expect(drafts[1]['serviceFilter']).toBe('freight');

    fixture.componentRef.setInput('draftValue', drafts[1]);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.view-options__apply') as HTMLButtonElement).click();
    expect(applied).toEqual([drafts[1]]);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('emits visibility intent without mutating options and blocks hiding the final visible column', async () => {
    const fixture = createFixture();
    const changes: TableViewOptionChange[] = [];
    fixture.componentInstance.optionChange.subscribe((value) => changes.push(value));
    await open(fixture);
    const buttons = fixture.nativeElement.querySelectorAll('.view-options__visibility');
    (buttons[0] as HTMLButtonElement).click();

    expect(changes).toEqual([{ key: 'name', visible: false }]);
    expect(OPTIONS[0].visible).toBe(true);

    const single = createFixture([{ key: 'only', label: { key: 'TEST.NAME' }, visible: true }]);
    await open(single);
    expect(
      (single.nativeElement.querySelector('.view-options__visibility') as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it('emits Show all only when needed and preserves the configured order', async () => {
    const fixture = createFixture();
    let requests = 0;
    fixture.componentInstance.showAll.subscribe(() => requests++);
    await open(fixture);
    (fixture.nativeElement.querySelector('.view-options__show-all') as HTMLButtonElement).click();

    expect(requests).toBe(1);
    expect(fixture.componentInstance.options().map((option) => option.key)).toEqual([
      'name',
      'service',
      'status',
    ]);
  });

  it('emits immutable pointer reorder intent', async () => {
    const fixture = createFixture();
    const orders: TableViewOptionOrderChange[] = [];
    fixture.componentInstance.orderChange.subscribe((value) => orders.push(value));
    await open(fixture);
    const rows = fixture.nativeElement.querySelectorAll('.view-options__option');
    (rows[0].querySelector('.view-options__drag-handle') as HTMLElement).dispatchEvent(
      new Event('dragstart', { bubbles: true }),
    );
    rows[2].dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }));

    expect(orders[0].orderedKeys).toEqual(['service', 'status', 'name']);
    expect(Object.isFrozen(orders[0].orderedKeys)).toBe(true);
    expect(OPTIONS.map((option) => option.key)).toEqual(['name', 'service', 'status']);
  });

  it('provides explicit keyboard-accessible Move Up and Move Down actions', async () => {
    const fixture = createFixture();
    const orders: TableViewOptionOrderChange[] = [];
    fixture.componentInstance.orderChange.subscribe((value) => orders.push(value));
    await open(fixture);
    const handle = fixture.nativeElement.querySelectorAll(
      '.view-options__drag-handle',
    )[1] as HTMLButtonElement;
    handle.click();
    fixture.detectChanges();
    const up = fixture.nativeElement.querySelector(
      '.view-options__keyboard-actions button',
    ) as HTMLButtonElement;
    expect(up.getAttribute('aria-label')).toBe('Move Service column up');
    up.click();

    expect(orders[0].orderedKeys).toEqual(['service', 'name', 'status']);
  });

  it('closes through the drawer, restores the controlled trigger state, and emits transitions once', async () => {
    const fixture = createFixture();
    let opened = 0;
    let closed = 0;
    fixture.componentInstance.opened.subscribe(() => opened++);
    fixture.componentInstance.closed.subscribe(() => closed++);
    await open(fixture);
    (fixture.nativeElement.querySelector('.side-drawer__close') as HTMLButtonElement).click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 210));

    expect(opened).toBe(1);
    expect(closed).toBe(1);
    expect(getTrigger(fixture).getAttribute('aria-expanded')).toBe('false');
  });

  it('preserves configured order in Arabic RTL while the drawer still uses physical-right hooks', async () => {
    document.documentElement.dir = 'rtl';
    const fixture = createFixture();
    await open(fixture);
    const keys = [...fixture.nativeElement.querySelectorAll('.view-options__option')].map(
      (row) => (row as HTMLElement).dataset['columnKey'],
    );
    expect(keys).toEqual(['name', 'service', 'status']);
    expect(fixture.nativeElement.querySelector('.side-drawer')).toBeTruthy();
  });
});

function createFixture(options: readonly TableViewOption[] = OPTIONS) {
  const fixture = TestBed.createComponent(TableViewOptionsComponent);
  fixture.componentRef.setInput('options', options);
  fixture.componentRef.setInput('filterFields', FILTER_FIELDS);
  fixture.componentRef.setInput('draftValue', FILTER_DRAFT);
  fixture.detectChanges();
  return fixture;
}

async function open(fixture: ComponentFixture<TableViewOptionsComponent>): Promise<void> {
  getTrigger(fixture).focus();
  getTrigger(fixture).click();
  fixture.detectChanges();
  await Promise.resolve();
  fixture.detectChanges();
}

function getTrigger(fixture: ComponentFixture<TableViewOptionsComponent>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('.toolbar-trigger') as HTMLButtonElement;
}

function translations() {
  return {
    STARLINKS: {
      DRAWER: { CLOSE: 'Close drawer' },
      TABLE: {
        VIEW_OPTIONS: {
          TITLE: 'View options',
          TRIGGER: 'View options',
          TABLE_CONTENT: 'Table content',
          SHOW_ALL: 'Show all',
          HIDE_COLUMN: 'Hide {{column}} column',
          SHOW_COLUMN: 'Show {{column}} column',
          REORDER_COLUMN: 'Reorder {{column}} column',
          REORDER_INSTRUCTIONS: 'Drag or use reorder controls.',
          MOVE_UP: 'Move {{column}} column up',
          MOVE_DOWN: 'Move {{column}} column down',
        },
        FILTERS: { APPLY: 'Apply' },
      },
    },
    TEST: {
      NAME: 'Name',
      SERVICE: 'Service',
      STATUS: 'Status',
      SERVICES: 'Services',
      PERIOD: 'Period',
      ACTIONS: 'Actions',
      OPEN: 'Open',
      CLOSED: 'Closed',
      ALL: 'All',
      FREIGHT: 'Freight forward',
      LAST_MILE: 'Last mile',
      SEVEN: 'Last 7 Days',
      THIRTY: 'Last 30 Days',
    },
  };
}
