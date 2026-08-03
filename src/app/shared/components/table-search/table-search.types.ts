import { TranslatedText } from '../dynamic-table/dynamic-table.types';

export type TableSearchId = string | number;

export interface TableSearchField {
  readonly key: string;
  readonly label: TranslatedText;
  readonly icon?: string;
  readonly searchable?: boolean;
}

export interface TableSearchQuery {
  readonly fieldKey: string;
  readonly value: string;
}

export interface TableRecentSearch {
  readonly id: TableSearchId;
  readonly fieldKey: string;
  readonly value: string;
  readonly displayValue?: TranslatedText;
}

export interface TableSearchSuggestion<T> {
  readonly id: TableSearchId;
  readonly value: T;
}

export type TableSearchSuggestionsState =
  | { readonly kind: 'idle' }
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready' }
  | { readonly kind: 'empty'; readonly message?: TranslatedText }
  | {
      readonly kind: 'error';
      readonly message?: TranslatedText;
      readonly retryable?: boolean;
    };

export interface TableSearchOptionContext<T> {
  readonly $implicit: T;
  readonly suggestion: TableSearchSuggestion<T>;
  readonly value: T;
  readonly index: number;
  readonly active: boolean;
}
