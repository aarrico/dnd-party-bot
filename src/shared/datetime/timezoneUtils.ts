import { AutocompleteInteraction } from 'discord.js';
import { getUserTimezone } from '#modules/user/repository/user.repository.js';

export interface TimezoneOption {
  name: string;
  value: string;
}

/**
 * Comprehensive list of world timezones with friendly display names mapped to IANA timezone identifiers
 */
export const TIMEZONES: TimezoneOption[] = [
  // Americas
  { name: 'US Eastern', value: 'America/New_York' },
  { name: 'US Central', value: 'America/Chicago' },
  { name: 'US Mountain', value: 'America/Denver' },
  { name: 'US Pacific', value: 'America/Los_Angeles' },
  { name: 'US Alaska', value: 'America/Anchorage' },
  { name: 'US Hawaii', value: 'Pacific/Honolulu' },
  { name: 'US Arizona', value: 'America/Phoenix' },
  { name: 'Canada Atlantic', value: 'America/Halifax' },
  { name: 'Canada Newfoundland', value: 'America/St_Johns' },
  { name: 'Mexico City', value: 'America/Mexico_City' },
  { name: 'Sao Paulo', value: 'America/Sao_Paulo' },
  { name: 'Buenos Aires', value: 'America/Argentina/Buenos_Aires' },

  // Europe
  { name: 'London (GMT/BST)', value: 'Europe/London' },
  { name: 'Dublin', value: 'Europe/Dublin' },
  { name: 'Lisbon', value: 'Europe/Lisbon' },
  { name: 'Paris (CET)', value: 'Europe/Paris' },
  { name: 'Berlin', value: 'Europe/Berlin' },
  { name: 'Amsterdam', value: 'Europe/Amsterdam' },
  { name: 'Brussels', value: 'Europe/Brussels' },
  { name: 'Madrid', value: 'Europe/Madrid' },
  { name: 'Rome', value: 'Europe/Rome' },
  { name: 'Vienna', value: 'Europe/Vienna' },
  { name: 'Warsaw', value: 'Europe/Warsaw' },
  { name: 'Prague', value: 'Europe/Prague' },
  { name: 'Stockholm', value: 'Europe/Stockholm' },
  { name: 'Copenhagen', value: 'Europe/Copenhagen' },
  { name: 'Oslo', value: 'Europe/Oslo' },
  { name: 'Athens (EET)', value: 'Europe/Athens' },
  { name: 'Helsinki', value: 'Europe/Helsinki' },
  { name: 'Bucharest', value: 'Europe/Bucharest' },
  { name: 'Sofia', value: 'Europe/Sofia' },
  { name: 'Istanbul', value: 'Europe/Istanbul' },
  { name: 'Kiev', value: 'Europe/Kiev' },
  { name: 'Moscow', value: 'Europe/Moscow' },
  { name: 'Zurich', value: 'Europe/Zurich' },

  // Asia
  { name: 'Dubai', value: 'Asia/Dubai' },
  { name: 'Tehran', value: 'Asia/Tehran' },
  { name: 'Karachi', value: 'Asia/Karachi' },
  { name: 'Mumbai (IST)', value: 'Asia/Kolkata' },
  { name: 'Dhaka', value: 'Asia/Dhaka' },
  { name: 'Bangkok', value: 'Asia/Bangkok' },
  { name: 'Singapore', value: 'Asia/Singapore' },
  { name: 'Hong Kong', value: 'Asia/Hong_Kong' },
  { name: 'Shanghai (CST)', value: 'Asia/Shanghai' },
  { name: 'Beijing', value: 'Asia/Shanghai' },
  { name: 'Taipei', value: 'Asia/Taipei' },
  { name: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { name: 'Seoul', value: 'Asia/Seoul' },
  { name: 'Jakarta', value: 'Asia/Jakarta' },
  { name: 'Manila', value: 'Asia/Manila' },
  { name: 'Jerusalem', value: 'Asia/Jerusalem' },

  // Pacific
  { name: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { name: 'Melbourne', value: 'Australia/Melbourne' },
  { name: 'Brisbane', value: 'Australia/Brisbane' },
  { name: 'Perth', value: 'Australia/Perth' },
  { name: 'Auckland (NZST)', value: 'Pacific/Auckland' },

  // Africa
  { name: 'Cairo', value: 'Africa/Cairo' },
  { name: 'Johannesburg', value: 'Africa/Johannesburg' },
  { name: 'Lagos', value: 'Africa/Lagos' },
  { name: 'Nairobi', value: 'Africa/Nairobi' },
];

/**
 * Handle timezone autocomplete for slash commands
 * Shows user's default timezone first, then other timezones filtered by input
 */
export async function handleTimezoneAutocomplete(
  interaction: AutocompleteInteraction
): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'timezone') {
    // Get the user's stored timezone
    const userTimezone = await getUserTimezone(interaction.user.id);

    // Filter based on what the user is typing
    const filtered = TIMEZONES.filter(
      (tz) =>
        tz.name.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
        tz.value.toLowerCase().includes(focusedOption.value.toLowerCase())
    );

    // Build the response, putting user's default first
    const suggestions = filtered.map((tz) => ({
      name: userTimezone === tz.value ? `${tz.name} (Your Default)` : tz.name,
      value: tz.value,
    }));

    // If user has a default and it's in the list, move it to the front
    if (userTimezone) {
      const defaultIndex = suggestions.findIndex(
        (s) => s.value === userTimezone
      );
      if (defaultIndex > 0) {
        const defaultTz = suggestions.splice(defaultIndex, 1)[0];
        suggestions.unshift(defaultTz);
      }
    }

    await interaction.respond(suggestions.slice(0, 25)); // Discord limits to 25 choices
  }
}
