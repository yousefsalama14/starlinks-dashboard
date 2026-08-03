import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  effect,
  input,
  model,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TranslatedText } from '../dynamic-table/dynamic-table.types';
import { SideDrawerComponent } from '../side-drawer/side-drawer.component';
import { SideDrawerFooterDirective } from '../side-drawer/side-drawer-footer.directive';
import {
  validateTableFilterActiveCount,
  validateTableFilterDraft,
  validateTableFilterFields,
} from './table-filter-validation';
import {
  TableFilterField,
  TableFilterModel,
  TableMultipleSelectFilterField,
  TableSingleSelectFilterField,
} from './table-toolbar.types';

const DEFAULT_TITLE: TranslatedText = { key: 'STARLINKS.TABLE.FILTERS.TITLE' };
let nextFiltersId = 0;

@Component({
  selector: 'app-table-filters',
  imports: [SideDrawerComponent, SideDrawerFooterDirective, TranslatePipe],
  templateUrl: './table-filters.component.html',
  styleUrl: './table-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableFiltersComponent {
  private readonly instanceId = `table-filters-${++nextFiltersId}`;

  readonly fields = input.required<readonly TableFilterField[]>();
  readonly draftValue = input.required<TableFilterModel>();
  readonly activeCount = input.required<number>();
  readonly disabled = input(false);
  readonly title = input<TranslatedText>(DEFAULT_TITLE);
  readonly open = model(false);

  readonly draftChange = output<TableFilterModel>();
  readonly apply = output<TableFilterModel>();
  readonly reset = output<void>();
  readonly opened = output<void>();
  readonly closed = output<void>();

  protected readonly resolvedFields = computed(() => validateTableFilterFields(this.fields()));
  protected readonly compactFields = computed(() =>
    this.resolvedFields().filter(
      (field) =>
        (field.kind === 'single-select' && field.presentation === 'segments') ||
        (field.kind === 'multiple-select' && field.presentation === 'chips'),
    ),
  );
  protected readonly detailedFields = computed(() =>
    this.resolvedFields().filter((field) => !this.compactFields().includes(field)),
  );
  protected readonly validatedDraft = computed(() =>
    validateTableFilterDraft(this.draftValue(), this.resolvedFields()),
  );
  protected readonly validatedActiveCount = computed(() =>
    validateTableFilterActiveCount(this.activeCount()),
  );
  protected readonly triggerId = `${this.instanceId}-trigger`;
  protected readonly drawerId = `${this.instanceId}-drawer`;
  protected readonly countId = `${this.instanceId}-active-count`;

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
    this.closed.emit();
  }

  protected requestTextChange(field: TableFilterField, event: Event): void {
    this.emitDraft(field, (event.target as HTMLInputElement).value);
  }

  protected requestDateChange(field: TableFilterField, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.emitDraft(field, value.length > 0 ? value : null);
  }

  protected requestSingleChange(field: TableSingleSelectFilterField, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.emitDraft(field, value.length > 0 ? value : null);
  }

  protected requestSegmentChange(field: TableSingleSelectFilterField, value: string | null): void {
    this.emitDraft(field, value);
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
    const next = Object.freeze(
      field.options.filter((option) => selected.has(option.value)).map((option) => option.value),
    );
    this.emitDraft(field, next);
  }

  protected requestMultipleChange(
    field: TableMultipleSelectFilterField,
    optionValue: string,
    event: Event,
  ): void {
    const selected = new Set(this.multipleValue(field));
    if ((event.target as HTMLInputElement).checked) {
      selected.add(optionValue);
    } else {
      selected.delete(optionValue);
    }
    const next = Object.freeze(
      field.options.filter((option) => selected.has(option.value)).map((option) => option.value),
    );
    this.emitDraft(field, next);
  }

  protected requestApply(): void {
    if (this.disabled()) {
      return;
    }
    this.apply.emit(this.validatedDraft());
    this.requestClose();
  }

  protected requestReset(): void {
    if (!this.disabled()) {
      this.reset.emit();
    }
  }

  protected controlId(key: string): string {
    return `${this.instanceId}-field-${encodeDomIdPart(key)}`;
  }

  protected optionId(fieldKey: string, value: string): string {
    return `${this.controlId(fieldKey)}-option-${encodeDomIdPart(value)}`;
  }

  protected groupId(key: string): string {
    return `${this.controlId(key)}-group`;
  }

  protected textValue(field: TableFilterField): string {
    const value = this.validatedDraft()[field.key];
    return typeof value === 'string' ? value : '';
  }

  protected singleValue(field: TableSingleSelectFilterField): string {
    const value = this.validatedDraft()[field.key];
    return typeof value === 'string' && field.options.some((option) => option.value === value)
      ? value
      : '';
  }

  protected multipleValue(field: TableMultipleSelectFilterField): readonly string[] {
    const value = this.validatedDraft()[field.key];
    if (!Array.isArray(value)) {
      return [];
    }
    const configuredValues = new Set(field.options.map((option) => option.value));
    return value.filter((item) => configuredValues.has(item));
  }

  protected multipleSelected(field: TableMultipleSelectFilterField, value: string): boolean {
    return this.multipleValue(field).includes(value);
  }

  private emitDraft(field: TableFilterField, value: string | null | readonly string[]): void {
    if (this.disabled() || field.disabled) {
      return;
    }
    const next = Object.freeze({ ...this.validatedDraft(), [field.key]: value });
    this.draftChange.emit(next);
  }
}

function encodeDomIdPart(value: string): string {
  return encodeURIComponent(value).replaceAll('%', '_');
}
