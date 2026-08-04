export function formatTableNumber(
  value: unknown,
  locale: string,
  options: Readonly<Intl.NumberFormatOptions> = {},
): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.NumberFormat(locale || 'en', options).format(value);
}
