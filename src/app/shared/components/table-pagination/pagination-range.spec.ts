import { buildPaginationRange, PaginationRangeItem } from './pagination-range';

function serialize(items: readonly PaginationRangeItem[]): readonly (number | string)[] {
  return items.map((item) => (item.kind === 'page' ? item.page : `${item.position}-ellipsis`));
}

describe('buildPaginationRange', () => {
  it('returns no items when there are no pages', () => {
    expect(buildPaginationRange(0, 1)).toEqual([]);
    expect(buildPaginationRange(-5, 1)).toEqual([]);
  });

  it('returns every page when the range has no gaps', () => {
    expect(serialize(buildPaginationRange(5, 3))).toEqual([1, 2, 3, 4, 5]);
  });

  it('creates a trailing ellipsis near the beginning', () => {
    expect(serialize(buildPaginationRange(10, 1))).toEqual([1, 2, 3, 'end-ellipsis', 8, 9, 10]);
  });

  it('creates leading and trailing ellipses around a middle page', () => {
    expect(serialize(buildPaginationRange(20, 10))).toEqual([
      1,
      2,
      3,
      'start-ellipsis',
      9,
      10,
      11,
      'end-ellipsis',
      18,
      19,
      20,
    ]);
  });

  it('creates a leading ellipsis near the end', () => {
    expect(serialize(buildPaginationRange(10, 10))).toEqual([1, 2, 3, 'start-ellipsis', 8, 9, 10]);
  });

  it('honors custom sibling and boundary counts', () => {
    expect(serialize(buildPaginationRange(10, 1, 2, 2))).toEqual([1, 2, 3, 'end-ellipsis', 9, 10]);
  });

  it('normalizes invalid current pages and negative range counts', () => {
    expect(serialize(buildPaginationRange(10, 20, -1, -1))).toEqual(['start-ellipsis', 10]);
    expect(serialize(buildPaginationRange(10, Number.NaN))).toEqual([
      1,
      2,
      3,
      'end-ellipsis',
      8,
      9,
      10,
    ]);
  });

  it('keeps pages unique and ascending across a rich range', () => {
    const pages = buildPaginationRange(25, 13)
      .filter((item) => item.kind === 'page')
      .map((item) => item.page);

    expect(new Set(pages).size).toBe(pages.length);
    expect(pages).toEqual([...pages].sort((left, right) => left - right));
  });
});
