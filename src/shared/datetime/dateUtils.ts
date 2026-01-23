import { format, sub, add, isAfter } from 'date-fns';
import { TZDate } from '@date-fns/tz';

/**
 * Get timezone abbreviation for a date in a specific timezone
 * Example: "PDT", "EST", "MST"
 */
function getTimezoneAbbreviation(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  });

  const parts = formatter.formatToParts(date);
  const timeZonePart = parts.find(part => part.type === 'timeZoneName');
  return timeZonePart?.value || timezone;
}

/**
 * Format a date in a specific timezone with a given format
 */
export function formatDateInTimezone(
  date: Date,
  timezone: string,
  formatStr: string = 'PPPppp'
): string {
  // Convert to TZDate in the target timezone, then format
  const tzDate = TZDate.tz(timezone, date);
  return format(tzDate, formatStr);
}

/**
 * Format a date for display with timezone abbreviation
 * Example: "Mon, Oct 5, 2025, 7:00 PM PDT"
 */
export function formatSessionDate(date: Date, timezone: string = 'America/Los_Angeles'): string {
  const tzDate = TZDate.tz(timezone, date);
  const formattedDate = format(tzDate, "EEE, MMM d, yyyy, h:mm a");
  const tzAbbr = getTimezoneAbbreviation(date, timezone);
  return `${formattedDate} ${tzAbbr}`;
}

/**
 * Format a date for display with long format
 * Example: "Monday, October 5, 2025, 07:00 PM PDT"
 */
export function formatSessionDateLong(date: Date, timezone: string = 'America/Los_Angeles'): string {
  const tzDate = TZDate.tz(timezone, date);
  const formattedDate = format(tzDate, "EEEE, MMMM d, yyyy, hh:mm a");
  const tzAbbr = getTimezoneAbbreviation(date, timezone);
  return `${formattedDate} ${tzAbbr}`;
}

/**
 * Get a date that is X hours before the given date
 */
export function getHoursBefore(date: Date, hours: number): Date {
  return sub(date, { hours });
}

/**
 * Get a date that is X minutes before the given date
 */
export function getMinutesBefore(date: Date, minutes: number): Date {
  return sub(date, { minutes });
}

/**
 * Get a date that is X hours after the given date
 */
export function getHoursAfter(date: Date, hours: number): Date {
  return add(date, { hours });
}

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date): boolean {
  return isAfter(date, new Date());
}

/**
 * Check if first date is after second date
 */
export function isDateAfter(date1: Date, date2: Date): boolean {
  return isAfter(date1, date2);
}

/**
 * Compare two dates for equality (ignoring milliseconds)
 */
export function areDatesEqual(date1: Date, date2: Date): boolean {
  return date1.getTime() === date2.getTime();
}
