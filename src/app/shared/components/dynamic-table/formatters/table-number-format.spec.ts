import { formatTableNumber } from './table-number-format';

describe('formatTableNumber', () => {
  it('formats finite numbers, including zero, with locale-aware digits', () => {
    expect(formatTableNumber(0, 'en')).toBe(new Intl.NumberFormat('en').format(0));
    expect(formatTableNumber(1234.5, 'ar')).toBe(new Intl.NumberFormat('ar').format(1234.5));
    expect(formatTableNumber(-42.25, 'en')).toBe(new Intl.NumberFormat('en').format(-42.25));
  });

  it('applies immutable Intl number options', () => {
    const options = Object.freeze({
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    } as const satisfies Intl.NumberFormatOptions);

    expect(formatTableNumber(1250, 'en', options)).toBe(
      new Intl.NumberFormat('en', options).format(1250),
    );
    expect(options).toEqual({
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
    expect(Object.isFrozen(options)).toBe(true);
  });

  it.each([null, undefined, Number.NaN, Infinity, -Infinity, '12', false])(
    'returns null for unsupported value %s',
    (value) => {
      expect(formatTableNumber(value, 'en')).toBeNull();
    },
  );

  it('uses English when an empty locale is supplied', () => {
    expect(formatTableNumber(1234.5, '')).toBe(new Intl.NumberFormat('en').format(1234.5));
  });
});
