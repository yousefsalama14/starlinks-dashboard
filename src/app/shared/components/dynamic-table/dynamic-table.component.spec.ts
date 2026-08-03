import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { DynamicTableComponent } from './dynamic-table.component';
import {
  DynamicTableColumn,
  TableActionEvent,
  TableDataState,
  TablePageChange,
  TableSort,
  TableViewState,
} from './dynamic-table.types';
import { TableCellDefDirective } from './table-cell-def.directive';
import { formatTableDate } from './formatters/table-date-format';
import { formatTableNumber } from './formatters/table-number-format';
import { TableHeaderDefDirective } from './table-header-def.directive';

interface TestRow {
  readonly id: string | number;
  readonly name: string | null | undefined;
  readonly secondary?: string;
  readonly nested?: { readonly label: string };
  readonly count?: number;
  readonly active?: boolean;
  readonly createdAt?: Date | string | number | null;
}

const BASE_ROWS: readonly TestRow[] = Object.freeze([
  Object.freeze({ id: 0, name: 'Alpha', secondary: 'A-1', count: 0, active: false }),
  Object.freeze({ id: 'second', name: 'Beta', secondary: 'B-2', count: 2, active: true }),
]);

const BASE_COLUMNS: readonly DynamicTableColumn<TestRow>[] = Object.freeze([
  Object.freeze({
    key: 'name',
    label: { key: 'TEST.NAME' },
    type: 'text' as const,
    field: 'name' as const,
    sortable: true,
  }),
  Object.freeze({
    key: 'secondary',
    label: { key: 'TEST.SECONDARY' },
    type: 'text' as const,
    field: 'secondary' as const,
  }),
]);

@Component({
  imports: [DynamicTableComponent],
  template: `
    <app-dynamic-table
      [rows]="rows"
      [columns]="columns"
      rowIdentity="id"
      [state]="state"
      [caption]="caption"
    />
  `,
})
class TypedHostComponent {
  readonly rows = BASE_ROWS;
  readonly columns = BASE_COLUMNS;
  readonly state: TableDataState = { kind: 'ready' };
  readonly caption = { key: 'TEST.CAPTION' } as const;
}

@Component({
  imports: [DynamicTableComponent, TableCellDefDirective, TableHeaderDefDirective],
  template: `
    <app-dynamic-table
      [rows]="rows"
      [columns]="columns"
      rowIdentity="id"
      [state]="state"
      [caption]="caption"
    >
      <ng-template
        appTableCellDef="by-key"
        [appTableCellDefOf]="rows"
        let-row
        let-value="value"
        let-rowId="rowId"
      >
        <span class="by-key-template">{{ row.name }}|{{ value }}|{{ rowId }}</span>
      </ng-template>
      <ng-template
        appTableCellDef="explicit-cell"
        [appTableCellDefOf]="rows"
        let-row
        let-rowIndex="rowIndex"
      >
        <span class="explicit-template">{{ row.name }}|{{ rowIndex }}</span>
      </ng-template>
      <ng-template appTableHeaderDef="custom-header" [appTableHeaderDefOf]="columns" let-column>
        <span class="custom-header-template">{{ column.key }}</span>
      </ng-template>
    </app-dynamic-table>
  `,
})
class TemplateHostComponent {
  readonly rows: readonly TestRow[] = [{ id: 'template-row', name: 'Projected value' }];
  readonly columns: readonly DynamicTableColumn<TestRow>[] = [
    {
      key: 'by-key',
      label: { key: 'TEST.NAME' },
      type: 'link',
      field: 'name',
      resolveLink: (_row, value) => ({ commands: ['/records', value] }),
    },
    {
      key: 'explicit',
      label: { key: 'TEST.SECONDARY' },
      type: 'actions',
      templateKey: 'explicit-cell',
      actions: [{ id: 'edit', label: { key: 'TEST.EDIT' }, icon: 'edit-2' }],
    },
    {
      key: 'header',
      label: { key: 'TEST.SECONDARY' },
      type: 'text',
      field: 'secondary',
      templateKey: 'custom-header',
      sortable: true,
    },
  ];
  readonly state: TableDataState = { kind: 'ready' };
  readonly caption = { key: 'TEST.CAPTION' } as const;
}

@Component({
  imports: [DynamicTableComponent, TableCellDefDirective],
  template: `
    <app-dynamic-table
      [rows]="rows"
      [columns]="columns"
      rowIdentity="id"
      [state]="state"
      [caption]="caption"
    >
      @if (showTemplate()) {
        <ng-template appTableCellDef="conditional" [appTableCellDefOf]="rows" let-row>
          <span class="conditional-template">{{ row.name }}</span>
        </ng-template>
      }
    </app-dynamic-table>
  `,
})
class DynamicTemplateHostComponent {
  readonly showTemplate = signal(true);
  readonly rows: readonly TestRow[] = [{ id: 'conditional-row', name: 'Conditional value' }];
  readonly columns: readonly DynamicTableColumn<TestRow>[] = [
    {
      key: 'conditional',
      label: { key: 'TEST.NAME' },
      type: 'custom',
      field: 'name',
      fallback: { key: 'TEST.CUSTOM_FALLBACK' },
    },
  ];
  readonly state: TableDataState = { kind: 'ready' };
  readonly caption = { key: 'TEST.CAPTION' } as const;
}

@Component({
  imports: [DynamicTableComponent, TableCellDefDirective],
  template: `
    <app-dynamic-table
      [rows]="rows"
      [columns]="columns"
      rowIdentity="id"
      [state]="state"
      [caption]="caption"
    >
      <ng-template appTableCellDef="duplicate" [appTableCellDefOf]="rows">First</ng-template>
      <ng-template appTableCellDef="duplicate" [appTableCellDefOf]="rows">Second</ng-template>
    </app-dynamic-table>
  `,
})
class DuplicateCellTemplateHostComponent {
  readonly rows = BASE_ROWS;
  readonly columns = BASE_COLUMNS;
  readonly state: TableDataState = { kind: 'ready' };
  readonly caption = { key: 'TEST.CAPTION' } as const;
}

