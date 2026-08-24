/**
 * Format utilities for currency, dates and numbers.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

export function formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pt-PT', options || {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(d);
}

export function formatNumber(value: number, minimumFractionDigits = 0, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}
