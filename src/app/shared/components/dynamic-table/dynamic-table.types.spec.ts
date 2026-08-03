import {
  TableCustomColumn,
  TableDateColumn,
  TableNumberColumn,
  TableTextColumn,
} from './dynamic-table.types';

interface TypedRow {
  readonly id: string;
  readonly name: string;
  readonly count?: number | null;
  readonly createdAt: Date | string | number | null;
  readonly active: boolean;
}

describe('dynamic table column contracts', () => {
  it('accepts value-compatible number and date property keys', () => {
    const numberColumn = {
      key: 'count',
      label: { key: 'COUNT' },
      type: 'number',
      field: 'count',
    } satisfies TableNumberColumn<TypedRow>;
    const dateColumn = {
      key: 'createdAt',
      label: { key: 'CREATED_AT' },
      type: 'date',
      field: 'createdAt',
      dateFormat: { kind: 'intl', options: {} },
    } satisfies TableDateColumn<TypedRow>;

    expect(numberColumn.field).toBe('count');
    expect(dateColumn.field).toBe('createdAt');
  });

  it('rejects incompatible number and date property keys at compile time', () => {
    const invalidNumberColumn = {
      key: 'name-as-number',
      label: { key: 'NAME' },
      type: 'number',
      // @ts-expect-error String fields are not valid number sources.
      field: 'name',
    } satisfies TableNumberColumn<TypedRow>;
    const invalidDateColumn = {
      key: 'active-as-date',
      label: { key: 'ACTIVE' },
      type: 'date',
      // @ts-expect-error Boolean fields are not valid date sources.
      field: 'active',
      dateFormat: { kind: 'intl', options: {} },
    } satisfies TableDateColumn<TypedRow>;

    expect(invalidNumberColumn.field).toBe('name');
    expect(invalidDateColumn.field).toBe('active');
  });

  it('allows custom templates to resolve by their column key', () => {
    const column = {
      key: 'custom-name',
      label: { key: 'NAME' },
      type: 'custom',
      field: 'name',
    } satisfies TableCustomColumn<TypedRow>;

    expect(column.key).toBe('custom-name');
    expect('templateKey' in column).toBe(false);
  });

  it('does not expose unsupported reordering or overflow-tooltip options', () => {
    const reorderableColumn = {
      key: 'name',
      label: { key: 'NAME' },
      type: 'text',
      field: 'name',
      // @ts-expect-error Column drag-and-drop is not part of the v1 contract.
      reorderable: true,
    } satisfies TableTextColumn<TypedRow>;
    const overflowTooltipColumn = {
      key: 'name',
      label: { key: 'NAME' },
      type: 'text',
      field: 'name',
      // @ts-expect-error Overflow measurement is not implemented in v1.
      tooltip: 'on-overflow',
    } satisfies TableTextColumn<TypedRow>;

    expect(reorderableColumn.reorderable).toBe(true);
    expect(overflowTooltipColumn.tooltip).toBe('on-overflow');
  });
});
