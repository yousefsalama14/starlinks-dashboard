import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  HostListener,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslatedText } from '../dynamic-table/dynamic-table.types';
import { TableSearchOptionDefDirective } from './table-search-option-def.directive';
import {
  TableRecentSearch,
  TableSearchField,
  TableSearchId,
  TableSearchOptionContext,
  TableSearchSuggestion,
  TableSearchSuggestionsState,
} from './table-search.types';

type FieldNavigationOption = {
  readonly kind: 'field';
  readonly field: TableSearchField;
};

type RecentNavigationOption = {
  readonly kind: 'recent';
  readonly recent: TableRecentSearch;
};

type SearchNavigationOption = FieldNavigationOption | RecentNavigationOption;

const DEFAULT_SUGGESTIONS_TITLE: TranslatedText = {
  key: 'STARLINKS.TABLE.SEARCH.SUGGESTIONS',
};

let nextTableSearchInstance = 0;

@Component({
  selector: 'app-table-search',
  host: {
    class: 'table-search-host--motion-safe table-search-host--responsive-width',
    '[class.table-search-host--focused]': 'focused()',
    '[class.table-search-host--open]': 'open()',
    '[class.table-search-host--expanded]': 'expanded()',
  },
  imports: [NgTemplateOutlet, TranslatePipe],
  templateUrl: './table-search.component.html',
  styleUrl: './table-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableSearchComponent<T> {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly instanceId = `table-search-${++nextTableSearchInstance}`;
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly optionDefinition = contentChild(TableSearchOptionDefDirective<T>);
  private suppressNextFocusOpen = false;

  readonly fields = input.required<readonly TableSearchField[]>();
  readonly selectedFieldKey = input.required<string | null>();
  readonly query = input.required<string>();
  readonly suggestions = input.required<readonly TableSearchSuggestion<T>[]>();
  readonly suggestionsState = input.required<TableSearchSuggestionsState>();
  readonly recentSearches = input<readonly TableRecentSearch[]>([]);
  readonly disabled = input(false);
  readonly minimumQueryLength = input(2);
  readonly showRecentSearches = input(true);
  readonly allowClearRecent = input(true);
  readonly fieldGroupTitle = input<TranslatedText | null>(null);
  readonly suggestionsTitle = input<TranslatedText>(DEFAULT_SUGGESTIONS_TITLE);

  readonly fieldChange = output<string>();
  readonly queryChange = output<string>();
  readonly suggestionSelected = output<TableSearchSuggestion<T>>();
  readonly recentSearchSelected = output<TableRecentSearch>();
  readonly clearRecent = output<void>();
  readonly clearSearch = output<void>();
  readonly retry = output<void>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  protected readonly open = signal(false);
  protected readonly focused = signal(false);
  protected readonly activeControlIndex = signal(-1);
  protected readonly activeSuggestionId = signal<TableSearchId | null>(null);

  protected readonly inputId = `${this.instanceId}-input`;
  protected readonly overlayId = `${this.instanceId}-overlay`;
  protected readonly listboxId = `${this.instanceId}-suggestions`;
  protected readonly fieldGroupId = `${this.instanceId}-fields`;
  protected readonly recentGroupId = `${this.instanceId}-recent`;

  protected readonly resolvedFields = computed(() => validateFields(this.fields()));
  protected readonly selectedField = computed(() => {
    const key = this.selectedFieldKey();
    return (
      this.resolvedFields().find((field) => field.key === key && field.searchable !== false) ?? null
    );
  });
  protected readonly resolvedRecentSearches = computed(() => {
    const fieldKeys = new Set(this.resolvedFields().map((field) => field.key));
    return validateRecentSearches(this.recentSearches()).filter((recent) =>
      fieldKeys.has(recent.fieldKey),
    );
  });
  protected readonly resolvedSuggestions = computed(() => validateSuggestions(this.suggestions()));
  protected readonly normalizedMinimumLength = computed(() =>
    Math.max(
      0,
      Math.floor(Number.isFinite(this.minimumQueryLength()) ? this.minimumQueryLength() : 0),
    ),
  );
  protected readonly suggestionsMode = computed(
    () =>
      this.selectedField() !== null && this.query().trim().length >= this.normalizedMinimumLength(),
  );
  protected readonly expanded = computed(
    () => this.focused() || this.open() || this.query().length > 0,
  );
  protected readonly navigationOptions = computed<readonly SearchNavigationOption[]>(() => {
    const fields: FieldNavigationOption[] = this.resolvedFields()
      .filter((field) => field.searchable !== false)
      .map((field) => ({ kind: 'field', field }));
    const recent: RecentNavigationOption[] =
      this.showRecentSearches() && this.resolvedRecentSearches().length > 0
        ? this.resolvedRecentSearches().map((item) => ({ kind: 'recent', recent: item }))
        : [];
    return [...fields, ...recent];
  });
  protected readonly activeSuggestionIndex = computed(() =>
    this.resolvedSuggestions().findIndex(
      (suggestion) => suggestion.id === this.activeSuggestionId(),
    ),
  );
  protected readonly activeDescendant = computed(() => {
    if (
      !this.open() ||
      !this.suggestionsMode() ||
      this.suggestionsState().kind !== 'ready' ||
      this.activeSuggestionIndex() < 0
    ) {
      return null;
    }
    return this.optionDomId(this.resolvedSuggestions()[this.activeSuggestionIndex()].id);
  });

  constructor() {
    effect(() => {
      if (this.disabled() && this.open()) {
        this.closeOverlay();
      }
    });

    effect(() => {
      const options = this.navigationOptions();
      if (this.activeControlIndex() >= options.length) {
        this.activeControlIndex.set(-1);
      }
    });

    effect(() => {
      const mode = this.suggestionsMode();
      const state = this.suggestionsState();
      const suggestions = this.resolvedSuggestions();
      const activeId = this.activeSuggestionId();

      if (
        !mode ||
        state.kind !== 'ready' ||
        !suggestions.some((suggestion) => suggestion.id === activeId)
      ) {
        this.activeSuggestionId.set(null);
      }
    });
  }

  @HostListener('document:pointerdown', ['$event'])
  protected handleDocumentPointerDown(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeOverlay();
    }
  }

  protected openOverlay(): void {
    if (this.disabled() || this.open()) {
      return;
    }
    this.open.set(true);
    this.opened.emit();
  }

  protected handleInputFocus(): void {
    this.focused.set(true);
    if (this.suppressNextFocusOpen) {
      this.suppressNextFocusOpen = false;
      return;
    }
    this.openOverlay();
  }

  protected handleInputBlur(): void {
    this.focused.set(false);
  }

  protected handleControlClick(event: MouseEvent): void {
    const target = event.target;
    if (this.disabled() || !(target instanceof Element) || target.closest('button')) {
      return;
    }

    this.openOverlay();
    if (target !== this.searchInput().nativeElement) {
      this.focusInput();
    }
  }

  protected closeOverlay(restoreFocus = false): void {
    if (!this.open()) {
      if (restoreFocus) {
        this.focusInputWithoutOpening();
      }
      return;
    }
    this.open.set(false);
    this.activeControlIndex.set(-1);
    this.activeSuggestionId.set(null);
    this.closed.emit();
    if (restoreFocus) {
      this.focusInputWithoutOpening();
    }
  }

  protected handleInput(event: Event): void {
    if (this.disabled()) {
      return;
    }
    this.queryChange.emit((event.target as HTMLInputElement).value);
    this.openOverlay();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) {
      return;
    }

    if (event.key === 'Escape') {
      if (this.open()) {
        event.preventDefault();
        this.closeOverlay(true);
      }
      return;
    }

    if (event.key === 'Tab') {
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter'].includes(event.key)) {
      return;
    }

    if (!this.open()) {
      this.openOverlay();
    }

    if (this.suggestionsMode()) {
      this.handleSuggestionKey(event);
    } else {
      this.handleControlKey(event);
    }
  }

  protected selectField(field: TableSearchField): void {
    if (this.disabled() || field.searchable === false) {
      return;
    }
    this.fieldChange.emit(field.key);
    this.activeControlIndex.set(-1);
    this.scheduleInputFocus();
  }

  protected selectRecent(recent: TableRecentSearch): void {
    if (this.disabled()) {
      return;
    }
    this.recentSearchSelected.emit(recent);
    this.activeControlIndex.set(-1);
    this.scheduleInputFocus();
  }

  protected selectSuggestion(suggestion: TableSearchSuggestion<T>): void {
    if (this.disabled() || this.suggestionsState().kind !== 'ready') {
      return;
    }
    this.suggestionSelected.emit(suggestion);
    this.closeOverlay();
    this.scheduleInputFocus(true);
  }

  protected requestClearSearch(): void {
    if (this.disabled()) {
      return;
    }
    this.clearSearch.emit();
    this.closeOverlay();
    this.scheduleInputFocus(true);
  }

  protected requestClearRecent(): void {
    if (!this.disabled() && this.allowClearRecent()) {
      this.clearRecent.emit();
    }
  }

  protected requestRetry(): void {
    const state = this.suggestionsState();
    if (!this.disabled() && state.kind === 'error' && state.retryable) {
      this.retry.emit();
    }
  }

  protected controlIsActive(index: number): boolean {
    return this.activeControlIndex() === index;
  }

  protected fieldNavigationIndex(field: TableSearchField): number {
    return this.navigationOptions().findIndex(
      (option) => option.kind === 'field' && option.field.key === field.key,
    );
  }

  protected recentNavigationIndex(recent: TableRecentSearch): number {
    return this.navigationOptions().findIndex(
      (option) => option.kind === 'recent' && option.recent.id === recent.id,
    );
  }

  protected resolvedRecentField(recent: TableRecentSearch): TableSearchField {
    return this.resolvedFields().find((field) => field.key === recent.fieldKey)!;
  }

  protected suggestionIsActive(suggestion: TableSearchSuggestion<T>): boolean {
    return suggestion.id === this.activeSuggestionId();
  }

  protected activateSuggestion(suggestion: TableSearchSuggestion<T>): void {
    if (!this.disabled() && this.suggestionsState().kind === 'ready') {
      this.activeSuggestionId.set(suggestion.id);
    }
  }

  protected optionContext(
    suggestion: TableSearchSuggestion<T>,
    index: number,
  ): TableSearchOptionContext<T> {
    return {
      $implicit: suggestion.value,
      suggestion,
      value: suggestion.value,
      index,
      active: this.suggestionIsActive(suggestion),
    };
  }

  protected optionTemplate() {
    return this.optionDefinition()?.template ?? null;
  }

  protected fallbackValue(value: T): string | null {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'bigint' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
    return null;
  }

  protected optionDomId(id: TableSearchId): string {
    const type = typeof id === 'number' ? 'n' : 's';
    return `${this.instanceId}-option-${type}-${encodeURIComponent(String(id)).replaceAll('%', '_')}`;
  }

  protected loadingMessage(): TranslatedText {
    return { key: 'STARLINKS.TABLE.SEARCH.LOADING' };
  }

  protected emptyMessage(): TranslatedText {
    const state = this.suggestionsState();
    return state.kind === 'empty' && state.message
      ? state.message
      : { key: 'STARLINKS.TABLE.SEARCH.NO_RESULTS' };
  }

  protected errorMessage(): TranslatedText {
    const state = this.suggestionsState();
    return state.kind === 'error' && state.message
      ? state.message
      : { key: 'STARLINKS.TABLE.SEARCH.ERROR' };
  }

  private handleControlKey(event: KeyboardEvent): void {
    const options = this.navigationOptions();
    if (options.length === 0) {
      return;
    }

    const current = this.activeControlIndex();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeControlIndex.set(current < 0 ? 0 : Math.min(current + 1, options.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeControlIndex.set(current < 0 ? options.length - 1 : Math.max(current - 1, 0));
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.activeControlIndex.set(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.activeControlIndex.set(options.length - 1);
    } else if (event.key === 'Enter' && current >= 0) {
      event.preventDefault();
      const option = options[current];
      if (option.kind === 'field') {
        this.selectField(option.field);
      } else {
        this.selectRecent(option.recent);
      }
    }
  }

  private handleSuggestionKey(event: KeyboardEvent): void {
    if (this.suggestionsState().kind !== 'ready') {
      return;
    }
    const suggestions = this.resolvedSuggestions();
    if (suggestions.length === 0) {
      return;
    }

    const current = this.activeSuggestionIndex();
    let nextIndex = current;
    if (event.key === 'ArrowDown') {
      nextIndex = current < 0 ? 0 : Math.min(current + 1, suggestions.length - 1);
    } else if (event.key === 'ArrowUp') {
      nextIndex = current < 0 ? suggestions.length - 1 : Math.max(current - 1, 0);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = suggestions.length - 1;
    } else if (event.key === 'Enter') {
      if (current >= 0) {
        event.preventDefault();
        this.selectSuggestion(suggestions[current]);
      }
      return;
    } else {
      return;
    }

    event.preventDefault();
    this.activeSuggestionId.set(suggestions[nextIndex].id);
  }

  private focusInput(): void {
    this.searchInput().nativeElement.focus();
  }

  private focusInputWithoutOpening(): void {
    const element = this.searchInput().nativeElement;
    if (document.activeElement === element) {
      return;
    }
    this.suppressNextFocusOpen = true;
    element.focus();
  }

  private scheduleInputFocus(withoutOpening = false): void {
    queueMicrotask(() => (withoutOpening ? this.focusInputWithoutOpening() : this.focusInput()));
  }
}

function validateFields(fields: readonly TableSearchField[]): readonly TableSearchField[] {
  const keys = new Set<string>();
  fields.forEach((field, index) => {
    if (typeof field.key !== 'string' || field.key.trim().length === 0) {
      throw new Error(
        `[TableSearch] Invalid field key at field index ${index}: ${String(field.key)}`,
      );
    }
    if (keys.has(field.key)) {
      throw new Error(`[TableSearch] Duplicate field key "${field.key}" at field index ${index}.`);
    }
    keys.add(field.key);
  });
  return fields;
}

function validateRecentSearches(
  recentSearches: readonly TableRecentSearch[],
): readonly TableRecentSearch[] {
  const ids = new Set<TableSearchId>();
  recentSearches.forEach((recent, index) => {
    validateId(recent.id, 'recent search', index);
    if (ids.has(recent.id)) {
      throw new Error(
        `[TableSearch] Duplicate recent search ID "${String(recent.id)}" at index ${index}.`,
      );
    }
    ids.add(recent.id);
    if (typeof recent.value !== 'string' || recent.value.trim().length === 0) {
      throw new Error(
        `[TableSearch] Invalid recent search value at index ${index}: ${String(recent.value)}`,
      );
    }
  });
  return recentSearches;
}

function validateSuggestions<T>(
  suggestions: readonly TableSearchSuggestion<T>[],
): readonly TableSearchSuggestion<T>[] {
  const ids = new Set<TableSearchId>();
  suggestions.forEach((suggestion, index) => {
    validateId(suggestion.id, 'suggestion', index);
    if (ids.has(suggestion.id)) {
      throw new Error(
        `[TableSearch] Duplicate suggestion ID "${String(suggestion.id)}" at index ${index}.`,
      );
    }
    ids.add(suggestion.id);
  });
  return suggestions;
}

function validateId(id: TableSearchId, kind: string, index: number): void {
  const valid =
    (typeof id === 'string' && id.trim().length > 0) ||
    (typeof id === 'number' && Number.isFinite(id));
  if (!valid) {
    throw new Error(`[TableSearch] Invalid ${kind} ID at index ${index}: ${String(id)}`);
  }
}
