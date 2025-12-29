/**
 * Month selection choices for Discord slash command options
 * Maps month names to their zero-indexed values (0 = January, 11 = December)
 */
export const monthOptionChoicesArray = [
  {
    name: 'January',
    value: 0,
  },
  {
    name: 'February',
    value: 1,
  },
  {
    name: 'March',
    value: 2,
  },
  {
    name: 'April',
    value: 3,
  },
  {
    name: 'May',
    value: 4,
  },
  {
    name: 'June',
    value: 5,
  },
  {
    name: 'July',
    value: 6,
  },
  {
    name: 'August',
    value: 7,
  },
  {
    name: 'September',
    value: 8,
  },
  {
    name: 'October',
    value: 9,
  },
  {
    name: 'November',
    value: 10,
  },
  {
    name: 'December',
    value: 11,
  },
];

/**
 * Day choices for autocomplete (1-31)
 */
export const dayChoices = Array.from({ length: 31 }, (_, i) => ({
  name: String(i + 1),
  value: i + 1,
}));

/**
 * Year selection choices for Discord slash command options
 * Provides current year and next 2 years
 */
const currentYear = new Date().getFullYear();
export const yearOptionChoicesArray = Array.from({ length: 2 }, (_, i) => ({
  name: String(currentYear + i),
  value: currentYear + i,
}));
