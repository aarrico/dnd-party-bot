import { BotCommandOptionInfo } from "./botDialogStrings";

const monthMaxDayCounts = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export default function DateChecker(interaction: any) {
  const month = interaction.options.get(
    BotCommandOptionInfo.CreateSession_MonthName
  ).value;
  const day = interaction.options.get(
    BotCommandOptionInfo.CreateSession_DayName
  ).value;
  const year = interaction.options.get(
    BotCommandOptionInfo.CreateSession_YearName
  ).value;
  const time = interaction.options.get(
    BotCommandOptionInfo.CreateSession_TimeName
  ).value as string;

  const timeArray = (time as string).split(":");
  const hour = parseInt(timeArray[0]);
  const mins = parseInt(timeArray[1]);

  if (month && day && year && hour && mins) {
    if (
      !isValidMonth(month) ||
      (!isValidDay(month, day) && !isLeapYearDay(month, year, day))
    )
      return undefined;

    const sessionDate = new Date(year, month, day, hour, mins);

    return isDateAfterCurrentDate(sessionDate) ? sessionDate : undefined;
  }
  return undefined;
}

function isValidMonth(month: number) {
  return month < 13;
}

function isValidDay(month: number, day: number) {
  return day > 0 && day <= monthMaxDayCounts[month - 1];
}

function isLeapYearDay(month: number, year: number, day: number) {
  return month === 2 && year % 4 === 0 && !(day > 29);
}

function isDateAfterCurrentDate(date: Date) {
  return new Date(date).valueOf() > new Date().valueOf();
}
