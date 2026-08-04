import { TranslatedText } from '../dynamic-table/dynamic-table.types';

export interface TableViewOption {
  readonly key: string;
  readonly label: TranslatedText;
  readonly visible: boolean;
  readonly hideable?: boolean;
  readonly reorderable?: boolean;
}

export interface TableViewOptionChange {
  readonly key: string;
  readonly visible: boolean;
}

export interface TableViewOptionOrderChange {
  readonly orderedKeys: readonly string[];
}

interface TableFilterFieldBase<TKind extends TableFilterFieldKind> {
  readonly key: string;
  readonly label: TranslatedText;
  readonly kind: TKind;
  readonly disabled?: boolean;
}

export interface TableFilterOption {
  readonly value: string;
  readonly label: TranslatedText;
  readonly tone?: 'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'accent';
}

export interface TableTextFilterField extends TableFilterFieldBase<'text'> {
  readonly placeholder?: TranslatedText;
}

export interface TableDateFilterField extends TableFilterFieldBase<'date'> {
  readonly placeholder?: TranslatedText;
}

export interface TableSingleSelectFilterField extends TableFilterFieldBase<'single-select'> {
  readonly options: readonly TableFilterOption[];
  readonly clearOption?: TableFilterOption;
  readonly placeholder?: TranslatedText;
  readonly presentation?: 'select' | 'segments';
}

export interface TableMultipleSelectFilterField extends TableFilterFieldBase<'multiple-select'> {
  readonly options: readonly TableFilterOption[];
  readonly presentation?: 'list' | 'chips';
}

export type TableFilterFieldKind = 'text' | 'date' | 'single-select' | 'multiple-select';

export type TableFilterField =
  | TableTextFilterField
  | TableDateFilterField
  | TableSingleSelectFilterField
  | TableMultipleSelectFilterField;

export type TableFilterValue = string | null | readonly string[];

export type TableFilterModel = Readonly<Record<string, TableFilterValue | undefined>>;
