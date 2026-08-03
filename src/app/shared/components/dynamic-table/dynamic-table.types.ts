export type TableRowId = string | number;

export type TableColumnKey = string;

export type TableSortDirection = 'asc' | 'desc';

export type TableAlignment = 'start' | 'center' | 'end';

export type TableBreakpoint = 'sm' | 'md' | 'lg';

export interface TranslatedText {
  readonly key: string;
  readonly params?: Readonly<Record<string, unknown>>;
}

export type TableRowIdentity<T> = Extract<keyof T, string> | ((row: T) => TableRowId);

export type TableFieldKey<T, TValue> = Extract<
  {
    [TKey in keyof T]-?: T[TKey] extends TValue ? TKey : never;
  }[keyof T],
  string
>;

export type TableValueSource<T, TValue = unknown> =
  | {
      readonly field: TableFieldKey<T, TValue>;
      readonly valueAccessor?: never;
    }
  | {
      readonly field?: never;
      readonly valueAccessor: (row: T) => TValue;
    };

type OptionalTableValueSource<T, TValue = unknown> =
  | TableValueSource<T, TValue>
  | {
      readonly field?: never;
      readonly valueAccessor?: never;
    };

export type TableCellType =
  'text' | 'number' | 'date' | 'link' | 'status' | 'progress' | 'actions' | 'custom';

export type TableColumnClass = string | readonly string[];

export interface TableResponsiveConfig {
  readonly hiddenBelow?: TableBreakpoint;
}

export interface TableColumnBase<T, TType extends TableCellType> {
  readonly key: TableColumnKey;
  readonly label: TranslatedText;
  readonly type: TType;
  readonly sortable?: boolean;
  readonly sortKey?: string;
  readonly defaultVisible?: boolean;
  readonly required?: boolean;
  readonly width?: string;
  readonly minWidth?: string;
  readonly headerAlign?: TableAlignment;
  readonly cellAlign?: TableAlignment;
  readonly sticky?: 'inline-start' | 'inline-end';
  readonly truncate?: boolean;
  readonly tooltip?: 'none' | 'always';
  readonly fallback?: TranslatedText;
  readonly headerClass?: TableColumnClass;
  readonly cellClass?: TableColumnClass | ((context: TableCellContext<T>) => TableColumnClass);
  readonly responsive?: TableResponsiveConfig;
  readonly templateKey?: string;
}

export type TableTextColumn<T> = TableColumnBase<T, 'text'> & TableValueSource<T>;

export type TableNumberColumn<T> = TableColumnBase<T, 'number'> &
  TableValueSource<T, number | null | undefined> & {
    readonly numberFormat?: Readonly<Intl.NumberFormatOptions>;
  };

export type TableDateFormat =
  | {
      readonly kind: 'intl';
      readonly options: Readonly<Intl.DateTimeFormatOptions>;
      readonly timeZone?: string;
    }
  | {
      readonly kind: 'pattern';
      readonly pattern: string;
      readonly timeZone?: string;
    };

export type TableDateColumn<T> = TableColumnBase<T, 'date'> &
  TableValueSource<T, Date | string | number | null | undefined> & {
    readonly dateFormat: TableDateFormat;
  };

export interface TableLinkTarget {
  readonly commands: readonly unknown[];
  readonly queryParams?: Readonly<Record<string, unknown>>;
}

export type TableLinkColumn<T> = TableColumnBase<T, 'link'> &
  TableValueSource<T> & {
    readonly resolveLink: (row: T, value: unknown) => TableLinkTarget;
    readonly disabled?: (row: T, value: unknown) => boolean;
    readonly accessibleLabel?: (row: T, value: unknown) => TranslatedText;
  };

export type TableStatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

export interface TableStatusDisplay {
  readonly label: TranslatedText;
  readonly tone: TableStatusTone;
}

