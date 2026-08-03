import { resolveTableColumns } from './column-resolution';
import { DynamicTableColumn, TableViewState } from './dynamic-table.types';

interface TestRow {
  readonly id: string;
  readonly first: string;
  readonly second: string;
  readonly third: string;
}

const COLUMNS: readonly DynamicTableColumn<TestRow>[] = [
  { key: 'first', label: { key: 'FIRST' }, type: 'text', field: 'first' },
  { key: 'second', label: { key: 'SECOND' }, type: 'text', field: 'second' },
  { key: 'third', label: { key: 'THIRD' }, type: 'text', field: 'third' },
];

describe('resolveTableColumns', () => {
  it('preserves declaration order and input immutability', () => {
    const columns = Object.freeze(COLUMNS.map((column) => Object.freeze({ ...column })));

    expect(resolveTableColumns(columns, null).map(({ key }) => key)).toEqual([
      'first',
      'second',
      'third',
    ]);
    expect(columns.map(({ key }) => key)).toEqual(['first', 'second', 'third']);
    expect(Object.isFrozen(columns)).toBe(true);
  });

  it('applies container order and visibility while retaining required columns', () => {
    const columns: readonly DynamicTableColumn<TestRow>[] = [
      { ...COLUMNS[0], required: true },
      COLUMNS[1],
      COLUMNS[2],
    ];
    const viewState: TableViewState = {
      columnOrder: ['unknown', 'third'],
      visibleColumnKeys: ['third', 'unknown'],
    };

    expect(resolveTableColumns(columns, viewState).map(({ key }) => key)).toEqual([
      'third',
      'first',
    ]);
  });

  it.each(['inline-start', 'inline-end'] as const)('accepts one %s sticky column', (side) => {
    const columns: readonly DynamicTableColumn<TestRow>[] = [
      { ...COLUMNS[0], sticky: side },
      COLUMNS[1],
    ];

    expect(resolveTableColumns(columns, null)).toHaveLength(2);
  });

  it('accepts one sticky column on each logical side together', () => {
    const columns: readonly DynamicTableColumn<TestRow>[] = [
      { ...COLUMNS[0], sticky: 'inline-start' },
      COLUMNS[1],
      { ...COLUMNS[2], sticky: 'inline-end' },
    ];

    expect(resolveTableColumns(columns, null)).toHaveLength(3);
  });

  it.each(['inline-start', 'inline-end'] as const)(
    'rejects two visible %s sticky columns and identifies their keys',
    (side) => {
      const columns: readonly DynamicTableColumn<TestRow>[] = [
        { ...COLUMNS[0], sticky: side },
        { ...COLUMNS[1], sticky: side },
      ];

      expect(() => resolveTableColumns(columns, null)).toThrowError(
        new RegExp(`Multiple visible columns are sticky on "${side}".*"first", "second"`),
      );
    },
  );

  it('does not treat a hidden sticky column as a conflict', () => {
    const columns: readonly DynamicTableColumn<TestRow>[] = [
      { ...COLUMNS[0], sticky: 'inline-start' },
      { ...COLUMNS[1], sticky: 'inline-start', defaultVisible: false },
    ];

    expect(resolveTableColumns(columns, null).map(({ key }) => key)).toEqual(['first']);
  });

  it('revalidates sticky conflicts after view-state visibility changes', () => {
    const columns: readonly DynamicTableColumn<TestRow>[] = [
      { ...COLUMNS[0], sticky: 'inline-end' },
      { ...COLUMNS[1], sticky: 'inline-end' },
    ];
    const oneVisible: TableViewState = {
      columnOrder: [],
      visibleColumnKeys: ['first'],
    };
    const bothVisible: TableViewState = {
      columnOrder: [],
      visibleColumnKeys: ['first', 'second'],
    };

    expect(resolveTableColumns(columns, oneVisible).map(({ key }) => key)).toEqual(['first']);
    expect(() => resolveTableColumns(columns, bothVisible)).toThrowError(
      /Multiple visible columns are sticky on "inline-end"/,
    );
  });

  it.each(['', '   '])('rejects invalid action ID %j with column context', (id) => {
    const columns: readonly DynamicTableColumn<TestRow>[] = [
      {
        key: 'actions',
        label: { key: 'ACTIONS' },
        type: 'actions',
        actions: [{ id, label: { key: 'EDIT' }, icon: 'edit-2' }],
      },
    ];

    expect(() => resolveTableColumns(columns, null)).toThrowError(
      /Invalid action ID in column "actions" at action index 0/,
    );
  });

  it('rejects duplicate action IDs before column visibility resolution', () => {
    const actions = Object.freeze([
      Object.freeze({ id: 'edit', label: { key: 'EDIT' }, icon: 'edit-2' }),
      Object.freeze({ id: 'edit', label: { key: 'EDIT_AGAIN' }, icon: 'edit' }),
    ]);
    const columns: readonly DynamicTableColumn<TestRow>[] = [
      {
        key: 'actions',
        label: { key: 'ACTIONS' },
        type: 'actions',
        actions,
        defaultVisible: false,
      },
    ];

    expect(() => resolveTableColumns(columns, null)).toThrowError(
      /Duplicate action ID "edit" in column "actions" at action index 1/,
    );
    expect(Object.isFrozen(actions)).toBe(true);
  });
});
