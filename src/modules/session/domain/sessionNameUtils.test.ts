import { describe, it, expect } from 'vitest';
import {
  extractSessionNumber,
  getBaseSessionName,
  getNextSessionName,
} from './sessionNameUtils.js';

describe('extractSessionNumber', () => {
  it('returns 0 for names without a bracket number', () => {
    expect(extractSessionNumber("Dragon's Lair")).toBe(0);
  });

  it('extracts the number from a bracketed suffix', () => {
    expect(extractSessionNumber("Dragon's Lair [3]")).toBe(3);
  });

  it('extracts large continuation numbers', () => {
    expect(extractSessionNumber('Campaign [42]')).toBe(42);
  });

  it('returns 0 when brackets are not at the end', () => {
    expect(extractSessionNumber('[3] Dragon')).toBe(0);
  });

  it('returns 0 for brackets without a space before them', () => {
    expect(extractSessionNumber("Dragon's Lair[3]")).toBe(0);
  });
});

describe('getBaseSessionName', () => {
  it('returns the same name when there is no bracket', () => {
    expect(getBaseSessionName("Dragon's Lair")).toBe("Dragon's Lair");
  });

  it('strips the bracketed number', () => {
    expect(getBaseSessionName("Dragon's Lair [3]")).toBe("Dragon's Lair");
  });

  it('trims whitespace from the result', () => {
    expect(getBaseSessionName('  Campaign [2]')).toBe('Campaign');
  });
});

describe('getNextSessionName', () => {
  it('appends [2] to a name without a number', () => {
    expect(getNextSessionName("Dragon's Lair")).toBe("Dragon's Lair [2]");
  });

  it('increments an existing number', () => {
    expect(getNextSessionName("Dragon's Lair [2]")).toBe(
      "Dragon's Lair [3]"
    );
  });

  it('increments from a high number', () => {
    expect(getNextSessionName('Campaign [99]')).toBe('Campaign [100]');
  });
});
