import { ExtendedInteraction } from '../models/Command';
import { BotCommandOptionInfo } from './botDialogStrings';

const monthMaxDayCounts = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function DateChecker(interaction: ExtendedInteraction) {
  const month = interaction.options.getInteger(BotCommandOptionInfo.CreateSession_MonthName, true);
  const day = interaction.options.getInteger(BotCommandOptionInfo.CreateSession_DayName, true);
  const year = interaction.options.getInteger(BotCommandOptionInfo.CreateSession_YearName, true);
  const time = interaction.options.getString(BotCommandOptionInfo.CreateSession_TimeName, true);

  // Parse 12-hour format time (e.g., "7:30 PM", "11:00 AM")
  const parsedTime = parse12HourTime(time);
  if (!parsedTime) {
    return undefined;
  }

  const { hour, mins } = parsedTime;

  if (
    !isValidMonth(month) ||
    (!isValidDay(month, day) && !isLeapYearDay(month, year, day))
  )
    return undefined;

  // Create date string in Pacific timezone and convert to UTC
  // Create a date object assuming the input time is in Pacific timezone
  const localDate = new Date(year, month - 1, day, hour, mins); // month is 0-indexed

  // Get the timezone offset for Pacific time
  const pacificDate = new Date(localDate.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const localTime = new Date(localDate.toLocaleString('en-US'));
  const timezoneOffset = localTime.getTime() - pacificDate.getTime();

  // Apply the timezone offset to get UTC time
  const sessionDate = new Date(localDate.getTime() + timezoneOffset);

  return isDateAfterCurrentDate(sessionDate) ? sessionDate : undefined;
}

function parse12HourTime(timeString: string): { hour: number; mins: number } | null {
  // Remove extra spaces and convert to lowercase
  const cleanTime = timeString.trim().toLowerCase();

  // Match patterns like "7:30 pm", "7:30pm", "11:00 am", "11am"
  const timeRegex = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/;
  const match = cleanTime.match(timeRegex);

  if (!match) {
    return null;
  }

  let hour = parseInt(match[1]);
  const mins = parseInt(match[2] || '0');
  const period = match[3];

  // Validate hour and minutes
  if (hour < 1 || hour > 12 || mins < 0 || mins > 59) {
    return null;
  }

  // Convert to 24-hour format
  if (period === 'am') {
    if (hour === 12) hour = 0; // 12 AM = 0:00
  } else { // pm
    if (hour !== 12) hour += 12; // 1-11 PM = 13-23, 12 PM = 12
  }

  return { hour, mins };
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
  return new Date(date).valueOf() > new Date().valueOf();
}
