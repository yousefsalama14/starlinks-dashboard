import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { TableStatusColumn, TableStatusDisplay } from '../../dynamic-table.types';

@Component({
  selector: 'app-table-status-cell',
  imports: [TranslatePipe],
  templateUrl: './table-status-cell.component.html',
  styleUrl: './table-status-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableStatusCellComponent<T> {
  readonly row = input.required<T>();
  readonly value = input.required<unknown>();
  readonly column = input.required<TableStatusColumn<T>>();
  readonly resolvedDisplay = input<TableStatusDisplay | null>(null);

  protected readonly display = computed(
    () => this.resolvedDisplay() ?? this.column().resolveStatus(this.row(), this.value()),
  );
}
