import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  computed,
  input,
  output,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import {
  TableActionEvent,
  TableActionVariant,
  TableRowAction,
  TableRowId,
  TranslatedText,
} from '../../dynamic-table.types';

interface ResolvedTableAction<T> {
  readonly action: TableRowAction<T>;
  readonly variant: TableActionVariant;
  readonly icon: string;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly accessibleLabel: TranslatedText;
  readonly tooltip: TranslatedText | null;
}

@Component({
  selector: 'app-table-actions-cell',
  imports: [TranslatePipe],
  templateUrl: './table-actions-cell.component.html',
  styleUrl: './table-actions-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TableActionsCellComponent<T> {
  readonly actions = input.required<readonly TableRowAction<T>[]>();
  readonly row = input.required<T>();
  readonly rowId = input.required<TableRowId>();
  readonly rowIndex = input.required<number>();
  readonly disabled = input(false);

  readonly actionTriggered = output<TableActionEvent<T>>();

  protected readonly resolvedActions = computed<readonly ResolvedTableAction<T>[]>(() => {
    const actions = this.actions();
    this.validateActionIds(actions);

    const row = this.row();
    const resolved: ResolvedTableAction<T>[] = [];

    for (const action of actions) {
      if (action.visible?.(row) === false) {
        continue;
      }

      const loading = action.loading?.(row) === true;
      const actionDisabled = action.disabled?.(row) === true;
      resolved.push({
        action,
        variant: action.variant ?? 'default',
        icon: action.icon.trim(),
        disabled: this.disabled() || actionDisabled || loading,
        loading,
        accessibleLabel: action.accessibleLabel?.(row) ?? action.label,
        tooltip: action.tooltip ?? null,
      });
    }

    return resolved;
  });

  protected triggerAction(view: ResolvedTableAction<T>, event: MouseEvent): void {
    event.stopPropagation();
    if (view.disabled || view.loading) {
      return;
    }

    this.actionTriggered.emit({
      action: view.action,
      row: this.row(),
      rowId: this.rowId(),
      rowIndex: this.rowIndex(),
    });
  }

  private validateActionIds(actions: readonly TableRowAction<T>[]): void {
    const seenIds = new Set<string>();

    actions.forEach((action, index) => {
      if (typeof action.id !== 'string' || action.id.trim().length === 0) {
        throw new Error(
          `[DynamicTable] Invalid action ID at action index ${index}: ${JSON.stringify(action.id)}. Expected a non-empty string.`,
        );
      }

      if (seenIds.has(action.id)) {
        throw new Error(
          `[DynamicTable] Duplicate action ID "${action.id}" at action index ${index}. Action IDs must be unique within an actions column.`,
        );
      }

      seenIds.add(action.id);
    });
  }
}
