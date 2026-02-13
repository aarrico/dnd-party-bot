import {
  ActionRowBuilder,
  AutocompleteInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  User,
} from 'discord.js';
import { BotDialogs } from '#shared/messages/botDialogStrings.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('TimezoneUtils');

export interface TimezoneOption {
  name: string;
  value: string;
}

export interface TimezoneRegion {
  name: string;
  value: string;
  emoji: string;
  timezones: TimezoneOption[];
}

/**
 * Timezones organized by region for multi-step selection
 */
export const TIMEZONE_REGIONS: TimezoneRegion[] = [
  {
    name: 'Americas',
    value: 'americas',
    emoji: '🌎',
    timezones: [
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
    ],
  },
  {
    name: 'Europe',
    value: 'europe',
    emoji: '🌍',
    timezones: [
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
    ],
  },
  {
    name: 'Asia',
    value: 'asia',
    emoji: '🌏',
    timezones: [
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
    ],
  },
  {
    name: 'Pacific / Australia',
    value: 'pacific',
    emoji: '🏝️',
    timezones: [
      { name: 'Sydney (AEST)', value: 'Australia/Sydney' },
      { name: 'Melbourne', value: 'Australia/Melbourne' },
      { name: 'Brisbane', value: 'Australia/Brisbane' },
      { name: 'Perth', value: 'Australia/Perth' },
      { name: 'Auckland (NZST)', value: 'Pacific/Auckland' },
    ],
  },
  {
    name: 'Africa',
    value: 'africa',
    emoji: '🌍',
    timezones: [
      { name: 'Cairo', value: 'Africa/Cairo' },
      { name: 'Johannesburg', value: 'Africa/Johannesburg' },
      { name: 'Lagos', value: 'Africa/Lagos' },
      { name: 'Nairobi', value: 'Africa/Nairobi' },
    ],
  },
];

/**
 * Flat list of all timezones (for autocomplete and validation)
 */
export const TIMEZONES: TimezoneOption[] = TIMEZONE_REGIONS.flatMap(
  (region) => region.timezones
);

/**
 * Get timezones for a specific region
 */
export const getTimezonesByRegion = (regionValue: string): TimezoneOption[] => {
  const region = TIMEZONE_REGIONS.find((r) => r.value === regionValue);
  return region?.timezones ?? [];
};

/**
 * Build a region select menu for timezone selection (step 1)
 */
export const buildRegionSelectMenu = (
  customId: string
): StringSelectMenuBuilder => {
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Select your region')
    .addOptions(
      TIMEZONE_REGIONS.map((region) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(region.name)
          .setDescription(`${region.timezones.length} timezones`)
          .setValue(region.value)
          .setEmoji(region.emoji)
      )
    );
};

/**
 * Build a timezone select menu for a specific region (step 2)
 */
export const buildTimezoneSelectMenu = (
  customId: string,
  regionValue: string
): StringSelectMenuBuilder => {
  const timezones = getTimezonesByRegion(regionValue);
  return new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('Select your timezone')
    .addOptions(
      timezones.map((tz) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(tz.name)
          .setDescription(tz.value)
          .setValue(tz.value)
      )
    );
};

const ONBOARDING_REGION_SELECT_ID = 'onboarding-region-select';

/**
 * Send the timezone onboarding DM to a user
 */
export const sendTimezoneOnboardingDM = async (user: User): Promise<void> => {
  const regionSelect = buildRegionSelectMenu(ONBOARDING_REGION_SELECT_ID);
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    regionSelect
  );

  await user.send({
    content: BotDialogs.onboarding.welcome(user.username),
    components: [row],
  });

  logger.info('Sent onboarding DM', {
    userId: user.id,
    username: user.username,
  });
};

/**
 * Handle timezone autocomplete for slash commands
 * Shows user's default timezone first, then other timezones filtered by input
 */
export async function handleTimezoneAutocomplete(
  interaction: AutocompleteInteraction,
  userTimezone: string
): Promise<void> {
  const focusedOption = interaction.options.getFocused(true);

  if (focusedOption.name === 'timezone') {
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
