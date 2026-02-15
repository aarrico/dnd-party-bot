import { describe, it, expect } from 'vitest';
import {
  getHoursBefore,
  getMinutesBefore,
  getHoursAfter,
  areDatesEqual,
  isDateAfter,
} from './dateUtils.js';

describe('getHoursBefore', () => {
  it('subtracts hours from a date', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    const result = getHoursBefore(date, 3);
    expect(result).toEqual(new Date('2025-06-15T09:00:00Z'));
  });

  it('crosses day boundaries', () => {
    const date = new Date('2025-06-15T02:00:00Z');
    const result = getHoursBefore(date, 5);
    expect(result).toEqual(new Date('2025-06-14T21:00:00Z'));
  });
});

describe('getMinutesBefore', () => {
  it('subtracts minutes from a date', () => {
    const date = new Date('2025-06-15T12:30:00Z');
    const result = getMinutesBefore(date, 15);
    expect(result).toEqual(new Date('2025-06-15T12:15:00Z'));
  });

  it('crosses hour boundaries', () => {
    const date = new Date('2025-06-15T12:05:00Z');
    const result = getMinutesBefore(date, 10);
    expect(result).toEqual(new Date('2025-06-15T11:55:00Z'));
  });
});

describe('getHoursAfter', () => {
  it('adds hours to a date', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    const result = getHoursAfter(date, 5);
    expect(result).toEqual(new Date('2025-06-15T17:00:00Z'));
  });

  it('crosses day boundaries', () => {
    const date = new Date('2025-06-15T22:00:00Z');
    const result = getHoursAfter(date, 5);
    expect(result).toEqual(new Date('2025-06-16T03:00:00Z'));
  });
});

describe('areDatesEqual', () => {
  it('returns true for identical timestamps', () => {
    const a = new Date('2025-06-15T12:00:00Z');
    const b = new Date('2025-06-15T12:00:00Z');
    expect(areDatesEqual(a, b)).toBe(true);
  });

  it('returns false for different timestamps', () => {
    const a = new Date('2025-06-15T12:00:00Z');
    const b = new Date('2025-06-15T12:00:01Z');
    expect(areDatesEqual(a, b)).toBe(false);
  });
});

describe('isDateAfter', () => {
  it('returns true when first date is after second', () => {
    const later = new Date('2025-06-16T00:00:00Z');
    const earlier = new Date('2025-06-15T00:00:00Z');
    expect(isDateAfter(later, earlier)).toBe(true);
  });

  it('returns false when first date is before second', () => {
    const earlier = new Date('2025-06-15T00:00:00Z');
    const later = new Date('2025-06-16T00:00:00Z');
    expect(isDateAfter(earlier, later)).toBe(false);
  });

  it('returns false for equal dates', () => {
    const date = new Date('2025-06-15T00:00:00Z');
    expect(isDateAfter(date, new Date(date.getTime()))).toBe(false);
  });
});
