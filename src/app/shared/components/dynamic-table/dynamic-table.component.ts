import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  TemplateRef,
  computed,
  contentChildren,
  inject,
  input,
  output,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { TableActionsCellComponent } from './cells/table-actions-cell/table-actions-cell.component';
import { TableLinkCellComponent } from './cells/table-link-cell/table-link-cell.component';
import { TableProgressCellComponent } from './cells/table-progress-cell/table-progress-cell.component';
import { TableStatusCellComponent } from './cells/table-status-cell/table-status-cell.component';
import { resolveTableColumns } from './column-resolution';
import { TableCellDefDirective } from './table-cell-def.directive';
import {
  DynamicTableColumn,
  TableActionEvent,
  TableCellContext,
  TableColumnClass,
  TableDataState,
  TableDateColumn,
  TableHeaderContext,
  TableNumberColumn,
  TablePageChange,
  TablePaginationState,
  TableProgressColumn,
  TableProgressDisplay,
  TableProgressTone,
  TableRowIdentity,
  TableSort,
  TableStatusColumn,
  TableStatusDisplay,
  TableStatusTone,
  TableViewState,
  TranslatedText,
} from './dynamic-table.types';
import { formatTableDate } from './formatters/table-date-format';
import { formatTableNumber } from './formatters/table-number-format';
import { resolveTableRows, type ResolvedTableRow } from './row-identity';
import { TableHeaderDefDirective } from './table-header-def.directive';

const DEFAULT_TEXT = {
  missingValue: { key: 'STARLINKS.TABLE.MISSING_VALUE' },
  emptyTitle: { key: 'STARLINKS.TABLE.EMPTY_TITLE' },
  emptyDescription: { key: 'STARLINKS.TABLE.EMPTY_DESCRIPTION' },
  noResultsTitle: { key: 'STARLINKS.TABLE.NO_RESULTS_TITLE' },
  noResultsDescription: { key: 'STARLINKS.TABLE.NO_RESULTS_DESCRIPTION' },
  errorMessage: { key: 'STARLINKS.TABLE.ERROR_MESSAGE' },
} as const satisfies Record<string, TranslatedText>;

