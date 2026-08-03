import { formatDate, registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

import { TableDateFormat } from '../dynamic-table.types';
import { formatTableDate } from './table-date-format';

registerLocaleData(localeAr);

describe('formatTableDate', () => {
  const instant = new Date('2026-07-31T15:30:00.000Z');

  it('formats Date, ISO string, and timestamp values without mutating the source Date', () => {
    const format: TableDateFormat = {
      kind: 'intl',
      options: { year: 'numeric', month: 'short', day: '2-digit' },
      timeZone: 'UTC',
    };
    const originalTime = instant.getTime();
    const expected = new Intl.DateTimeFormat('en', {
      ...format.options,
      timeZone: 'UTC',
    }).format(instant);

    expect(formatTableDate(instant, 'en', format)).toBe(expected);
    expect(formatTableDate(instant.toISOString(), 'en', format)).toBe(expected);
    expect(formatTableDate(instant.getTime(), 'en', format)).toBe(expected);
    expect(instant.getTime()).toBe(originalTime);
  });

  it('formats Intl dates with Arabic locale data and explicit time zones', () => {
    const format: TableDateFormat = {
      kind: 'intl',
      options: { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/London' },
      timeZone: 'UTC',
    };

    expect(formatTableDate(instant, 'ar', format)).toBe(
      new Intl.DateTimeFormat('ar', {
        ...format.options,
        timeZone: 'UTC',
      }).format(instant),
    );
  });

  it('supports Angular date patterns in English and Arabic', () => {
    const format: TableDateFormat = {
      kind: 'pattern',
      pattern: 'dd MMM y, HH:mm',
      timeZone: '+0000',
    };

    expect(formatTableDate(instant, 'en', format)).toBe(
      formatDate(instant, format.pattern, 'en', format.timeZone),
    );
    expect(formatTableDate(instant, 'ar', format)).toBe(
      formatDate(instant, format.pattern, 'ar', format.timeZone),
    );
  });

  it.each([null, undefined, '', 'not-a-date', Number.NaN, Infinity, false, {}])(
    'returns null for unsupported value %s',
    (value) => {
      expect(
        formatTableDate(value, 'en', {
          kind: 'intl',
          options: { year: 'numeric' },
        }),
      ).toBeNull();
    },
  );

  it('uses English when an empty locale is supplied', () => {
    const format: TableDateFormat = {
      kind: 'intl',
      options: { year: 'numeric', month: 'short' },
      timeZone: 'UTC',
    };

    expect(formatTableDate(instant, '', format)).toBe(
      new Intl.DateTimeFormat('en', { ...format.options, timeZone: 'UTC' }).format(instant),
    );
  });
});
