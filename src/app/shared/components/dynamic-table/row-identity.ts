import { TableRowId, TableRowIdentity } from './dynamic-table.types';

export interface ResolvedTableRow<T> {
  readonly row: T;
  readonly rowId: TableRowId;
  readonly trackId: string;
}

/**
 * Resolves and validates row identities before the table body is rendered.
 * Row IDs are a public contract, so invalid or duplicate values fail in every build mode.
 */
export function resolveTableRows<T>(
  rows: readonly T[],
  identity: TableRowIdentity<T>,
): readonly ResolvedTableRow<T>[] {
  const identityIndexes = new Map<string, number>();

  return rows.map((row, rowIndex) => {
    const candidate = resolveCandidate(row, identity);
    assertValidRowId(candidate, rowIndex);

    const identityToken = `${typeof candidate}:${String(candidate)}`;
    const firstRowIndex = identityIndexes.get(identityToken);

    if (firstRowIndex !== undefined) {
      throw new Error(
        `[DynamicTable] Duplicate row identity at row index ${rowIndex}: ${formatRowId(candidate)}. ` +
          `The same ID is already used at row index ${firstRowIndex}. Row IDs must be unique.`,
      );
    }

    identityIndexes.set(identityToken, rowIndex);
    return { row, rowId: candidate, trackId: identityToken };
  });
}

function resolveCandidate<T>(row: T, identity: TableRowIdentity<T>): unknown {
  return typeof identity === 'function'
    ? identity(row)
    : (row as Readonly<Record<string, unknown>>)[identity];
}

function assertValidRowId(candidate: unknown, rowIndex: number): asserts candidate is TableRowId {
  const isValidString = typeof candidate === 'string' && candidate.trim().length > 0;
  const isValidNumber = typeof candidate === 'number' && Number.isFinite(candidate);

  if (!isValidString && !isValidNumber) {
    throw new Error(
      `[DynamicTable] Invalid row identity at row index ${rowIndex}: ${formatRowId(candidate)}. ` +
        'Expected a non-empty string or a finite number.',
    );
  }
}

function formatRowId(candidate: unknown): string {
  if (typeof candidate === 'string') {
    return JSON.stringify(candidate);
  }

  if (typeof candidate === 'number') {
    return String(candidate);
  }

  if (candidate === undefined) {
    return 'undefined';
  }

  try {
    return JSON.stringify(candidate) ?? String(candidate);
  } catch {
    return String(candidate);
  }
}