@Component({
  imports: [DynamicTableComponent, TableHeaderDefDirective],
  template: `
    <app-dynamic-table
      [rows]="rows"
      [columns]="columns"
      rowIdentity="id"
      [state]="state"
      [caption]="caption"
    >
      <ng-template appTableHeaderDef="duplicate" [appTableHeaderDefOf]="columns">
        First
      </ng-template>
      <ng-template appTableHeaderDef="duplicate" [appTableHeaderDefOf]="columns">
        Second
      </ng-template>
    </app-dynamic-table>
  `,
})
class DuplicateHeaderTemplateHostComponent {
  readonly rows = BASE_ROWS;
  readonly columns = BASE_COLUMNS;
  readonly state: TableDataState = { kind: 'ready' };
  readonly caption = { key: 'TEST.CAPTION' } as const;
}

describe('DynamicTableComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService({ fallbackLang: 'en', lang: 'en' })],
    });

    TestBed.inject(TranslateService).setTranslation('en', {
      STARLINKS: {
        TABLE: {
          MISSING_VALUE: 'Not available',
          EMPTY_TITLE: 'No data yet',
          EMPTY_DESCRIPTION: 'Data will appear here.',
          NO_RESULTS_TITLE: 'No matching results',
          NO_RESULTS_DESCRIPTION: 'Change your search or filters.',
          NO_COLUMNS_TITLE: 'No columns available',
          NO_COLUMNS_DESCRIPTION: 'Choose at least one column.',
          ERROR_MESSAGE: 'Unable to load table data.',
          RETRY: 'Retry',
          LOADING: 'Loading table data',
          REFRESH_LOADING: 'Updating table data',
          SORT_ASCENDING: 'Sort {{column}} ascending',
          SORT_DESCENDING: 'Sort {{column}} descending',
          CLEAR_SORTING: 'Clear sorting for {{column}}',
          ACTION_LOADING: '{{action}} in progress',
          PAGINATION: {
            PREVIOUS: 'Previous',
            NEXT: 'Next',
            NAVIGATION: 'Table pagination',
            PAGE: 'Go to page {{page}}',
            CURRENT_PAGE: 'Page {{page}} of {{totalPages}}',
          },
        },
      },
      TEST: {
        CAPTION: 'Test records',
        NAME: 'Name',
        SECONDARY: 'Secondary',
        OPEN_RECORD: 'Open record {{value}}',
        STATUS_VALUE: 'Status {{value}}',
        PROGRESS_VALUE: 'Completed {{value}} of {{max}}',
        EDIT: 'Edit record',
        REMOVE: 'Remove record',
        CUSTOM_FALLBACK: 'Custom fallback',
        CUSTOM_EMPTY: 'Nothing here',
        CUSTOM_DESCRIPTION: 'There is no content.',
        CUSTOM_ERROR: 'Custom failure',
      },
    });
  });

  afterEach(() => {
    document.documentElement.dir = 'ltr';
  });

  describe('creation and columns', () => {
    it('creates through a typed host with all required inputs', () => {
      const fixture = TestBed.createComponent(TypedHostComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-dynamic-table')).toBeTruthy();
      expect(fixture.nativeElement.querySelectorAll('tbody .dynamic-table__data-row')).toHaveLength(
        2,
      );
    });

    it('does not mutate immutable rows, columns, or column objects', () => {
      const rows = BASE_ROWS;
      const columns = BASE_COLUMNS;
      const fixture = createFixture({ rows, columns });

      expect(fixture.componentInstance.rows()).toBe(rows);
      expect(fixture.componentInstance.columns()).toBe(columns);
      expect(columns.map((column) => column.key)).toEqual(['name', 'secondary']);
      expect(Object.isFrozen(columns)).toBe(true);
      expect(Object.isFrozen(columns[0])).toBe(true);
    });

    it('uses declaration order without view state', () => {
      const fixture = createFixture();

      expect(headerKeys(fixture)).toEqual(['name', 'secondary']);
    });

    it('applies view-state order, ignores unknown keys, and appends missing columns', () => {
      const viewState: TableViewState = {
        columnOrder: ['unknown', 'secondary'],
        visibleColumnKeys: ['name', 'secondary', 'unknown'],
      };
      const fixture = createFixture({ viewState });

      expect(headerKeys(fixture)).toEqual(['secondary', 'name']);
    });

    it('filters visibility and ignores unknown visible keys', () => {
      const fixture = createFixture({
        viewState: {
          columnOrder: [],
          visibleColumnKeys: ['secondary', 'unknown'],
        },
      });

      expect(headerKeys(fixture)).toEqual(['secondary']);
    });

    it('forces required columns to remain visible', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        { ...BASE_COLUMNS[0], required: true, defaultVisible: false },
        BASE_COLUMNS[1],
      ];
      const fixture = createFixture({
        columns,
        viewState: { columnOrder: [], visibleColumnKeys: [] },
      });

      expect(headerKeys(fixture)).toEqual(['name']);
    });

    it('uses defaultVisible when view state is absent', () => {
      const fixture = createFixture({
        columns: [BASE_COLUMNS[0], { ...BASE_COLUMNS[1], defaultVisible: false }],
      });

      expect(headerKeys(fixture)).toEqual(['name']);
    });

    it('renders a safe state when no optional columns are visible', () => {
      const fixture = createFixture({
        viewState: { columnOrder: [], visibleColumnKeys: [] },
      });
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelectorAll('thead th')).toHaveLength(1);
      expect(element.querySelector('.dynamic-table__state')?.textContent).toContain(
        'No columns available',
      );
    });

    it('throws a clear contract error for duplicate column keys', () => {
      expect(() =>
        createFixture({ columns: [BASE_COLUMNS[0], { ...BASE_COLUMNS[0] }] }),
      ).toThrowError(/Duplicate column key "name"/);
    });

    it('revalidates sticky conflicts when view-state visibility changes', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        { ...BASE_COLUMNS[0], sticky: 'inline-start' },
        { ...BASE_COLUMNS[1], sticky: 'inline-start' },
      ];
      const fixture = createFixture({
        columns,
        viewState: { columnOrder: [], visibleColumnKeys: ['name'] },
      });

      fixture.componentRef.setInput('viewState', {
        columnOrder: [],
        visibleColumnKeys: ['name', 'secondary'],
      });

      expect(() => fixture.detectChanges()).toThrowError(
        /Multiple visible columns are sticky on "inline-start".*"name", "secondary"/,
      );
    });
  });

  describe('row identity and text cells', () => {
    it('supports property-key identities including zero and strings', () => {
      const fixture = createFixture();

      expect(fixture.nativeElement.querySelectorAll('.dynamic-table__data-row')).toHaveLength(2);
    });

    it('supports callback identities and stable tracking after immutable updates', () => {
      const fixture = createFixture({ rowIdentity: (row) => row.id });
      const firstRow = fixture.nativeElement.querySelector('.dynamic-table__data-row');

      fixture.componentRef.setInput(
        'rows',
        BASE_ROWS.map((row) => ({ ...row })),
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.dynamic-table__data-row')).toBe(firstRow);
    });

    it('fails before body rendering when row identities are duplicated', () => {
      expect(() =>
        createFixture({
          rows: [
            { id: 'duplicate', name: 'First' },
            { id: 'duplicate', name: 'Second' },
          ],
        }),
      ).toThrowError(/Duplicate row identity at row index 1: "duplicate"/);
    });

    it('pre-validates row identities before rendering any body state', () => {
      expect(() =>
        createFixture({
          rowIdentity: 'missing' as keyof TestRow,
          state: { kind: 'loading', mode: 'initial' },
        }),
      ).toThrowError(/Invalid row identity at row index 0: undefined/);
    });

    it('renders field and accessor values', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        BASE_COLUMNS[0],
        {
          key: 'accessor',
          label: { key: 'TEST.SECONDARY' },
          type: 'text',
          valueAccessor: (row) => `${row.name}-${row.secondary}`,
        },
      ];
      const fixture = createFixture({ columns });
      const cells = fixture.nativeElement.querySelectorAll('.dynamic-table__body-cell');

      expect(cells[0].textContent).toContain('Alpha');
      expect(cells[1].textContent).toContain('Alpha-A-1');
    });

    it('falls back only for null and undefined while preserving empty string, zero, and false', () => {
      const rows: readonly TestRow[] = [
        { id: 'values', name: '', secondary: undefined, count: 0, active: false },
      ];
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        { key: 'empty', label: { key: 'TEST.NAME' }, type: 'text', field: 'name' },
        {
          key: 'undefined',
          label: { key: 'TEST.NAME' },
          type: 'text',
          field: 'secondary',
        },
        {
          key: 'zero',
          label: { key: 'TEST.NAME' },
          type: 'text',
          valueAccessor: (row) => row.count,
        },
        {
          key: 'false',
          label: { key: 'TEST.NAME' },
          type: 'text',
          valueAccessor: (row) => row.active,
        },
        {
          key: 'null',
          label: { key: 'TEST.NAME' },
          type: 'text',
          valueAccessor: () => null,
        },
      ];
      const fixture = createFixture({ rows, columns });
      const cells = Array.from(
        fixture.nativeElement.querySelectorAll(
          '.dynamic-table__body-cell',
        ) as NodeListOf<HTMLElement>,
      );

      expect(cells[0].textContent?.trim()).toBe('');
      expect(cells[1].textContent).toContain('Not available');
      expect(cells[2].textContent?.trim()).toBe('0');
      expect(cells[3].textContent?.trim()).toBe('false');
      expect(cells[4].textContent).toContain('Not available');
    });

    it('renders text literally and applies classes, alignment, sizing, truncation, and tooltip hooks', () => {
      const rows: readonly TestRow[] = [{ id: 'html', name: '<b>Unsafe</b>' }];
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'name',
          label: { key: 'TEST.NAME' },
          type: 'text',
          field: 'name',
          width: '12rem',
          minWidth: '8rem',
          headerAlign: 'center',
          cellAlign: 'end',
          truncate: true,
          tooltip: 'always',
          headerClass: 'custom-header-class',
          cellClass: (context) => (context.rowId === 'html' ? 'custom-cell-class' : ''),
        },
      ];
      const fixture = createFixture({ rows, columns });
      const header = fixture.nativeElement.querySelector('th') as HTMLElement;
      const cell = fixture.nativeElement.querySelector('tbody td') as HTMLElement;

      expect(cell.querySelector('b')).toBeNull();
      expect(cell.textContent).toContain('<b>Unsafe</b>');
      expect(header.classList).toContain('custom-header-class');
      expect(header.classList).toContain('starlinks-table__cell--align-center');
      expect(cell.classList).toContain('custom-cell-class');
      expect(cell.classList).toContain('starlinks-table__cell--align-end');
      expect(cell.classList).toContain('starlinks-table__cell--truncate');
      expect(cell.style.width).toBe('12rem');
      expect(cell.style.minWidth).toBe('8rem');
      expect(cell.getAttribute('data-tooltip-mode')).toBe('always');
      expect(cell.querySelector('span')?.getAttribute('title')).toBe('<b>Unsafe</b>');
    });
  });

  describe('Phase 4A built-in cells', () => {
    it('renders localized number and date values plus an accessible router link', () => {
      const rows: readonly TestRow[] = [
        {
          id: 'formatted',
          name: 'REF-2026-1',
          count: 1234.5,
          createdAt: '2026-07-31T15:30:00Z',
        },
      ];
      const numberFormat = Object.freeze({
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const dateFormat = Object.freeze({
        kind: 'intl' as const,
        options: Object.freeze({ dateStyle: 'medium' as const }),
        timeZone: 'UTC',
      });
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'count',
          label: { key: 'TEST.NAME' },
          type: 'number',
          field: 'count',
          numberFormat,
          tooltip: 'always',
        },
        {
          key: 'date',
          label: { key: 'TEST.NAME' },
          type: 'date',
          field: 'createdAt',
          dateFormat,
        },
        {
          key: 'link',
          label: { key: 'TEST.NAME' },
          type: 'link',
          field: 'name',
          tooltip: 'always',
          resolveLink: (row) => ({
            commands: ['/records', row.id],
            queryParams: { source: 'table' },
          }),
          accessibleLabel: (_row, value) => ({
            key: 'TEST.OPEN_RECORD',
            params: { value },
          }),
        },
      ];
      const fixture = createFixture({ rows, columns });
      const cells = fixture.nativeElement.querySelectorAll(
        '.dynamic-table__body-cell',
      ) as NodeListOf<HTMLElement>;
      const expectedNumber = formatTableNumber(rows[0].count, 'en', numberFormat);
      const expectedDate = formatTableDate(rows[0].createdAt, 'en', dateFormat);
      const link = cells[2].querySelector('a') as HTMLAnchorElement;

      expect(cells[0].textContent?.trim()).toBe(expectedNumber);
      expect(cells[0].querySelector('span')?.getAttribute('title')).toBe(expectedNumber);
      expect(cells[1].textContent?.trim()).toBe(expectedDate);
      expect(link.textContent?.trim()).toBe('REF-2026-1');
      expect(link.getAttribute('href')).toBe('/records/formatted?source=table');
      expect(link.getAttribute('aria-label')).toBe('Open record REF-2026-1');
      expect(link.getAttribute('title')).toBe('REF-2026-1');
    });

    it('uses translated fallbacks for missing or invalid built-in values', () => {
      const rows: readonly TestRow[] = [
        { id: 'invalid', name: null, count: Number.NaN, createdAt: 'not-a-date' },
      ];
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'count',
          label: { key: 'TEST.NAME' },
          type: 'number',
          field: 'count',
        },
        {
          key: 'date',
          label: { key: 'TEST.NAME' },
          type: 'date',
          field: 'createdAt',
          dateFormat: { kind: 'pattern', pattern: 'yyyy-MM-dd' },
        },
        {
          key: 'link',
          label: { key: 'TEST.NAME' },
          type: 'link',
          field: 'name',
          resolveLink: () => ({ commands: ['/records'] }),
        },
      ];
      const fixture = createFixture({ rows, columns });
      const cells = fixture.nativeElement.querySelectorAll(
        '.dynamic-table__body-cell',
      ) as NodeListOf<HTMLElement>;

      expect(Array.from(cells).every((cell) => cell.textContent?.includes('Not available'))).toBe(
        true,
      );
      expect(fixture.nativeElement.querySelector('app-table-link-cell')).toBeNull();
    });

    it('reacts to language changes when formatting numbers', () => {
      const fixture = createFixture({
        rows: [{ id: 'locale', name: null, count: 1234.5 }],
        columns: [
          {
            key: 'count',
            label: { key: 'TEST.NAME' },
            type: 'number',
            field: 'count',
          },
        ],
      });
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('ar', { TEST: { NAME: 'العدد' } });
      translate.use('ar').subscribe();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('tbody td').textContent?.trim()).toBe(
        new Intl.NumberFormat('ar').format(1234.5),
      );
    });

    it('disables built-in links with the table interaction state', () => {
      let resolveCount = 0;
      const fixture = createFixture({
        rows: [{ id: 'disabled', name: 'Disabled link' }],
        columns: [
          {
            key: 'link',
            label: { key: 'TEST.NAME' },
            type: 'link',
            field: 'name',
            resolveLink: () => {
              resolveCount += 1;
              return { commands: ['/records'] };
            },
          },
        ],
        disabled: true,
      });

      expect(fixture.nativeElement.querySelector('a')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[role="link"][aria-disabled="true"]'),
      ).toBeTruthy();
      expect(resolveCount).toBe(0);
    });
  });

  describe('Phase 4B built-in cells', () => {
    it('renders translated status badges and semantic progress indicators', () => {
      const rows: readonly TestRow[] = [{ id: 'display', name: 'ready', count: 3 }];
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'state',
          label: { key: 'TEST.NAME' },
          type: 'status',
          field: 'name',
          tooltip: 'always',
          resolveStatus: (_row, value) => ({
            label: { key: 'TEST.STATUS_VALUE', params: { value } },
            tone: 'success',
          }),
        },
        {
          key: 'completion',
          label: { key: 'TEST.NAME' },
          type: 'progress',
          field: 'count',
          resolveProgress: () => ({
            value: 3,
            max: 4,
            tone: 'info',
            label: { key: 'TEST.PROGRESS_VALUE', params: { value: 3, max: 4 } },
          }),
        },
      ];
      const fixture = createFixture({ rows, columns });
      const status = fixture.nativeElement.querySelector('.table-status-cell') as HTMLElement;
      const progress = fixture.nativeElement.querySelector('[role="progressbar"]') as HTMLElement;

      expect(status.textContent?.trim()).toBe('Status ready');
      expect(status.dataset['tone']).toBe('success');
      expect(status.getAttribute('title')).toBe('Status ready');
      expect(progress.getAttribute('aria-valuenow')).toBe('3');
      expect(progress.getAttribute('aria-valuemax')).toBe('4');
      expect(progress.getAttribute('aria-valuetext')).toBe('Completed 3 of 4');
      expect(progress.dataset['tone']).toBe('info');
    });

    it('uses translated fallbacks without invoking renderers for missing source values', () => {
      let statusResolveCount = 0;
      let progressResolveCount = 0;
      const fixture = createFixture({
        rows: [{ id: 'missing', name: null, count: undefined }],
        columns: [
          {
            key: 'state',
            label: { key: 'TEST.NAME' },
            type: 'status',
            field: 'name',
            resolveStatus: () => {
              statusResolveCount += 1;
              return { label: { key: 'TEST.STATUS_VALUE' }, tone: 'neutral' };
            },
          },
          {
            key: 'completion',
            label: { key: 'TEST.NAME' },
            type: 'progress',
            field: 'count',
            resolveProgress: () => {
              progressResolveCount += 1;
              return { value: 0 };
            },
          },
        ],
      });
      const cells = fixture.nativeElement.querySelectorAll(
        '.dynamic-table__body-cell',
      ) as NodeListOf<HTMLElement>;

      expect(Array.from(cells).every((cell) => cell.textContent?.includes('Not available'))).toBe(
        true,
      );
      expect(fixture.nativeElement.querySelector('app-table-status-cell')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-table-progress-cell')).toBeNull();
      expect(statusResolveCount).toBe(0);
      expect(progressResolveCount).toBe(0);
    });

    it('uses configured fallbacks for malformed status and progress display data', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'state',
          label: { key: 'TEST.NAME' },
          type: 'status',
          field: 'name',
          fallback: { key: 'TEST.CUSTOM_FALLBACK' },
          resolveStatus: () => ({
            label: { key: 'TEST.STATUS_VALUE' },
            tone: 'unsupported' as never,
          }),
        },
        {
          key: 'progress-value',
          label: { key: 'TEST.NAME' },
          type: 'progress',
          field: 'count',
          resolveProgress: () => ({ value: Number.NaN }),
        },
        {
          key: 'progress-max',
          label: { key: 'TEST.NAME' },
          type: 'progress',
          field: 'count',
          resolveProgress: () => ({ value: 1, max: 0 }),
        },
      ];
      const fixture = createFixture({ columns });
      const firstRowCells = fixture.nativeElement.querySelectorAll(
        '.dynamic-table__data-row:first-child .dynamic-table__body-cell',
      ) as NodeListOf<HTMLElement>;

      expect(firstRowCells[0].textContent).toContain('Custom fallback');
      expect(firstRowCells[1].textContent).toContain('Not available');
      expect(firstRowCells[2].textContent).toContain('Not available');
      expect(fixture.nativeElement.querySelector('app-table-status-cell')).toBeNull();
      expect(fixture.nativeElement.querySelector('app-table-progress-cell')).toBeNull();
    });

    it('preserves zero and clamps finite out-of-range progress displays', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'zero',
          label: { key: 'TEST.NAME' },
          type: 'progress',
          field: 'count',
          resolveProgress: () => ({ value: 0 }),
        },
        {
          key: 'clamped',
          label: { key: 'TEST.NAME' },
          type: 'progress',
          field: 'count',
          resolveProgress: () => ({ value: 125, max: 100 }),
        },
      ];
      const fixture = createFixture({ columns });
      const progress = fixture.nativeElement.querySelectorAll(
        '.dynamic-table__data-row:first-child [role="progressbar"]',
      ) as NodeListOf<HTMLElement>;

      expect(progress[0].getAttribute('aria-valuenow')).toBe('0');
      expect(progress[1].getAttribute('aria-valuenow')).toBe('100');
    });

    it('allows status resolver exceptions to surface', () => {
      expect(() =>
        createFixture({
          columns: [
            {
              key: 'state',
              label: { key: 'TEST.NAME' },
              type: 'status',
              field: 'name',
              resolveStatus: () => {
                throw new Error('status resolver failed');
              },
            },
          ],
        }),
      ).toThrowError(/status resolver failed/);
    });

    it('allows progress resolver exceptions to surface', () => {
      expect(() =>
        createFixture({
          columns: [
            {
              key: 'progress',
              label: { key: 'TEST.NAME' },
              type: 'progress',
              field: 'count',
              resolveProgress: () => {
                throw new Error('progress resolver failed');
              },
            },
          ],
        }),
      ).toThrowError(/progress resolver failed/);
    });
  });

  describe('Phase 4C action cells', () => {
    it('renders built-in actions and re-emits field-identity events with original references', () => {
      const action = Object.freeze({
        id: 'edit',
        label: { key: 'TEST.EDIT' },
        icon: 'edit-2',
      });
      const columns: readonly DynamicTableColumn<TestRow>[] = Object.freeze([
        Object.freeze({
          key: 'actions',
          label: { key: 'TEST.NAME' },
          type: 'actions' as const,
          actions: Object.freeze([action]),
        }),
      ]);
      const fixture = createFixture({ columns });
      const events: TableActionEvent<TestRow>[] = [];
      fixture.componentInstance.actionTriggered.subscribe((event) => events.push(event));

      (
        fixture.nativeElement.querySelector(
          '.dynamic-table__data-row:first-child button',
        ) as HTMLButtonElement
      ).click();

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual({ action, row: BASE_ROWS[0], rowId: 0, rowIndex: 0 });
      expect(events[0].action).toBe(action);
      expect(events[0].row).toBe(BASE_ROWS[0]);
      expect(fixture.componentInstance.rows()).toBe(BASE_ROWS);
      expect(fixture.componentInstance.columns()).toBe(columns);
      expect(Object.isFrozen(columns)).toBe(true);
    });

    it('re-emits the validated callback row identity', () => {
      const action = { id: 'edit', label: { key: 'TEST.EDIT' }, icon: 'edit-2' };
      const fixture = createFixture({
        columns: [
          {
            key: 'actions',
            label: { key: 'TEST.NAME' },
            type: 'actions',
            actions: [action],
          },
        ],
        rowIdentity: (row) => `resolved-${row.id}`,
      });
      const events: TableActionEvent<TestRow>[] = [];
      fixture.componentInstance.actionTriggered.subscribe((event) => events.push(event));
      const buttons = fixture.nativeElement.querySelectorAll(
        '.dynamic-table__data-row button',
      ) as NodeListOf<HTMLButtonElement>;

      buttons[1].click();

      expect(events[0].rowId).toBe('resolved-second');
      expect(events[0].rowIndex).toBe(1);
    });

    it('applies initial, refresh, and explicit table-disabled states', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'actions',
          label: { key: 'TEST.NAME' },
          type: 'actions',
          actions: [{ id: 'edit', label: { key: 'TEST.EDIT' }, icon: 'edit-2' }],
        },
      ];
      let fixture = createFixture({ columns, state: { kind: 'loading', mode: 'initial' } });
      expect(fixture.nativeElement.querySelector('app-table-actions-cell')).toBeNull();
      expect(fixture.nativeElement.querySelector('button')).toBeNull();

      fixture = createFixture({ columns, state: { kind: 'loading', mode: 'refresh' } });
      expect(
        (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).disabled,
      ).toBe(true);

      fixture = createFixture({ columns, disabled: true });
      expect(
        (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('resolves per-row visibility, disabled state, and controlled loading once per action', () => {
      const calls = { visible: 0, disabled: 0, loading: 0 };
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'actions',
          label: { key: 'TEST.NAME' },
          type: 'actions',
          actions: [
            {
              id: 'visible',
              label: { key: 'TEST.EDIT' },
              icon: 'eye',
              visible: (row) => (++calls.visible, row.active === true),
            },
            {
              id: 'disabled',
              label: { key: 'TEST.EDIT' },
              icon: 'edit-2',
              disabled: (row) => (++calls.disabled, row.active !== true),
            },
            {
              id: 'loading',
              label: { key: 'TEST.REMOVE' },
              icon: 'trash',
              loading: (row) => (++calls.loading, row.active === true),
            },
          ],
        },
      ];
      const fixture = createFixture({ columns });
      const rows = fixture.nativeElement.querySelectorAll(
        '.dynamic-table__data-row',
      ) as NodeListOf<HTMLElement>;

      expect(rows[0].querySelector('[data-action-id="visible"]')).toBeNull();
      expect(
        (rows[0].querySelector('[data-action-id="disabled"]') as HTMLButtonElement).disabled,
      ).toBe(true);
      expect(
        (rows[0].querySelector('[data-action-id="loading"]') as HTMLButtonElement).disabled,
      ).toBe(false);
      expect(rows[1].querySelector('[data-action-id="visible"]')).toBeTruthy();
      expect(
        (rows[1].querySelector('[data-action-id="disabled"]') as HTMLButtonElement).disabled,
      ).toBe(false);
      expect(
        (rows[1].querySelector('[data-action-id="loading"]') as HTMLButtonElement).disabled,
      ).toBe(true);
      expect(rows[1].querySelector('.table-actions-cell__spinner')).toBeTruthy();
      expect(calls).toEqual({ visible: 2, disabled: 2, loading: 2 });
    });

    it('renders an empty actions container without fallback text when no action is visible', () => {
      const fixture = createFixture({
        columns: [
          {
            key: 'actions',
            label: { key: 'TEST.NAME' },
            type: 'actions',
            actions: [
              {
                id: 'hidden',
                label: { key: 'TEST.EDIT' },
                icon: 'edit-2',
                visible: () => false,
              },
            ],
          },
        ],
      });
      const cell = fixture.nativeElement.querySelector(
        '.dynamic-table__data-row:first-child .dynamic-table__body-cell',
      ) as HTMLElement;

      expect(cell.querySelector('.table-actions-cell')).toBeTruthy();
      expect(cell.querySelector('button')).toBeNull();
      expect(cell.querySelector('.dynamic-table__fallback')).toBeNull();
      expect(cell.textContent?.trim()).toBe('');
    });
  });

  describe('projected templates', () => {
    it('resolves multiple cell templates by column key and explicit template key', () => {
      const fixture = TestBed.createComponent(TemplateHostComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.by-key-template').textContent).toContain(
        'Projected value|Projected value|template-row',
      );
      expect(fixture.nativeElement.querySelector('.explicit-template').textContent).toContain(
        'Projected value|0',
      );
      expect(
        fixture.nativeElement.querySelector('[data-column-key="by-key"] app-table-link-cell'),
      ).toBeNull();
      expect(
        fixture.nativeElement.querySelector('[data-column-key="explicit"] app-table-actions-cell'),
      ).toBeNull();
    });

    it('renders custom headers with the typed column context', () => {
      const fixture = TestBed.createComponent(TemplateHostComponent);
      fixture.detectChanges();
      const table = fixture.debugElement.query(By.directive(DynamicTableComponent))
        .componentInstance as DynamicTableComponent<TestRow>;
      const changes: Array<TableSort | null> = [];
      table.sortChange.subscribe((sort) => changes.push(sort));
      const customHeader = fixture.nativeElement.querySelector(
        '.custom-header-template',
      ) as HTMLElement;

      expect(customHeader.textContent).toContain('header');
      expect(customHeader.closest('button')).toBeTruthy();

      (customHeader.closest('button') as HTMLButtonElement).click();
      expect(changes).toEqual([{ columnKey: 'header', sortKey: 'header', direction: 'asc' }]);
    });

    it('uses fallback content when a custom template is missing', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          key: 'missing-template',
          label: { key: 'TEST.NAME' },
          type: 'custom',
          templateKey: 'not-projected',
          fallback: { key: 'TEST.CUSTOM_FALLBACK' },
        },
      ];
      const fixture = createFixture({ columns });

      expect(fixture.nativeElement.querySelector('tbody td').textContent).toContain(
        'Custom fallback',
      );
    });

    it('recomputes keyed templates when projected definitions change', () => {
      const fixture = TestBed.createComponent(DynamicTemplateHostComponent);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.conditional-template')?.textContent).toContain(
        'Conditional value',
      );

      fixture.componentInstance.showTemplate.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.conditional-template')).toBeNull();
      expect(fixture.nativeElement.querySelector('tbody td')?.textContent).toContain(
        'Custom fallback',
      );

      fixture.componentInstance.showTemplate.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.conditional-template')?.textContent).toContain(
        'Conditional value',
      );
    });

    it('throws a clear contract error for duplicate cell template keys', () => {
      const fixture = TestBed.createComponent(DuplicateCellTemplateHostComponent);

      expect(() => fixture.detectChanges()).toThrowError(/Duplicate cell template key "duplicate"/);
    });

    it('throws a clear contract error for duplicate header template keys', () => {
      const fixture = TestBed.createComponent(DuplicateHeaderTemplateHostComponent);

      expect(() => fixture.detectChanges()).toThrowError(
        /Duplicate header template key "duplicate"/,
      );
    });
  });

  describe('controlled sorting', () => {
    it('renders no sorting control for non-sortable headers', () => {
      const fixture = createFixture();

      expect(
        fixture.nativeElement.querySelector('[data-column-key="secondary"] button'),
      ).toBeNull();
    });

    it('emits ascending, descending, and clear states without mutating controlled sort', () => {
      const initialSort: TableSort | null = null;
      const fixture = createFixture({ sort: initialSort });
      const changes: Array<TableSort | null> = [];
      fixture.componentInstance.sortChange.subscribe((sort) => changes.push(sort));
      const sortButton = () =>
        fixture.nativeElement.querySelector('[data-column-key="name"] button') as HTMLButtonElement;
      const sortIcons = () =>
        Array.from(sortButton().querySelectorAll('iconsax-icon')) as HTMLElement[];

      expect(sortIcons().map((icon) => icon.getAttribute('name'))).toEqual([
        'arrow-up-02',
        'arrow-down-02',
      ]);
      expect(sortIcons().every((icon) => icon.getAttribute('type') === 'linear')).toBe(true);
      expect(sortIcons().every((icon) => icon.getAttribute('size') === '8')).toBe(true);
      expect(sortIcons().every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
      expect(
        sortButton().querySelector('.dynamic-table__sort-indicator')?.getAttribute('aria-hidden'),
      ).toBe('true');
      expect(sortButton().querySelector('.pi')).toBeNull();
      expect(sortButton().textContent).not.toMatch(/[←→↑↓]/u);

      sortButton().click();
      expect(changes.at(-1)).toEqual({ columnKey: 'name', sortKey: 'name', direction: 'asc' });
      expect(fixture.componentInstance.sort()).toBe(initialSort);

      fixture.componentRef.setInput('sort', changes.at(-1));
      fixture.detectChanges();
      expect(sortIcons().map((icon) => icon.getAttribute('name'))).toEqual(['arrow-up-02']);
      expect(sortIcons()[0].getAttribute('size')).toBe('12');
      sortButton().click();
      expect(changes.at(-1)).toEqual({ columnKey: 'name', sortKey: 'name', direction: 'desc' });

      fixture.componentRef.setInput('sort', changes.at(-1));
      fixture.detectChanges();
      expect(sortIcons().map((icon) => icon.getAttribute('name'))).toEqual(['arrow-down-02']);
      expect(sortIcons()[0].getAttribute('size')).toBe('12');
      expect(sortIcons()[0].getAttribute('type')).toBe('linear');
      expect(sortIcons()[0].getAttribute('aria-hidden')).toBe('true');
      sortButton().click();
      expect(changes.at(-1)).toBeNull();
    });

    it('uses backend sortKey and starts ascending when switching columns', () => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        BASE_COLUMNS[0],
        { ...BASE_COLUMNS[1], sortable: true, sortKey: 'backend_secondary' },
      ];
      const fixture = createFixture({
        columns,
        sort: { columnKey: 'name', sortKey: 'name', direction: 'desc' },
      });
      const changes: Array<TableSort | null> = [];
      fixture.componentInstance.sortChange.subscribe((sort) => changes.push(sort));

      (
        fixture.nativeElement.querySelector(
          '[data-column-key="secondary"] button',
        ) as HTMLButtonElement
      ).click();

      expect(changes).toEqual([
        { columnKey: 'secondary', sortKey: 'backend_secondary', direction: 'asc' },
      ]);
    });

    it('renders defensive inactive sorting for missing columns and accessible controlled state', () => {
      const fixture = createFixture({
        sort: { columnKey: 'missing', sortKey: 'missing', direction: 'asc' },
      });
      const header = fixture.nativeElement.querySelector('[data-column-key="name"]') as HTMLElement;
      const button = header.querySelector('button') as HTMLButtonElement;

      expect(header.getAttribute('aria-sort')).toBe('none');
      expect(button.getAttribute('aria-label')).toBe('Sort Name ascending');

      fixture.componentRef.setInput('sort', {
        columnKey: 'name',
        sortKey: 'name',
        direction: 'asc',
      });
      fixture.detectChanges();
      expect(header.getAttribute('aria-sort')).toBe('ascending');
      expect(button.getAttribute('aria-label')).toBe('Sort Name descending');
    });

    it('disables sorting through disabled and loading states', () => {
      const fixture = createFixture({ disabled: true });
      const changes: Array<TableSort | null> = [];
      fixture.componentInstance.sortChange.subscribe((sort) => changes.push(sort));
      const button = fixture.nativeElement.querySelector(
        '[data-column-key="name"] button',
      ) as HTMLButtonElement;

      expect(button.disabled).toBe(true);
      button.click();

      fixture.componentRef.setInput('disabled', false);
      fixture.componentRef.setInput('state', { kind: 'loading', mode: 'refresh' });
      fixture.detectChanges();
      expect(button.disabled).toBe(true);
      button.click();
      expect(changes).toEqual([]);
    });
  });

  describe('controlled table states', () => {
    it('renders initial skeleton rows with headers and aria-busy', () => {
      const fixture = createFixture({
        state: { kind: 'loading', mode: 'initial' },
        skeletonRowCount: 3,
      });
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelectorAll('thead th')).toHaveLength(2);
      expect(element.querySelectorAll('.dynamic-table__skeleton-row')).toHaveLength(3);
      expect(element.querySelectorAll('.dynamic-table__skeleton-row td')).toHaveLength(6);
      expect(element.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
      expect(element.querySelectorAll('[role="status"]')).toHaveLength(1);
      expect(element.querySelector('[role="status"]')?.textContent).toContain('Loading table data');
    });

    it('retains rows and shows a non-destructive indicator during refresh loading', () => {
      const fixture = createFixture({ state: { kind: 'loading', mode: 'refresh' } });
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelectorAll('.dynamic-table__data-row')).toHaveLength(2);
      expect(element.querySelector('.dynamic-table__refresh-indicator')?.textContent).toContain(
        'Updating table data',
      );
      expect(element.querySelector('table')?.getAttribute('aria-busy')).toBe('true');
      expect(element.querySelectorAll('[role="status"]')).toHaveLength(1);
    });

    it('renders controlled empty and no-results content distinctly', () => {
      const fixture = createFixture({
        rows: [],
        state: {
          kind: 'empty',
          title: { key: 'TEST.CUSTOM_EMPTY' },
          description: { key: 'TEST.CUSTOM_DESCRIPTION' },
        },
      });
      let element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('.dynamic-table__state--empty')?.textContent).toContain(
        'Nothing here',
      );

      fixture.componentRef.setInput('state', { kind: 'no-results' });
      fixture.detectChanges();
      element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.dynamic-table__state--no-results')?.textContent).toContain(
        'No matching results',
      );
    });

    it('replaces rows for replace errors and emits retry only when retryable', () => {
      const fixture = createFixture({
        state: {
          kind: 'error',
          display: 'replace',
          message: { key: 'TEST.CUSTOM_ERROR' },
          retryable: true,
        },
      });
      let retries = 0;
      fixture.componentInstance.retry.subscribe(() => (retries += 1));
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelectorAll('.dynamic-table__data-row')).toHaveLength(0);
      expect(element.querySelector('[role="alert"]')?.textContent).toContain('Custom failure');
      (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
      expect(retries).toBe(1);

      fixture.componentRef.setInput('state', {
        kind: 'error',
        display: 'replace',
        retryable: false,
      });
      fixture.detectChanges();
      expect(element.querySelector('[role="alert"] button')).toBeNull();
    });

    it('preserves rows for inline errors and supports retry', () => {
      const fixture = createFixture({
        state: { kind: 'error', display: 'inline', retryable: true },
      });
      let retries = 0;
      fixture.componentInstance.retry.subscribe(() => (retries += 1));
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelectorAll('.dynamic-table__data-row')).toHaveLength(2);
      expect(
        element.querySelector('.dynamic-table__inline-error')?.getAttribute('role'),
      ).toBeNull();
      expect(element.querySelector('.dynamic-table__inline-error [role="alert"]')).toBeTruthy();
      (element.querySelector('.dynamic-table__inline-error button') as HTMLButtonElement).click();
      expect(retries).toBe(1);
    });

    it('renders a defensive empty state for ready with zero rows', () => {
      const fixture = createFixture({ rows: [], state: { kind: 'ready' } });

      expect(
        fixture.nativeElement.querySelector('.dynamic-table__state--empty').textContent,
      ).toContain('No data yet');
    });
  });

  describe('pagination composition', () => {
    it('is hidden when pagination is null and re-emits page changes when supplied', () => {
      const fixture = createFixture();
      expect(fixture.debugElement.query(By.directive(TablePaginationComponent))).toBeNull();

      const pageChanges: TablePageChange[] = [];
      fixture.componentInstance.pageChange.subscribe((change) => pageChanges.push(change));
      fixture.componentRef.setInput('pagination', { page: 1, pageSize: 10, totalItems: 20 });
      fixture.detectChanges();

      const pagination = fixture.debugElement.query(By.directive(TablePaginationComponent));
      expect(pagination).toBeTruthy();
      (
        pagination.nativeElement.querySelector(
          '.table-pagination__control--next',
        ) as HTMLButtonElement
      ).click();
      expect(pageChanges).toEqual([{ page: 2, pageSize: 10 }]);
    });

    it('forwards compact mode and disables pagination during loading or when disabled', () => {
      const fixture = createFixture({
        pagination: { page: 1, pageSize: 10, totalItems: 20 },
        paginationCompact: true,
        state: { kind: 'loading', mode: 'refresh' },
      });
      const pagination = fixture.debugElement.query(By.directive(TablePaginationComponent))
        .componentInstance as TablePaginationComponent;

      expect(pagination.compact()).toBe(true);
      expect(pagination.disabled()).toBe(true);

      fixture.componentRef.setInput('state', { kind: 'ready' });
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(pagination.disabled()).toBe(true);
    });

    it('applies consistent visibility rules for empty, no-results, and errors', () => {
      const fixture = createFixture({
        rows: [],
        pagination: { page: 1, pageSize: 10, totalItems: 20 },
        state: { kind: 'empty' },
      });
      const hasPagination = () =>
        fixture.debugElement.query(By.directive(TablePaginationComponent)) !== null;

      expect(hasPagination()).toBe(false);

      fixture.componentRef.setInput('state', { kind: 'no-results' });
      fixture.detectChanges();
      expect(hasPagination()).toBe(true);

      fixture.componentRef.setInput('pagination', { page: 1, pageSize: 10, totalItems: 0 });
      fixture.detectChanges();
      expect(hasPagination()).toBe(false);

      fixture.componentRef.setInput('state', {
        kind: 'error',
        display: 'replace',
        retryable: false,
      });
      fixture.componentRef.setInput('pagination', { page: 1, pageSize: 10, totalItems: 20 });
      fixture.detectChanges();
      expect(hasPagination()).toBe(false);
    });
  });

  describe('accessibility, responsive behavior, and RTL', () => {
    it('renders a semantic captioned table without tabbable rows', () => {
      const fixture = createFixture();
      const element = fixture.nativeElement as HTMLElement;

      expect(element.querySelector('caption')?.textContent).toContain('Test records');
      expect(element.querySelector('thead')).toBeTruthy();
      expect(element.querySelector('tbody')).toBeTruthy();
      expect(element.querySelector('th')?.getAttribute('scope')).toBe('col');
      expect(element.querySelectorAll('tbody tr[tabindex]')).toHaveLength(0);
      expect(element.querySelector('[data-column-key="name"] button')?.tagName).toBe('BUTTON');
    });

    it('applies responsive and logical sticky hooks in RTL', () => {
      document.documentElement.dir = 'rtl';
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        {
          ...BASE_COLUMNS[0],
          sticky: 'inline-start',
          responsive: { hiddenBelow: 'md' },
        },
        { ...BASE_COLUMNS[1], sticky: 'inline-end' },
      ];
      const fixture = createFixture({ columns });
      const startHeader = fixture.nativeElement.querySelector(
        'thead [data-column-key="name"]',
      ) as HTMLElement;
      const endCell = fixture.nativeElement.querySelector(
        'tbody [data-column-key="secondary"]',
      ) as HTMLElement;

      expect(startHeader.classList).toContain('starlinks-table__cell--sticky-start');
      expect(startHeader.classList).toContain('starlinks-table__cell--hide-below-md');
      expect(endCell.classList).toContain('starlinks-table__cell--sticky-end');
      expect(endCell.classList).toContain('starlinks-table__cell--sticky');
      expect(fixture.nativeElement.querySelector('.dynamic-table__overflow')).toBeTruthy();
    });
  });
});