export type TableStatusColumn<T> = TableColumnBase<T, 'status'> &
  TableValueSource<T> & {
    readonly resolveStatus: (row: T, value: unknown) => TableStatusDisplay;
  };

export type TableProgressTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export interface TableProgressDisplay {
  readonly value: number;
  readonly max?: number;
  readonly label?: TranslatedText;
  readonly tone?: TableProgressTone;
}

export type TableProgressColumn<T> = TableColumnBase<T, 'progress'> &
  TableValueSource<T> & {
    readonly resolveProgress: (row: T, value: unknown) => TableProgressDisplay;
  };

export type TableActionVariant = 'default' | 'primary' | 'success' | 'danger';

export interface TableRowAction<T> {
  readonly id: string;
  readonly label: TranslatedText;
  readonly icon: string;
  readonly tooltip?: TranslatedText;
  readonly variant?: TableActionVariant;
  readonly visible?: (row: T) => boolean;
  readonly disabled?: (row: T) => boolean;
  readonly loading?: (row: T) => boolean;
  readonly accessibleLabel?: (row: T) => TranslatedText;
}

export type TableActionsColumn<T> = TableColumnBase<T, 'actions'> & {
  readonly actions: readonly TableRowAction<T>[];
};

export type TableCustomColumn<T> = TableColumnBase<T, 'custom'> & OptionalTableValueSource<T>;

/**
 * Phase 4 rendering boundary:
 * - text remains the table's simple semantic fallback;
 * - number and date use pure formatting utilities or pipes;
 * - link, status, progress, and actions use dedicated cell components;
 * - custom projected templates take precedence over every built-in renderer.
 */
export type DynamicTableColumn<T> =
  | TableTextColumn<T>
  | TableNumberColumn<T>
  | TableDateColumn<T>
  | TableLinkColumn<T>
  | TableStatusColumn<T>
  | TableProgressColumn<T>
  | TableActionsColumn<T>
  | TableCustomColumn<T>;

export interface TableCellContext<T, TValue = unknown> {
  readonly $implicit: T;
  readonly row: T;
  readonly value: TValue;
  readonly column: DynamicTableColumn<T>;
  readonly rowIndex: number;
  readonly rowId: TableRowId;
}

export interface TableHeaderContext<T> {
  readonly $implicit: DynamicTableColumn<T>;
  readonly column: DynamicTableColumn<T>;
}

export interface TableActionEvent<T> {
  readonly action: TableRowAction<T>;
  readonly row: T;
  readonly rowId: TableRowId;
  readonly rowIndex: number;
}

export interface TableSort {
  readonly columnKey: TableColumnKey;
  readonly sortKey: string;
  readonly direction: TableSortDirection;
}

export interface TablePaginationState {
  /** One-based current page. */
  readonly page: number;
  readonly pageSize: number;
  readonly totalItems: number;
}

export interface TablePageChange {
  /** One-based requested page. */
  readonly page: number;
  readonly pageSize: number;
}

export type TableDataState =
  | {
      readonly kind: 'ready';
    }
  | {
      readonly kind: 'loading';
      readonly mode: 'initial' | 'refresh';
    }
  | {
      readonly kind: 'empty';
      readonly title?: TranslatedText;
      readonly description?: TranslatedText;
    }
  | {
      readonly kind: 'no-results';
      readonly title?: TranslatedText;
      readonly description?: TranslatedText;
    }
  | {
      readonly kind: 'error';
      readonly display: 'replace' | 'inline';
      readonly message?: TranslatedText;
      readonly retryable?: boolean;
    };

export interface TableQueryState<TFilters extends object = Readonly<Record<string, unknown>>> {
  /** One-based current page. */
  readonly page: number;
  readonly pageSize: number;
  readonly sort: TableSort | null;
  readonly search: string;
  readonly filters: Readonly<TFilters>;
}

export interface TableViewState {
  readonly visibleColumnKeys: readonly TableColumnKey[];
  readonly columnOrder: readonly TableColumnKey[];
}
