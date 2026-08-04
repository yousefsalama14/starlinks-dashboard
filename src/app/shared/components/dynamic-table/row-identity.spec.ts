import { resolveTableRows } from './row-identity';

interface TestRow {
  readonly id: string | number;
  readonly alternateId?: string | number;
  readonly label: string;
}

describe('resolveTableRows', () => {
  it('accepts string, numeric, and zero property-key identities', () => {
    const rows: readonly TestRow[] = [
      { id: 'first', label: 'First' },
      { id: 42, label: 'Second' },
      { id: 0, label: 'Third' },
    ];

    expect(resolveTableRows(rows, 'id').map(({ rowId }) => rowId)).toEqual(['first', 42, 0]);
  });

  it('accepts callback identities', () => {
    const rows: readonly TestRow[] = [
      { id: 'first', alternateId: 'alternate-first', label: 'First' },
      { id: 'second', alternateId: 2, label: 'Second' },
    ];

    expect(
      resolveTableRows(rows, (row) => row.alternateId ?? row.id).map(({ rowId }) => rowId),
    ).toEqual(['alternate-first', 2]);
  });

  it.each([
    ['', '""'],
    ['   ', '"   "'],
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'Infinity'],
    [Number.NEGATIVE_INFINITY, '-Infinity'],
  ] as const)('rejects invalid identity %s', (id, formattedId) => {
    expect(() => resolveTableRows([{ id, label: 'Invalid' }], 'id')).toThrowError(
      new RegExp(`Invalid row identity at row index 0: ${escapeRegExp(formattedId)}`),
    );
  });

  it.each([
    ['duplicate', 'string'],
    [7, 'number'],
  ] as const)('rejects duplicate %s identities', (id, _kind) => {
    expect(() =>
      resolveTableRows(
        [
          { id, label: 'First' },
          { id, label: 'Second' },
        ],
        'id',
      ),
    ).toThrowError(/Duplicate row identity at row index 1.*already used at row index 0/);
  });

  it('keeps numeric and string representations as distinct identities', () => {
    const resolved = resolveTableRows(
      [
        { id: 7, label: 'Number' },
        { id: '7', label: 'String' },
      ],
      'id',
    );

    expect(resolved.map(({ trackId }) => trackId)).toEqual(['number:7', 'string:7']);
  });

  it('preserves stable tracking across immutable updates without mutating rows', () => {
    const rows = Object.freeze([
      Object.freeze({ id: 'first', label: 'First' }),
      Object.freeze({ id: 'second', label: 'Second' }),
    ]);
    const updatedRows = rows.map((row) => ({ ...row }));

    expect(resolveTableRows(rows, 'id').map(({ trackId }) => trackId)).toEqual(
      resolveTableRows(updatedRows, 'id').map(({ trackId }) => trackId),
    );
    expect(rows.map(({ label }) => label)).toEqual(['First', 'Second']);
    expect(Object.isFrozen(rows)).toBe(true);
  });
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