@Component({
  selector: 'app-dynamic-table',
  imports: [
    NgClass,
    NgTemplateOutlet,
    TableActionsCellComponent,
    TableLinkCellComponent,
    TableProgressCellComponent,
    TableStatusCellComponent,
    TablePaginationComponent,
    TranslatePipe,
  ],
  templateUrl: './dynamic-table.component.html',
  styleUrl: './dynamic-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DynamicTableComponent<T> {
  private readonly translate = inject(TranslateService);

  readonly rows = input.required<readonly T[]>();
  readonly columns = input.required<readonly DynamicTableColumn<T>[]>();
  readonly rowIdentity = input.required<TableRowIdentity<T>>();
  readonly state = input.required<TableDataState>();
  readonly caption = input.required<TranslatedText>();

  readonly sort = input<TableSort | null>(null);
  readonly pagination = input<TablePaginationState | null>(null);
  readonly viewState = input<TableViewState | null>(null);
  readonly disabled = input(false);
  readonly paginationCompact = input(false);
  readonly skeletonRowCount = input(5);

  readonly sortChange = output<TableSort | null>();
  readonly pageChange = output<TablePageChange>();
  readonly actionTriggered = output<TableActionEvent<T>>();
  readonly retry = output<void>();

  private readonly cellDefinitions = contentChildren(TableCellDefDirective, {
    descendants: true,
  });
  private readonly headerDefinitions = contentChildren(TableHeaderDefDirective, {
    descendants: true,
  });

  private readonly cellTemplateMap = computed(() =>
    this.buildTemplateMap<TableCellContext<T>>(
      this.cellDefinitions() as readonly TableCellDefDirective<T, unknown>[],
      'cell',
    ),
  );
  private readonly headerTemplateMap = computed(() =>
    this.buildTemplateMap<TableHeaderContext<T>>(
      this.headerDefinitions() as readonly TableHeaderDefDirective<T>[],
      'header',
    ),
  );

  protected readonly resolvedColumns = computed(() =>
    resolveTableColumns(this.columns(), this.viewState()),
  );

  protected readonly resolvedRows = computed(() =>
    resolveTableRows(this.rows(), this.rowIdentity()),
  );

  protected readonly activeSort = computed<TableSort | null>(() => {
    const sort = this.sort();
    if (!sort) {
      return null;
    }

    const column = this.resolvedColumns().find((item) => item.key === sort.columnKey);
    return column?.sortable === true ? sort : null;
  });

  protected readonly isLoading = computed(() => this.state().kind === 'loading');
  protected readonly interactionDisabled = computed(() => this.disabled() || this.isLoading());
  protected readonly locale = computed(() => this.translate.currentLang() ?? 'en');
  protected readonly skeletonRows = computed(() => {
    const requestedCount = this.skeletonRowCount();
    const count = Number.isFinite(requestedCount) ? Math.floor(requestedCount) : 5;
    return Array.from({ length: Math.min(Math.max(count, 1), 100) }, (_, index) => index);
  });

  protected readonly showDataRows = computed(() => {
    const state = this.state();
    return (
      this.resolvedRows().length > 0 &&
      (state.kind === 'ready' ||
        (state.kind === 'loading' && state.mode === 'refresh') ||
        (state.kind === 'error' && state.display === 'inline'))
    );
  });

  protected readonly showPagination = computed(() => {
    const pagination = this.pagination();
    const state = this.state();

    if (!pagination || this.resolvedColumns().length === 0) {
      return false;
    }

    if (state.kind === 'empty' || (state.kind === 'error' && state.display === 'replace')) {
      return false;
    }

    return state.kind !== 'no-results' || pagination.totalItems > 0;
  });

  protected readonly effectiveColumnCount = computed(() =>
    Math.max(this.resolvedColumns().length, 1),
  );

  protected requestSort(column: DynamicTableColumn<T>): void {
    if (!column.sortable || this.interactionDisabled()) {
      return;
    }

    const activeSort = this.activeSort();
    if (!activeSort || activeSort.columnKey !== column.key) {
      this.sortChange.emit({
        columnKey: column.key,
        sortKey: column.sortKey ?? column.key,
        direction: 'asc',
      });
      return;
    }

    if (activeSort.direction === 'asc') {
      this.sortChange.emit({
        columnKey: column.key,
        sortKey: column.sortKey ?? column.key,
        direction: 'desc',
      });
      return;
    }

    this.sortChange.emit(null);
  }

  protected requestRetry(): void {
    const state = this.state();
    if (state.kind === 'error' && state.retryable && !this.disabled()) {
      this.retry.emit();
    }
  }

  protected ariaSort(column: DynamicTableColumn<T>): 'ascending' | 'descending' | 'none' | null {
    if (!column.sortable) {
      return null;
    }

    const activeSort = this.activeSort();
    if (activeSort?.columnKey !== column.key) {
      return 'none';
    }

    return activeSort.direction === 'asc' ? 'ascending' : 'descending';
  }

  protected sortIconName(column: DynamicTableColumn<T>): 'sort' | 'arrow-up-01' | 'arrow-down-01' {
    const direction = this.ariaSort(column);

    if (direction === 'ascending') {
      return 'arrow-up-01';
    }

    if (direction === 'descending') {
      return 'arrow-down-01';
    }

    return 'sort';
  }

  protected sortActionKey(column: DynamicTableColumn<T>): string {
    const activeSort = this.activeSort();
    if (activeSort?.columnKey !== column.key) {
      return 'STARLINKS.TABLE.SORT_ASCENDING';
    }

    return activeSort.direction === 'asc'
      ? 'STARLINKS.TABLE.SORT_DESCENDING'
      : 'STARLINKS.TABLE.CLEAR_SORTING';
  }

  protected getCellTemplate(
    column: DynamicTableColumn<T>,
  ): TemplateRef<TableCellContext<T>> | null {
    return this.cellTemplateMap().get(column.templateKey ?? column.key) ?? null;
  }

  protected getHeaderTemplate(
    column: DynamicTableColumn<T>,
  ): TemplateRef<TableHeaderContext<T>> | null {
    return this.headerTemplateMap().get(column.templateKey ?? column.key) ?? null;
  }

  protected createCellContext(
    resolvedRow: ResolvedTableRow<T>,
    column: DynamicTableColumn<T>,
    rowIndex: number,
  ): TableCellContext<T> {
    return {
      $implicit: resolvedRow.row,
      row: resolvedRow.row,
      value: this.resolveValue(resolvedRow.row, column),
      column,
      rowIndex,
      rowId: resolvedRow.rowId,
    };
  }

  protected createHeaderContext(column: DynamicTableColumn<T>): TableHeaderContext<T> {
    return { $implicit: column, column };
  }

  protected cellClasses(
    column: DynamicTableColumn<T>,
    context: TableCellContext<T>,
  ): TableColumnClass | undefined {
    return typeof column.cellClass === 'function' ? column.cellClass(context) : column.cellClass;
  }

  protected fallbackFor(column: DynamicTableColumn<T>): TranslatedText {
    return column.fallback ?? DEFAULT_TEXT.missingValue;
  }

  protected isMissingValue(value: unknown): value is null | undefined {
    return value === null || value === undefined;
  }

  protected tooltipValue(column: DynamicTableColumn<T>, value: unknown): string | null {
    return column.tooltip === 'always' && !this.isMissingValue(value) ? String(value) : null;
  }

  protected formatNumberValue(value: unknown, column: TableNumberColumn<T>): string | null {
    return formatTableNumber(value, this.locale(), column.numberFormat);
  }

  protected formatDateValue(value: unknown, column: TableDateColumn<T>): string | null {
    return formatTableDate(value, this.locale(), column.dateFormat);
  }

  protected resolveStatusDisplay(
    row: T,
    value: unknown,
    column: TableStatusColumn<T>,
  ): TableStatusDisplay | null {
    const display: unknown = column.resolveStatus(row, value);
    if (!this.isRecord(display) || !this.isTranslatedText(display['label'])) {
      return null;
    }

    const tone = display['tone'];
    const supportedTones: readonly TableStatusTone[] = [
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
      'accent',
    ];
    return supportedTones.includes(tone as TableStatusTone)
      ? (display as unknown as TableStatusDisplay)
      : null;
  }

  protected resolveProgressDisplay(
    row: T,
    value: unknown,
    column: TableProgressColumn<T>,
  ): TableProgressDisplay | null {
    const display: unknown = column.resolveProgress(row, value);
    if (!this.isRecord(display)) {
      return null;
    }

    const progressValue = display['value'];
    const max = display['max'];
    const tone = display['tone'];
    const label = display['label'];
    const supportedTones: readonly TableProgressTone[] = [
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
    ];

    if (typeof progressValue !== 'number' || !Number.isFinite(progressValue)) {
      return null;
    }

    if (max !== undefined && (typeof max !== 'number' || !Number.isFinite(max) || max <= 0)) {
      return null;
    }

    if (tone !== undefined && !supportedTones.includes(tone as TableProgressTone)) {
      return null;
    }

    if (label !== undefined && !this.isTranslatedText(label)) {
      return null;
    }

    return display as unknown as TableProgressDisplay;
  }

  protected emptyTitle(): TranslatedText {
    const state = this.state();
    return state.kind === 'empty'
      ? (state.title ?? DEFAULT_TEXT.emptyTitle)
      : DEFAULT_TEXT.emptyTitle;
  }

  protected emptyDescription(): TranslatedText {
    const state = this.state();
    return state.kind === 'empty'
      ? (state.description ?? DEFAULT_TEXT.emptyDescription)
      : DEFAULT_TEXT.emptyDescription;
  }

  protected noResultsTitle(): TranslatedText {
    const state = this.state();
    return state.kind === 'no-results'
      ? (state.title ?? DEFAULT_TEXT.noResultsTitle)
      : DEFAULT_TEXT.noResultsTitle;
  }

  protected noResultsDescription(): TranslatedText {
    const state = this.state();
    return state.kind === 'no-results'
      ? (state.description ?? DEFAULT_TEXT.noResultsDescription)
      : DEFAULT_TEXT.noResultsDescription;
  }

  protected errorMessage(): TranslatedText {
    const state = this.state();
    return state.kind === 'error'
      ? (state.message ?? DEFAULT_TEXT.errorMessage)
      : DEFAULT_TEXT.errorMessage;
  }

  private resolveValue(row: T, column: DynamicTableColumn<T>): unknown {
    if ('valueAccessor' in column && typeof column.valueAccessor === 'function') {
      return column.valueAccessor(row);
    }

    if ('field' in column && column.field !== undefined) {
      return (row as Readonly<Record<string, unknown>>)[column.field];
    }

    return undefined;
  }

  private isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isTranslatedText(value: unknown): value is TranslatedText {
    if (!this.isRecord(value) || typeof value['key'] !== 'string' || value['key'].trim() === '') {
      return false;
    }

    const params = value['params'];
    return params === undefined || this.isRecord(params);
  }

  private buildTemplateMap<TContext>(
    definitions: readonly {
      readonly key: () => string;
      readonly template: TemplateRef<TContext>;
    }[],
    kind: 'cell' | 'header',
  ): ReadonlyMap<string, TemplateRef<TContext>> {
    const templates = new Map<string, TemplateRef<TContext>>();

    for (const definition of definitions) {
      const key = definition.key();
      if (templates.has(key)) {
        throw new Error(
          `[DynamicTable] Duplicate ${kind} template key "${key}". Keys must be unique.`,
        );
      }

      templates.set(key, definition.template);
    }

    return templates;
  }
}
