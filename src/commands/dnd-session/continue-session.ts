import { SlashCommandBuilder, AutocompleteInteraction, ChannelType } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '@shared/messages/botDialogStrings.js';
import { monthOptionChoicesArray } from '@shared/constants/dateConstants.js';
import { ExtendedInteraction } from '@shared/types/discord.js';
import { continueSession } from '@modules/session/controller/session.controller.js';
import DateChecker from '@shared/datetime/dateChecker.js';
import { notifyGuild, sendEphemeralReply } from '@shared/discord/messages.js';
import { inspect } from 'util';
import { getUserTimezone } from '@modules/user/repository/user.repository.js';
import { handleTimezoneAutocomplete } from '@shared/datetime/timezoneUtils.js';
import { formatSessionCreationDM } from '@shared/messages/sessionNotifications.js';
import { sanitizeUserInput } from '@shared/validation/sanitizeUserInput.js';
import { getSessionById } from '@modules/session/repository/session.repository.js';

// Helper function to convert number to Roman numerals
function toRomanNumeral(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];

  let result = '';
  for (const [value, numeral] of romanNumerals) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

// Helper function to extract Roman numeral from session name
function extractRomanNumeral(sessionName: string): number {
  const romanPattern = /\s+(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XL|L|XC|C{1,3}|CD|D|CM|M{1,3})$/;
  const match = sessionName.match(romanPattern);

  if (!match) {
    return 0; // No Roman numeral found
  }

  const romanStr = match[1];
  const romanValues: { [key: string]: number } = {
    'I': 1, 'V': 5, 'X': 10, 'L': 50,
    'C': 100, 'D': 500, 'M': 1000
  };

  let result = 0;
  for (let i = 0; i < romanStr.length; i++) {
    const current = romanValues[romanStr[i]];
    const next = romanValues[romanStr[i + 1]];

    if (next && current < next) {
      result -= current;
    } else {
      result += current;
    }
  }

  return result;
}

// Helper function to get the base session name (without Roman numeral)
function getBaseSessionName(sessionName: string): string {
  const romanPattern = /\s+(I{1,3}|IV|V|VI{0,3}|IX|X{1,3}|XL|L|XC|C{1,3}|CD|D|CM|M{1,3})$/;
  return sessionName.replace(romanPattern, '').trim();
}

// Helper function to append or increment Roman numeral
function getNextSessionName(sessionName: string): string {
  const currentNumeral = extractRomanNumeral(sessionName);
  const baseName = getBaseSessionName(sessionName);

  // If no Roman numeral exists, add II (not I, since the original is implicitly I)
  if (currentNumeral === 0) {
    return `${baseName} II`;
  }

  const nextNumeral = toRomanNumeral(currentNumeral + 1);
  return `${baseName} ${nextNumeral}`;
}

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.ContinueSessionName)
    .setDescription(BotCommandInfo.ContinueSessionDescription)
    .addChannelOption((channel) =>
      channel
        .setName(BotCommandOptionInfo.ContinueSession_ChannelName)
        .setDescription(BotCommandOptionInfo.ContinueSession_ChannelDescription)
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addIntegerOption((month) =>
      month
        .setName(BotCommandOptionInfo.Session_Month_Name)
        .setDescription(BotCommandOptionInfo.Session_Month_Description)
        .setChoices(monthOptionChoicesArray)
        .setRequired(true)
    )
    .addIntegerOption((day) =>
      day
        .setName(BotCommandOptionInfo.Session_Day_Name)
        .setDescription(BotCommandOptionInfo.Session_Day_Description)
        .setRequired(true)
    )
    .addIntegerOption((year) =>
      year
        .setName(BotCommandOptionInfo.Session_Year_Name)
        .setDescription(BotCommandOptionInfo.Session_Year_Description)
        .setRequired(true)
    )
    .addStringOption((time) =>
      time
        .setName(BotCommandOptionInfo.Session_Time_Name)
        .setDescription(BotCommandOptionInfo.Session_Time_Description)
        .setRequired(true)
    )
    .addStringOption((timezone) =>
      timezone
        .setName(BotCommandOptionInfo.CreateSession_TimezoneName)
        .setDescription(BotCommandOptionInfo.CreateSession_TimezoneDescription)
        .setRequired(false)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    await handleTimezoneAutocomplete(interaction);
  },
  async execute(interaction: ExtendedInteraction) {
    try {
      const campaign = interaction.guild;
      if (!campaign) {
        throw new Error('Command must be run in a server!');
      }

      const selectedChannel = interaction.options.getChannel(
        BotCommandOptionInfo.ContinueSession_ChannelName,
        true
      );

      // Validate that the selected channel is a session channel
      if (!selectedChannel || selectedChannel.type !== ChannelType.GuildText) {
        await sendEphemeralReply(
          BotDialogs.continueSessionInvalidChannel,
          interaction
        );
        return;
      }

      // Fetch the full channel to access parentId
      const fullChannel = await campaign.channels.fetch(selectedChannel.id);

      if (!fullChannel || fullChannel.type !== ChannelType.GuildText) {
        await sendEphemeralReply(
          BotDialogs.continueSessionInvalidChannel,
          interaction
        );
        return;
      }

      // Validate that the channel has no parent (not in a category)
      if (fullChannel.parentId !== null) {
        await sendEphemeralReply(
          BotDialogs.continueSessionChannelNotSession,
          interaction
        );
        return;
      }

      // Get the existing session data
      let existingSession;
      try {
        existingSession = await getSessionById(fullChannel.id, true);
      } catch {
        await sendEphemeralReply(
          BotDialogs.continueSessionNotFound,
          interaction
        );
        return;
      }

      // Get timezone
      let timezone = interaction.options.getString(BotCommandOptionInfo.CreateSession_TimezoneName);
      if (!timezone) {
        timezone = existingSession.timezone || await getUserTimezone(interaction.user.id);
      }

      // Get and validate the new date
      const date = DateChecker(interaction, timezone);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      await interaction.deferReply();

      // Generate the new session name with incremented Roman numeral
      const newSessionName = getNextSessionName(existingSession.name);

      const creatorDisplayName =
        sanitizeUserInput(interaction.user.displayName) || interaction.user.username;

      // Create the new session with copied party members from the original
      const session = await continueSession(
        campaign,
        existingSession,
        newSessionName,
        date,
        creatorDisplayName,
        interaction.user.id,
        timezone,
      );

      const normalizedChannelName = newSessionName.replace(/\s+/g, '-').toLowerCase();

      const createdChannel = campaign.channels.cache.find(channel =>
        channel.name === normalizedChannelName
      );

      await interaction.editReply({
        content: createdChannel
          ? BotDialogs.continueSessionSuccess(
            existingSession.name,
            newSessionName,
            date,
            createdChannel.id
          )
          : BotDialogs.continueSessionSuccessFallback(
            existingSession.name,
            newSessionName,
            date,
            normalizedChannelName
          )
      });

      await notifyGuild(
        campaign.id,
        (userId: string) => formatSessionCreationDM(campaign, session, userId)
      );
    } catch (error) {
      const payload = {
        content: (error as Error).message || BotDialogs.continueSessionError
      };

      if (interaction.deferred) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
      console.error(`Error continuing session:`, inspect(error, { depth: null, colors: true }))
    }
  },
};
