import { BotCommandOptionInfo } from './botDialogStrings';

const monthMaxDayCounts = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function DateChecker(interaction: any) {
  const month = interaction.options.getInteger(BotCommandOptionInfo.CreateSession_MonthName, true);
  const day = interaction.options.getInteger(BotCommandOptionInfo.CreateSession_DayName, true);
  const year = interaction.options.getInteger(BotCommandOptionInfo.CreateSession_YearName, true);
  const time = interaction.options.getString(BotCommandOptionInfo.CreateSession_TimeName, true);

  const timeArray = time.split(':');
  const hour = parseInt(timeArray[0]);
  const mins = parseInt(timeArray[1]);

  if (
    !isValidMonth(month) ||
    (!isValidDay(month, day) && !isLeapYearDay(month, year, day))
  )
    return undefined;

  const sessionDate = new Date(
    new Date(year, month, day, hour, mins).toUTCString()
  );
  return isDateAfterCurrentDate(sessionDate) ? sessionDate : undefined;
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
