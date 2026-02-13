const DEFAULT_MAX_LENGTH = 256;

/**
 * Sanitizes user-provided text to reduce the risk of unwanted mentions,
 * control characters, and excessively long strings in Discord output.
 */
export const sanitizeUserInput = (
  value: unknown,
  options?: { maxLength?: number }
): string => {
  if (value === undefined || value === null) {
    return '';
  }

  let strValue: string;
  if (typeof value === 'string') {
    strValue = value;
  } else if (typeof value === 'number' || typeof value === 'boolean') {
    strValue = String(value);
  } else if (value instanceof Date) {
    strValue = value.toISOString();
  } else {
    return '';
  }
  const maxLength = options?.maxLength ?? DEFAULT_MAX_LENGTH;

  const isPermittedCharacter = (char: string) => {
    const code = char.charCodeAt(0);
    if (code === 9 || code === 10 || code === 13) {
      return true;
    }
    return code >= 32 && code !== 127;
  };

  let sanitized = Array.from(strValue)
    .filter(isPermittedCharacter)
    .join('')
    .replace(/[\r\n\t]+/g, ' ') // normalise whitespace
    .trim();

  if (!sanitized) {
    return '';
  }

  sanitized = sanitized
    .replace(/@everyone/gi, '@\u200Beveryone')
    .replace(/@here/gi, '@\u200Bhere')
    .replace(/<@!?\d+>/g, (mention) => `@${mention.match(/\d+/)?.[0] ?? ''}`)
    .replace(/<@&\d+>/g, '@role')
    .replace(/<#\d+>/g, '#channel');

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength).trim();
  }

  return sanitized;
};
