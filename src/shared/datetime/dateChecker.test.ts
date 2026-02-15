import { describe, it, expect } from 'vitest';
import {
  parseTime,
  isValidMonth,
  isValidDay,
  isLeapYear,
  isLeapYearDay,
} from './dateChecker.js';

describe('parseTime', () => {
  describe('12-hour format', () => {
    it('parses "7:00 PM" as 19:00', () => {
      expect(parseTime('7:00 PM')).toEqual({ hour: 19, mins: 0 });
    });

    it('parses "7pm" without minutes', () => {
      expect(parseTime('7pm')).toEqual({ hour: 19, mins: 0 });
    });

    it('parses "7PM" case-insensitively', () => {
      expect(parseTime('7PM')).toEqual({ hour: 19, mins: 0 });
    });

    it('parses "12:00 AM" as midnight (0:00)', () => {
      expect(parseTime('12:00 AM')).toEqual({ hour: 0, mins: 0 });
    });

    it('parses "12:00 PM" as noon (12:00)', () => {
      expect(parseTime('12:00 PM')).toEqual({ hour: 12, mins: 0 });
    });

    it('parses "11:30 PM" correctly', () => {
      expect(parseTime('11:30 PM')).toEqual({ hour: 23, mins: 30 });
    });

    it('parses "12:30 AM" correctly', () => {
      expect(parseTime('12:30 AM')).toEqual({ hour: 0, mins: 30 });
    });

    it('returns undefined for hour 0 in 12-hour format', () => {
      expect(parseTime('0:00 AM')).toBeUndefined();
    });

    it('returns undefined for hour 13 in 12-hour format', () => {
      expect(parseTime('13:00 PM')).toBeUndefined();
    });
  });

  describe('24-hour format', () => {
    it('parses "19:00" correctly', () => {
      expect(parseTime('19:00')).toEqual({ hour: 19, mins: 0 });
    });

    it('parses "0:00" as midnight', () => {
      expect(parseTime('0:00')).toEqual({ hour: 0, mins: 0 });
    });

    it('parses "23:59" correctly', () => {
      expect(parseTime('23:59')).toEqual({ hour: 23, mins: 59 });
    });

    it('returns undefined for hour 24', () => {
      expect(parseTime('24:00')).toBeUndefined();
    });

    it('returns undefined for hour 25', () => {
      expect(parseTime('25:00')).toBeUndefined();
    });

    it('returns undefined for minutes 60', () => {
      expect(parseTime('12:60')).toBeUndefined();
    });
  });

  describe('invalid formats', () => {
    it('returns undefined for empty string', () => {
      expect(parseTime('')).toBeUndefined();
    });

    it('returns undefined for plain text', () => {
      expect(parseTime('noon')).toBeUndefined();
    });

    it('returns undefined for just a number', () => {
      expect(parseTime('7')).toBeUndefined();
    });
  });
});

describe('isValidMonth', () => {
  it('accepts 0 (January)', () => {
    expect(isValidMonth(0)).toBe(true);
  });

  it('accepts 11 (December)', () => {
    expect(isValidMonth(11)).toBe(true);
  });

  it('rejects -1', () => {
    expect(isValidMonth(-1)).toBe(false);
  });

  it('rejects 12', () => {
    expect(isValidMonth(12)).toBe(false);
  });
});

describe('isValidDay', () => {
  it('accepts day 1 for any month', () => {
    expect(isValidDay(0, 1)).toBe(true);
  });

  it('accepts day 31 for January (month 0)', () => {
    expect(isValidDay(0, 31)).toBe(true);
  });

  it('rejects day 32 for January', () => {
    expect(isValidDay(0, 32)).toBe(false);
  });

  it('accepts day 28 for February (month 1)', () => {
    expect(isValidDay(1, 28)).toBe(true);
  });

  it('rejects day 29 for February (non-leap handled separately)', () => {
    expect(isValidDay(1, 29)).toBe(false);
  });

  it('rejects day 0', () => {
    expect(isValidDay(0, 0)).toBe(false);
  });

  it('accepts day 30 for April (month 3)', () => {
    expect(isValidDay(3, 30)).toBe(true);
  });

  it('rejects day 31 for April', () => {
    expect(isValidDay(3, 31)).toBe(false);
  });
});

describe('isLeapYear', () => {
  it('2024 is a leap year', () => {
    expect(isLeapYear(2024)).toBe(true);
  });

  it('2023 is not a leap year', () => {
    expect(isLeapYear(2023)).toBe(false);
  });

  it('1900 is not a leap year (divisible by 100 but not 400)', () => {
    expect(isLeapYear(1900)).toBe(false);
  });

  it('2000 is a leap year (divisible by 400)', () => {
    expect(isLeapYear(2000)).toBe(true);
  });
});

describe('isLeapYearDay', () => {
  it('Feb 29 on a leap year is valid', () => {
    expect(isLeapYearDay(1, 2024, 29)).toBe(true);
  });

  it('Feb 29 on a non-leap year is invalid', () => {
    expect(isLeapYearDay(1, 2023, 29)).toBe(false);
  });

  it('Feb 28 on a leap year is valid', () => {
    expect(isLeapYearDay(1, 2024, 28)).toBe(true);
  });

  it('March 29 is not a leap year day', () => {
    expect(isLeapYearDay(2, 2024, 29)).toBe(false);
  });

  it('Feb 30 on a leap year is invalid', () => {
    expect(isLeapYearDay(1, 2024, 30)).toBe(false);
  });
});
