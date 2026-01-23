import { SlashCommandBuilder, AutocompleteInteraction, ChannelType } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '#shared/messages/botDialogStrings.js';
import { monthOptionChoicesArray, dayChoices, yearOptionChoicesArray } from '#shared/constants/dateConstants.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { continueSessionInChannel } from '#modules/session/controller/session.controller.js';
import DateChecker from '#shared/datetime/dateChecker.js';
import { notifyParty, sendEphemeralReply } from '#shared/discord/messages.js';
import { inspect } from 'util';
import { getUserTimezone } from '#modules/user/repository/user.repository.js';
import { handleTimezoneAutocomplete } from '#shared/datetime/timezoneUtils.js';
import { formatSessionContinueDM } from '#shared/messages/sessionNotifications.js';
import { sanitizeUserInput } from '#shared/validation/sanitizeUserInput.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('ContinueSessionCommand');

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.ContinueSessionName)
    .setDescription(BotCommandInfo.ContinueSessionDescription)
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
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addIntegerOption((year) =>
      year
        .setName(BotCommandOptionInfo.Session_Year_Name)
        .setDescription(BotCommandOptionInfo.Session_Year_Description)
        .setChoices(yearOptionChoicesArray)
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

    if (focusedOption.name === String(BotCommandOptionInfo.Session_Day_Name)) {
      const filtered = dayChoices.filter(day =>
        day.name.startsWith(focusedOption.value.toString())
      ).slice(0, 25);
      await interaction.respond(filtered);
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

      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        throw new Error('Command must be run in a text channel!');
      }

      await interaction.deferReply();

      const creatorDisplayName =
        sanitizeUserInput(interaction.user.displayName) || interaction.user.username;

      const userId = interaction.user.id;

      let timezone = interaction.options.getString(BotCommandOptionInfo.CreateSession_TimezoneName);
      if (!timezone) {
        timezone = await getUserTimezone(userId);
      }

      const date = DateChecker(interaction, timezone);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      const { session, party } = await continueSessionInChannel(
        campaign,
        channel,
        date,
        creatorDisplayName,
        userId,
        timezone
      );

      logger.info('Session continued successfully', {
        newSessionId: session.id,
        newSessionName: session.name,
        campaignId: session.campaignId,
        userId,
        scheduledDate: date.toISOString(),
        partySize: party.length,
      });

      await interaction.deleteReply();

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