interface FixtureOptions {
  readonly rows?: readonly TestRow[];
  readonly columns?: readonly DynamicTableColumn<TestRow>[];
  readonly rowIdentity?: keyof TestRow | ((row: TestRow) => string | number);
  readonly state?: TableDataState;
  readonly sort?: TableSort | null;
  readonly pagination?: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
  } | null;
  readonly viewState?: TableViewState | null;
  readonly disabled?: boolean;
  readonly paginationCompact?: boolean;
  readonly skeletonRowCount?: number;
}

function createFixture(
  options: FixtureOptions = {},
): ComponentFixture<DynamicTableComponent<TestRow>> {
  const fixture = TestBed.createComponent(DynamicTableComponent) as ComponentFixture<
    DynamicTableComponent<TestRow>
  >;
  fixture.componentRef.setInput('rows', options.rows ?? BASE_ROWS);
  fixture.componentRef.setInput('columns', options.columns ?? BASE_COLUMNS);
  fixture.componentRef.setInput('rowIdentity', options.rowIdentity ?? 'id');
  fixture.componentRef.setInput('state', options.state ?? { kind: 'ready' });
  fixture.componentRef.setInput('caption', { key: 'TEST.CAPTION' });
  fixture.componentRef.setInput('sort', options.sort ?? null);
  fixture.componentRef.setInput('pagination', options.pagination ?? null);
  fixture.componentRef.setInput('viewState', options.viewState ?? null);
  fixture.componentRef.setInput('disabled', options.disabled ?? false);
  fixture.componentRef.setInput('paginationCompact', options.paginationCompact ?? false);
  fixture.componentRef.setInput('skeletonRowCount', options.skeletonRowCount ?? 5);
  fixture.detectChanges();
  return fixture;
}

function headerKeys(fixture: ComponentFixture<DynamicTableComponent<TestRow>>): readonly string[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('thead [data-column-key]') as NodeListOf<HTMLElement>,
  ).map((header) => header.dataset['columnKey'] ?? '');
}
