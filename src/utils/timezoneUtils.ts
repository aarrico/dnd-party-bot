import { AutocompleteInteraction } from 'discord.js';
import { getUserTimezone } from '../db/user.js';

export interface TimezoneOption {
  name: string;
  value: string;
}

/**
 * American timezones with friendly display names mapped to IANA timezone identifiers
 */
export const AMERICAN_TIMEZONES: TimezoneOption[] = [
  { name: 'Eastern', value: 'America/New_York' },
  { name: 'Central', value: 'America/Chicago' },
  { name: 'Mountain', value: 'America/Denver' },
  { name: 'Pacific', value: 'America/Los_Angeles' },
  { name: 'Alaska', value: 'America/Anchorage' },
  { name: 'Hawaii', value: 'Pacific/Honolulu' },
  { name: 'Arizona', value: 'America/Phoenix' },
];

/**
 * Handle timezone autocomplete for slash commands
 * Shows user's default timezone first, then other American timezones filtered by input
 */
export async function handleTimezoneAutocomplete(
  interaction: AutocompleteInteraction
): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'timezone') {
    // Get the user's stored timezone
    const userTimezone = await getUserTimezone(interaction.user.id);

    // Filter based on what the user is typing
    const filtered = AMERICAN_TIMEZONES.filter(
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
