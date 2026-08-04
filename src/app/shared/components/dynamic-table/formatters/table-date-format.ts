import { formatDate } from '@angular/common';

import { TableDateFormat } from '../dynamic-table.types';

export function formatTableDate(
  value: unknown,
  locale: string,
  format: TableDateFormat,
): string | null {
  const date = toValidDate(value);
  if (!date) {
    return null;
  }

  const resolvedLocale = locale || 'en';

  if (format.kind === 'pattern') {
    return formatDate(date, format.pattern, resolvedLocale, format.timeZone);
  }

  const options = format.timeZone
    ? { ...format.options, timeZone: format.timeZone }
    : format.options;
  return new Intl.DateTimeFormat(resolvedLocale, options).format(date);
}

function toValidDate(value: unknown): Date | null {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    return null;
  }

  if (typeof value === 'string' && value.trim().length === 0) {
    return null;
  }

  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
