/**
 * Utilities for parsing and generating session names with continuation numbering.
 * Session continuations use incrementing integers in square brackets (e.g., "Session Name [2]")
 */

/**
 * Extract the continuation number from a session name.
 * @param sessionName - The session name to parse
 * @returns The continuation number, or 0 if no number is found
 * @example
 * extractSessionNumber("Dragon's Lair [3]") // returns 3
 * extractSessionNumber("Dragon's Lair") // returns 0
 */
export function extractSessionNumber(sessionName: string): number {
  const bracketPattern = /\s+\[(\d+)\]$/;
  const match = sessionName.match(bracketPattern);

  if (!match) {
    return 0;
  }

  return parseInt(match[1], 10);
}

/**
 * Get the base session name without the continuation number.
 * @param sessionName - The session name to parse
 * @returns The base name without the bracketed number
 * @example
 * getBaseSessionName("Dragon's Lair [3]") // returns "Dragon's Lair"
 * getBaseSessionName("Dragon's Lair") // returns "Dragon's Lair"
 */
export function getBaseSessionName(sessionName: string): string {
  const bracketPattern = /\s+\[\d+\]$/;
  return sessionName.replace(bracketPattern, '').trim();
}

/**
 * Generate the next session name by incrementing the continuation number.
 * If no number exists, adds [2] (the original session is implicitly [1]).
 * @param sessionName - The current session name
 * @returns The next session name with incremented number
 * @example
 * getNextSessionName("Dragon's Lair") // returns "Dragon's Lair [2]"
 * getNextSessionName("Dragon's Lair [2]") // returns "Dragon's Lair [3]"
 */
export function getNextSessionName(sessionName: string): string {
  const currentNumber = extractSessionNumber(sessionName);
  const baseName = getBaseSessionName(sessionName);

  if (currentNumber === 0) {
    return `${baseName} [2]`;
  }

  return `${baseName} [${currentNumber + 1}]`;
}
