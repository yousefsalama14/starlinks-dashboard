import { DynamicTableColumn, TableViewState } from './dynamic-table.types';

/**
 * Resolves immutable column order and visibility, then enforces the v1 sticky policy.
 * V1 supports at most one visible sticky column on each logical side.
 */
export function resolveTableColumns<T>(
  columns: readonly DynamicTableColumn<T>[],
  viewState: TableViewState | null,
): readonly DynamicTableColumn<T>[] {
  const uniqueColumns = new Map<string, DynamicTableColumn<T>>();

  for (const column of columns) {
    if (uniqueColumns.has(column.key)) {
      throw new Error(`[DynamicTable] Duplicate column key "${column.key}". Keys must be unique.`);
    }

    if (column.type === 'actions') {
      assertActionIds(column.key, column.actions);
    }

    uniqueColumns.set(column.key, column);
  }

  const declaredColumns = [...uniqueColumns.values()];
  const orderedColumns = viewState
    ? resolveColumnOrder(declaredColumns, uniqueColumns, viewState)
    : declaredColumns;
  const visibleColumns = viewState
    ? resolveViewStateVisibility(orderedColumns, uniqueColumns, viewState)
    : orderedColumns.filter(
        (column) => column.required === true || column.defaultVisible !== false,
      );

  assertStickyColumnPolicy(visibleColumns);
  return visibleColumns;
}

function assertActionIds<T>(columnKey: string, actions: readonly { readonly id: string }[]): void {
  const seenIds = new Set<string>();

  actions.forEach((action, index) => {
    if (typeof action.id !== 'string' || action.id.trim().length === 0) {
      throw new Error(
        `[DynamicTable] Invalid action ID in column "${columnKey}" at action index ${index}: ` +
          `${JSON.stringify(action.id)}. Expected a non-empty string.`,
      );
    }

    if (seenIds.has(action.id)) {
      throw new Error(
        `[DynamicTable] Duplicate action ID "${action.id}" in column "${columnKey}" at ` +
          `action index ${index}. Action IDs must be unique within an actions column.`,
      );
    }

    seenIds.add(action.id);
  });
}

function resolveColumnOrder<T>(
  declaredColumns: readonly DynamicTableColumn<T>[],
  columnsByKey: ReadonlyMap<string, DynamicTableColumn<T>>,
  viewState: TableViewState,
): readonly DynamicTableColumn<T>[] {
  const orderedKeys = new Set(viewState.columnOrder);

  return [
    ...viewState.columnOrder
      .map((key) => columnsByKey.get(key))
      .filter((column): column is DynamicTableColumn<T> => column !== undefined),
    ...declaredColumns.filter((column) => !orderedKeys.has(column.key)),
  ];
}

function resolveViewStateVisibility<T>(
  orderedColumns: readonly DynamicTableColumn<T>[],
  columnsByKey: ReadonlyMap<string, DynamicTableColumn<T>>,
  viewState: TableViewState,
): readonly DynamicTableColumn<T>[] {
  const visibleKeys = new Set(viewState.visibleColumnKeys.filter((key) => columnsByKey.has(key)));

  return orderedColumns.filter((column) => column.required === true || visibleKeys.has(column.key));
}

function assertStickyColumnPolicy<T>(columns: readonly DynamicTableColumn<T>[]): void {
  for (const side of ['inline-start', 'inline-end'] as const) {
    const conflictingKeys = columns
      .filter((column) => column.sticky === side)
      .map((column) => column.key);

    if (conflictingKeys.length > 1) {
      throw new Error(
        `[DynamicTable] Multiple visible columns are sticky on "${side}": ` +
          `${conflictingKeys.map((key) => `"${key}"`).join(', ')}. ` +
          'V1 supports at most one visible sticky column per side.',
      );
    }
  }
}
