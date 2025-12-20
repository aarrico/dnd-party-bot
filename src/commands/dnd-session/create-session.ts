import { SlashCommandBuilder, AutocompleteInteraction, ChannelType } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '#shared/messages/botDialogStrings.js';
import { monthOptionChoicesArray } from '#shared/constants/dateConstants.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { createSession } from '#modules/session/controller/session.controller.js';
import DateChecker from '#shared/datetime/dateChecker.js';
import {
  notifyGameMaster,
  sendEphemeralReply,
} from '#shared/discord/messages.js';
import { inspect } from 'util';
import {
  getUserTimezone,
  upsertUser,
} from '#modules/user/repository/user.repository.js';
import { handleTimezoneAutocomplete } from '#shared/datetime/timezoneUtils.js';
import { formatSessionCreationDM } from '#shared/messages/sessionNotifications.js';
import { sanitizeUserInput } from '#shared/validation/sanitizeUserInput.js';
import { client } from '#app/index.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import { log } from 'console';

const logger = createScopedLogger('CreateSessionCommand');

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.CreateSessionName)
    .setDescription(BotCommandInfo.CreateSessionDescription)
    .addStringOption((name) =>
      name
        .setName(BotCommandOptionInfo.Session_Name)
        .setDescription(BotCommandOptionInfo.Session_Name_Description)
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
    const userTimezone = await getUserTimezone(interaction.user.id);
    await handleTimezoneAutocomplete(interaction, userTimezone);
  },
  async execute(interaction: ExtendedInteraction) {
    try {
      logger.info('Create session command invoked', {
        interaction: inspect(interaction, { depth: null, colors: true }),
      });

      const campaign = interaction.guild;
      if (!campaign) {
        throw new Error('Command must be run in a server!');
      }

      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        throw new Error('Command must be run in a text channel!');
      }

      const rawSessionName = interaction.options.getString(
        BotCommandOptionInfo.Session_Name,
        true
      );
      const sessionName = sanitizeUserInput(rawSessionName);

      if (!sessionName) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidSessionName,
          interaction
        );
        return;
      }

      await interaction.deferReply();

      const creatorDisplayName =
        sanitizeUserInput(interaction.user.displayName) ||
        interaction.user.username;

      const gameMasterId = interaction.user.id;

      let timezone = interaction.options.getString(
        BotCommandOptionInfo.CreateSession_TimezoneName
      );

      // If no timezone specified, get the user's default timezone (now that we know they exist)
      if (!timezone) {
        timezone = await getUserTimezone(gameMasterId);
      }

      const date = DateChecker(interaction, timezone);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      const session = await createSession(
        campaign,
        channel,
        sessionName,
        date,
        creatorDisplayName,
        gameMasterId,
        timezone
      );

      const normalizedChannelName = sessionName
        .replace(/\s+/g, '-')
        .toLowerCase();

      logger.info('Session created successfully', {
        sessionId: session.id,
        sessionName: sessionName,
        campaignId: campaign.id,
        userId: gameMasterId,
        scheduledDate: date.toISOString(),
        timezone,
      });

      await interaction.editReply({
        content: channel
          ? BotDialogs.createSessionSuccess(sessionName, date, channel.id)
          : BotDialogs.createSessionSuccessFallback(
              sessionName,
              date,
              normalizedChannelName
            ),
      });

      await notifyGameMaster(gameMasterId, (userId: string) =>
        formatSessionCreationDM(campaign, session, userId)
      );
    } catch (error) {
      const payload = {
        content: (error as Error).message || BotDialogs.createSessionError,
      };

      if (interaction.deferred) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
      logger.error('Error creating session', {
        error: inspect(error, { depth: null, colors: true }),
      });
    }
  },
};
