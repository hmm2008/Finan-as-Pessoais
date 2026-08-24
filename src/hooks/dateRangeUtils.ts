/**
 * Date range helpers for custom ranges, weeks, months and years.
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Gets the start and end of a given month (YYYY-MM).
 */
export function getMonthRange(monthStr: string): DateRange {
  const [year, month] = monthStr.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

/**
 * Gets the start and end of the current week.
 */
export function getWeekRange(): DateRange {
  const today = new Date();
  const day = today.getDay();
  // Set start of week to Monday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const startDate = new Date(today.setDate(diff));
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

/**
 * Check if a date falls within a given month (YYYY-MM).
 */
export function isDateInMonth(date: Date | string | number, monthStr: string): boolean {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}` === monthStr;
}
