export type PaginationRangeItem = PaginationPageItem | PaginationEllipsisItem;

export interface PaginationPageItem {
  readonly kind: 'page';
  readonly page: number;
}

export interface PaginationEllipsisItem {
  readonly kind: 'ellipsis';
  readonly position: 'start' | 'end';
}

export function buildPaginationRange(
  totalPages: number,
  currentPage: number,
  siblingCount = 1,
  boundaryCount = 3,
): readonly PaginationRangeItem[] {
  const normalizedTotalPages = toNonNegativeInteger(totalPages);
  if (normalizedTotalPages === 0) {
    return [];
  }

  const normalizedCurrentPage = clamp(toInteger(currentPage, 1), 1, normalizedTotalPages);
  const normalizedSiblingCount = toNonNegativeInteger(siblingCount);
  const normalizedBoundaryCount = toNonNegativeInteger(boundaryCount);
  const selectedPages = new Set<number>();

  addRange(selectedPages, 1, Math.min(normalizedBoundaryCount, normalizedTotalPages));
  addRange(
    selectedPages,
    Math.max(normalizedTotalPages - normalizedBoundaryCount + 1, 1),
    normalizedTotalPages,
  );
  addRange(
    selectedPages,
    Math.max(normalizedCurrentPage - normalizedSiblingCount, 1),
    Math.min(normalizedCurrentPage + normalizedSiblingCount, normalizedTotalPages),
  );

  const pages = [...selectedPages].sort((left, right) => left - right);
  const items: PaginationRangeItem[] = [];
  let previousPage = 0;

  for (const page of pages) {
    appendGap(items, previousPage, page, page <= normalizedCurrentPage ? 'start' : 'end');
    items.push({ kind: 'page', page });
    previousPage = page;
  }

  appendGap(items, previousPage, normalizedTotalPages + 1, 'end');
  return items;
}

function addRange(target: Set<number>, start: number, end: number): void {
  for (let value = start; value <= end; value += 1) {
    target.add(value);
  }
}

function appendGap(
  items: PaginationRangeItem[],
  previousPage: number,
  nextPage: number,
  position: PaginationEllipsisItem['position'],
): void {
  const omittedPageCount = nextPage - previousPage - 1;

  if (omittedPageCount === 1) {
    items.push({ kind: 'page', page: previousPage + 1 });
  } else if (omittedPageCount > 1) {
    items.push({ kind: 'ellipsis', position });
  }
}

function toNonNegativeInteger(value: number): number {
  return Math.max(0, toInteger(value, 0));
}

function toInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.floor(value) : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
