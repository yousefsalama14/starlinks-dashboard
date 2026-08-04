import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { TableLinkColumn, TableLinkTarget, TranslatedText } from '../../dynamic-table.types';

@Component({
  selector: 'app-table-link-cell',
  imports: [RouterLink, TranslatePipe],
  templateUrl: './table-link-cell.component.html',
  styleUrl: './table-link-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableLinkCellComponent<T> {
  readonly row = input.required<T>();
  readonly value = input.required<unknown>();
  readonly column = input.required<TableLinkColumn<T>>();
  readonly disabled = input(false);

  protected readonly displayValue = computed<string | null>(() => {
    const value = this.value();
    return value === null || value === undefined ? null : String(value);
  });

  protected readonly isDisabled = computed(() => {
    const value = this.value();
    return (
      this.disabled() ||
      value === null ||
      value === undefined ||
      this.column().disabled?.(this.row(), value) === true
    );
  });

  protected readonly linkTarget = computed<TableLinkTarget | null>(() => {
    if (this.isDisabled()) {
      return null;
    }

    return this.column().resolveLink(this.row(), this.value());
  });

  protected readonly accessibleLabel = computed<TranslatedText | null>(() => {
    const value = this.value();
    if (value === null || value === undefined) {
      return null;
    }

    return this.column().accessibleLabel?.(this.row(), value) ?? null;
  });

  protected readonly tooltip = computed(() =>
    this.column().tooltip === 'always' ? this.displayValue() : null,
  );
}
