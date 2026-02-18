/**
 * Safely format a number with `.toFixed()`.
 * Returns `fallback` when value is null, undefined, or NaN.
 */
export const toFixedSafe = (
  value: number | null | undefined,
  digits: number,
  fallback = '—'
): string => {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value.toFixed(digits);
};
