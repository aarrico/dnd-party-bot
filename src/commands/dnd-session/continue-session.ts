import { SlashCommandBuilder, AutocompleteInteraction, ChannelType } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '#shared/messages/botDialogStrings.js';
import { monthOptionChoicesArray } from '#shared/constants/dateConstants.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { continueSession } from '#modules/session/controller/session.controller.js';
import DateChecker from '#shared/datetime/dateChecker.js';
import { notifyParty, sendEphemeralReply } from '#shared/discord/messages.js';
import { inspect } from 'util';
import { getUserTimezone, upsertUser } from '#modules/user/repository/user.repository.js';
import { handleTimezoneAutocomplete } from '#shared/datetime/timezoneUtils.js';
import { client } from '#app/index.js';
import { formatSessionContinueDM } from '#shared/messages/sessionNotifications.js';
import { sanitizeUserInput } from '#shared/validation/sanitizeUserInput.js';
import { getSessionById } from '#modules/session/repository/session.repository.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('ContinueSessionCommand');

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
    .addStringOption((channel) =>
      channel
        .setName(BotCommandOptionInfo.ContinueSession_ChannelName)
        .setDescription(BotCommandOptionInfo.ContinueSession_ChannelDescription)
        .setAutocomplete(true)
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
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === String(BotCommandOptionInfo.ContinueSession_ChannelName)) {
      if (!interaction.guild) return;

      const channels = await interaction.guild.channels.fetch();
      const topLevelTextChannels = channels
        .filter(channel =>
          channel?.type === ChannelType.GuildText &&
          channel.parentId === null
        )
        .map(channel => ({
          name: channel!.name,
          value: channel!.id
        }))
        .slice(0, 25); // Discord limits to 25 choices

      await interaction.respond(topLevelTextChannels);
    } else if (focusedOption.name === String(BotCommandOptionInfo.CreateSession_TimezoneName)) {
      const userTimezone = await getUserTimezone(interaction.user.id);
      await handleTimezoneAutocomplete(interaction, userTimezone);
    }
  },
  async execute(interaction: ExtendedInteraction) {
    try {
      const campaign = interaction.guild;
      if (!campaign) {
        throw new Error('Command must be run in a server!');
      }

      const channelId = interaction.options.getString(
        BotCommandOptionInfo.ContinueSession_ChannelName,
        true
      );

      const fullChannel = await campaign.channels.fetch(channelId);
      if (!fullChannel || fullChannel.type !== ChannelType.GuildText) {
        await sendEphemeralReply(
          BotDialogs.continueSessionInvalidChannel,
          interaction
        );
        return;
      }

      if (fullChannel.parentId !== null) {
        await sendEphemeralReply(
          BotDialogs.continueSessionChannelNotSession,
          interaction
        );
        return;
      }

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

      await interaction.deferReply();

      const creatorDisplayName =
        sanitizeUserInput(interaction.user.displayName) || interaction.user.username;

      // Ensure user exists in database before getting their timezone
      const user = await client.users.fetch(interaction.user.id);
      const dmChannel = await user.createDM();
      await upsertUser(interaction.user.id, creatorDisplayName, dmChannel.id);

      let timezone = interaction.options.getString(BotCommandOptionInfo.CreateSession_TimezoneName);
      if (!timezone) {
        timezone = existingSession.timezone || await getUserTimezone(interaction.user.id);
      }

      const date = DateChecker(interaction, timezone);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      const newSessionName = getNextSessionName(existingSession.name);

      const { session, party } = await continueSession(
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

      logger.info('Session continued successfully', {
        previousSessionId: existingSession.id,
        newSessionId: session.id,
        newSessionName: newSessionName,
        campaignId: campaign.id,
        userId: interaction.user.id,
        scheduledDate: date.toISOString(),
        partySize: party.length,
      });

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

      await notifyParty(
        party.map(member => member.userId),
        (userId: string) => formatSessionContinueDM(campaign, session, userId)
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
      logger.error('Error continuing session', {
        error: inspect(error, { depth: null, colors: true })
      });
    }
  },
};
