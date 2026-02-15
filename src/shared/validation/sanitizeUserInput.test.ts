import { describe, it, expect } from 'vitest';
import { sanitizeUserInput } from './sanitizeUserInput.js';

describe('sanitizeUserInput', () => {
  describe('type coercion', () => {
    it('returns empty string for null', () => {
      expect(sanitizeUserInput(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(sanitizeUserInput(undefined)).toBe('');
    });

    it('converts numbers to string', () => {
      expect(sanitizeUserInput(42)).toBe('42');
    });

    it('converts booleans to string', () => {
      expect(sanitizeUserInput(true)).toBe('true');
    });

    it('converts Dates to ISO string', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');
      expect(sanitizeUserInput(date)).toBe('2025-01-01T00:00:00.000Z');
    });

    it('returns empty string for objects', () => {
      expect(sanitizeUserInput({ key: 'value' })).toBe('');
    });

    it('returns empty string for arrays', () => {
      expect(sanitizeUserInput([1, 2, 3])).toBe('');
    });
  });

  describe('control character filtering', () => {
    it('strips null bytes', () => {
      expect(sanitizeUserInput('hello\x00world')).toBe('helloworld');
    });

    it('strips DEL character', () => {
      expect(sanitizeUserInput('hello\x7Fworld')).toBe('helloworld');
    });

    it('normalizes tabs and newlines to spaces', () => {
      expect(sanitizeUserInput('hello\t\nworld')).toBe('hello world');
    });

    it('returns empty string for only control characters', () => {
      expect(sanitizeUserInput('\x00\x01\x02')).toBe('');
    });
  });

  describe('mention stripping', () => {
    it('neutralizes @everyone', () => {
      const result = sanitizeUserInput('@everyone hello');
      expect(result).toContain('\u200B');
      expect(result).not.toBe('@everyone hello');
    });

    it('neutralizes @here', () => {
      const result = sanitizeUserInput('@here hello');
      expect(result).toContain('\u200B');
    });

    it('converts user mentions to plain text', () => {
      expect(sanitizeUserInput('<@123456>')).toBe('@123456');
    });

    it('converts nickname mentions to plain text', () => {
      expect(sanitizeUserInput('<@!123456>')).toBe('@123456');
    });

    it('converts role mentions to @role', () => {
      expect(sanitizeUserInput('<@&999>')).toBe('@role');
    });

    it('converts channel mentions to #channel', () => {
      expect(sanitizeUserInput('<#123>')).toBe('#channel');
    });
  });

  describe('length truncation', () => {
    it('truncates to default max length (256)', () => {
      const long = 'a'.repeat(300);
      expect(sanitizeUserInput(long).length).toBeLessThanOrEqual(256);
    });

    it('truncates to custom max length', () => {
      const result = sanitizeUserInput('hello world', { maxLength: 5 });
      expect(result).toBe('hello');
    });
  });

  describe('whitespace handling', () => {
    it('trims leading and trailing whitespace', () => {
      expect(sanitizeUserInput('  hello  ')).toBe('hello');
    });

    it('passes through normal strings unchanged', () => {
      expect(sanitizeUserInput('Hello World')).toBe('Hello World');
    });
  });
});
