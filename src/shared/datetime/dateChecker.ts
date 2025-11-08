import { ExtendedInteraction } from '@shared/types/discord.js';
import { BotCommandOptionInfo } from '../messages/botDialogStrings.js';
import { TZDate } from '@date-fns/tz';
import { isFutureDate } from './dateUtils.js';

const monthMaxDayCounts = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];


export default function DateChecker(interaction: ExtendedInteraction, timezone?: string) {
  const month = interaction.options.getInteger(BotCommandOptionInfo.Session_Month_Name, true);
  const day = interaction.options.getInteger(BotCommandOptionInfo.Session_Day_Name, true);
  const year = interaction.options.getInteger(BotCommandOptionInfo.Session_Year_Name, true);
  const time = interaction.options.getString(BotCommandOptionInfo.Session_DateTime_Name, true);

  const parsedTime = parseTime(time);
  if (!parsedTime) {
    return undefined;
  }

  const { hour, mins } = parsedTime;

  if (
    !isValidMonth(month) ||
    (!isValidDay(month, day) && !isLeapYearDay(month, year, day))
  )
    return undefined;

  // Create date in the user's timezone, then convert to UTC
  let sessionDate: Date;

  if (timezone) {
    // Create a TZDate in the user's timezone
    // TZDate constructor: new TZDate(year, month (0-indexed), day, hours, minutes, seconds, ms, timezone)
    sessionDate = new TZDate(year, month, day, hour, mins, 0, timezone);
  } else {
    // Fallback to UTC if no timezone provided
    sessionDate = new Date(Date.UTC(year, month, day, hour, mins));
  }

  return isDateAfterCurrentDate(sessionDate) ? sessionDate : undefined;
}

/**
 * Parse time in either 12-hour (7:00 PM, 7:00PM, 7pm) or 24-hour (19:00, 7:00) format
 * Returns { hour, mins } in 24-hour format, or undefined if invalid
 */
function parseTime(timeStr: string): { hour: number; mins: number } | undefined {
  const normalizedTime = timeStr.trim().toUpperCase();

  // Check for 12-hour format (AM/PM)
  const twelveHourMatch = normalizedTime.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);

  if (twelveHourMatch) {
    let hour = parseInt(twelveHourMatch[1]);
    const mins = twelveHourMatch[2] ? parseInt(twelveHourMatch[2]) : 0;
    const meridiem = twelveHourMatch[3];

    // Validate hour and minutes
    if (hour < 1 || hour > 12 || mins < 0 || mins > 59) {
      return undefined;
    }

    // Convert to 24-hour format
    if (meridiem === 'PM' && hour !== 12) {
      hour += 12;
    } else if (meridiem === 'AM' && hour === 12) {
      hour = 0;
    }

    return { hour, mins };
  }

  // Check for 24-hour format (HH:MM or H:MM)
  const twentyFourHourMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    const hour = parseInt(twentyFourHourMatch[1]);
    const mins = parseInt(twentyFourHourMatch[2]);

    // Validate hour and minutes
    if (hour < 0 || hour > 23 || mins < 0 || mins > 59) {
      return undefined;
    }

    return { hour, mins };
  }

  return undefined;
}

function isValidMonth(month: number) {
  return month < 13;
}

function isValidDay(month: number, day: number) {
  return day > 0 && day <= monthMaxDayCounts[month];
}

function isLeapYearDay(month: number, year: number, day: number) {
  return month === 1 && year % 4 === 0 && !(day > 29);
}

function isDateAfterCurrentDate(date: Date) {
  return isFutureDate(date);
}
