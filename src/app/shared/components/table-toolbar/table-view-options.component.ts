import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslatedText } from '../dynamic-table/dynamic-table.types';
import { SideDrawerComponent } from '../side-drawer/side-drawer.component';
import { SideDrawerFooterDirective } from '../side-drawer/side-drawer-footer.directive';
import { validateTableFilterDraft, validateTableFilterFields } from './table-filter-validation';
import {
  TableFilterField,
  TableFilterModel,
  TableMultipleSelectFilterField,
  TableSingleSelectFilterField,
  TableViewOption,
  TableViewOptionChange,
  TableViewOptionOrderChange,
} from './table-toolbar.types';

const DEFAULT_TITLE: TranslatedText = { key: 'STARLINKS.TABLE.VIEW_OPTIONS.TITLE' };
const EMPTY_FILTER_FIELDS: readonly TableFilterField[] = Object.freeze([]);
const EMPTY_FILTER_DRAFT: TableFilterModel = Object.freeze({});
let nextViewOptionsId = 0;

@Component({
  selector: 'app-table-view-options',
  imports: [SideDrawerComponent, SideDrawerFooterDirective, TranslatePipe],
  templateUrl: './table-view-options.component.html',
  styleUrl: './table-view-options.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableViewOptionsComponent {
  private readonly instanceId = `table-view-options-${++nextViewOptionsId}`;

  readonly options = input.required<readonly TableViewOption[]>();
  readonly disabled = input(false);
  readonly title = input<TranslatedText>(DEFAULT_TITLE);
  readonly filterFields = input<readonly TableFilterField[]>(EMPTY_FILTER_FIELDS);
  readonly draftValue = input<TableFilterModel>(EMPTY_FILTER_DRAFT);
  readonly open = model(false);

  readonly optionChange = output<TableViewOptionChange>();
  readonly orderChange = output<TableViewOptionOrderChange>();
  readonly showAll = output<void>();
  readonly draftChange = output<TableFilterModel>();
  readonly apply = output<TableFilterModel>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  protected readonly resolvedOptions = computed(() => validateViewOptions(this.options()));
  protected readonly visibleCount = computed(
    () => this.resolvedOptions().filter((option) => option.visible).length,
  );
  protected readonly resolvedFilterFields = computed(() =>
    validateTableFilterFields(this.filterFields()).filter(
      (field) =>
        (field.kind === 'single-select' && field.presentation === 'segments') ||
        (field.kind === 'multiple-select' && field.presentation === 'chips'),
    ),
  );
  protected readonly validatedDraft = computed(() =>
    validateTableFilterDraft(this.draftValue(), this.resolvedFilterFields()),
  );
  protected readonly draggedKey = signal<string | null>(null);
  protected readonly keyboardOptionKey = signal<string | null>(null);
  protected readonly triggerId = `${this.instanceId}-trigger`;
  protected readonly drawerId = `${this.instanceId}-drawer`;
  protected readonly reorderInstructionsId = `${this.instanceId}-reorder-instructions`;

  constructor() {
    effect(() => {
      if (this.disabled() && this.open()) {
        this.requestClose();
      }
    });
  }

  protected toggleDrawer(): void {
    if (this.disabled()) {
      return;
    }
    if (this.open()) {
      this.requestClose();
      return;
    }
    this.open.set(true);
    this.opened.emit();
  }

  protected requestClose(): void {
    if (!this.open()) {
      return;
    }
    this.open.set(false);
    this.keyboardOptionKey.set(null);
    this.draggedKey.set(null);
    this.closed.emit();
  }

  protected requestOptionChange(option: TableViewOption): void {
    if (this.disabled() || option.hideable === false) {
      return;
    }
    if (option.visible && this.visibleCount() <= 1) {
      return;
    }
    this.optionChange.emit({ key: option.key, visible: !option.visible });
  }

  protected requestShowAll(): void {
    if (!this.disabled() && this.resolvedOptions().some((option) => !option.visible)) {
      this.showAll.emit();
    }
  }

  protected requestMultipleToggle(
    field: TableMultipleSelectFilterField,
    optionValue: string,
  ): void {
    if (this.disabled() || field.disabled) {
      return;
    }
    const selected = new Set(this.multipleValue(field));
    if (selected.has(optionValue)) {
      selected.delete(optionValue);
    } else {
      selected.add(optionValue);
    }
    this.emitDraft(
      field,
      Object.freeze(
        field.options.filter((option) => selected.has(option.value)).map((option) => option.value),
      ),
    );
  }

  protected requestSegmentChange(field: TableSingleSelectFilterField, value: string | null): void {
    this.emitDraft(field, value);
  }

  protected multipleSelected(field: TableMultipleSelectFilterField, value: string): boolean {
    return this.multipleValue(field).includes(value);
  }

  protected singleValue(field: TableSingleSelectFilterField): string {
    const value = this.validatedDraft()[field.key];
    return typeof value === 'string' && field.options.some((option) => option.value === value)
      ? value
      : '';
  }

  protected filterGroupId(key: string): string {
    return `${this.instanceId}-filter-${encodeURIComponent(key).replaceAll('%', '_')}`;
  }

  protected requestApply(): void {
    if (this.disabled() || this.resolvedFilterFields().length === 0) {
      return;
    }
    this.apply.emit(this.validatedDraft());
    this.requestClose();
  }

  protected startDrag(option: TableViewOption, event: DragEvent): void {
    if (this.disabled() || option.reorderable === false) {
      event.preventDefault();
      return;
    }
    this.draggedKey.set(option.key);
    event.dataTransfer?.setData('text/plain', option.key);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected allowDrop(event: DragEvent): void {
    if (this.draggedKey()) {
      event.preventDefault();
    }
  }

  protected dropBefore(target: TableViewOption, event: DragEvent): void {
    event.preventDefault();
    const sourceKey = this.draggedKey() ?? event.dataTransfer?.getData('text/plain') ?? null;
    this.draggedKey.set(null);
    if (sourceKey) {
      this.emitReordered(sourceKey, target.key);
    }
  }

  protected endDrag(): void {
    this.draggedKey.set(null);
  }

  protected toggleKeyboardActions(option: TableViewOption): void {
    if (this.disabled() || option.reorderable === false) {
      return;
    }
    this.keyboardOptionKey.update((key) => (key === option.key ? null : option.key));
  }

  protected moveOption(option: TableViewOption, direction: -1 | 1): void {
    if (this.disabled() || option.reorderable === false) {
      return;
    }
    const options = this.resolvedOptions();
    const currentIndex = options.findIndex((item) => item.key === option.key);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= options.length) {
      return;
    }
    const next = [...options.map((item) => item.key)];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    this.orderChange.emit({ orderedKeys: Object.freeze(next) });
    this.keyboardOptionKey.set(null);
  }

  protected canMove(option: TableViewOption, direction: -1 | 1): boolean {
    const index = this.resolvedOptions().findIndex((item) => item.key === option.key);
    return (
      option.reorderable !== false &&
      index + direction >= 0 &&
      index + direction < this.resolvedOptions().length
    );
  }

  private emitReordered(sourceKey: string, targetKey: string): void {
    if (sourceKey === targetKey) {
      return;
    }
    const orderedKeys = this.resolvedOptions().map((option) => option.key);
    const sourceIndex = orderedKeys.indexOf(sourceKey);
    const targetIndex = orderedKeys.indexOf(targetKey);
    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }
    const next = [...orderedKeys];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    this.orderChange.emit({ orderedKeys: Object.freeze(next) });
  }

  private multipleValue(field: TableMultipleSelectFilterField): readonly string[] {
    const value = this.validatedDraft()[field.key];
    if (!Array.isArray(value)) {
      return [];
    }
    const configuredValues = new Set(field.options.map((option) => option.value));
    return value.filter((item) => configuredValues.has(item));
  }

  private emitDraft(field: TableFilterField, value: string | null | readonly string[]): void {
    if (this.disabled() || field.disabled) {
      return;
    }
    this.draftChange.emit(Object.freeze({ ...this.validatedDraft(), [field.key]: value }));
  }
}

function validateViewOptions(options: readonly TableViewOption[]): readonly TableViewOption[] {
  const keys = new Set<string>();
  options.forEach((option, index) => {
    if (typeof option.key !== 'string' || option.key.trim().length === 0) {
      throw new Error(
        `[TableViewOptions] Invalid option key at index ${index}: ${String(option.key)}`,
      );
    }
    if (keys.has(option.key)) {
      throw new Error(`[TableViewOptions] Duplicate option key "${option.key}" at index ${index}.`);
    }
    if (option.hideable === false && !option.visible) {
      throw new Error(`[TableViewOptions] Non-hideable option "${option.key}" must be visible.`);
    }
    keys.add(option.key);
  });
  if (options.length > 0 && options.every((option) => !option.visible)) {
    throw new Error('[TableViewOptions] At least one option must be visible.');
  }
  return options;
}
