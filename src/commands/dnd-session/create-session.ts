import { SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '../../utils/botDialogStrings.js';
import { monthOptionChoicesArray } from '../../utils/genericInformation.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { initSession } from '../../controllers/session.js';
import DateChecker from '../../utils/dateChecker.js';
import { notifyGuild, sendEphemeralReply } from '../../discord/message.js';
import { inspect } from 'util';
import { getUserTimezone } from '../../db/user.js';
import { handleTimezoneAutocomplete } from '../../utils/timezoneUtils.js';
import { formatSessionCreationDM } from '../../utils/sessionNotifications.js';
import { sanitizeUserInput } from '../../utils/sanitizeUserInput.js';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.CreateSessionName)
    .setDescription(BotCommandInfo.CreateSessionDescription)
    .addStringOption((name) =>
      name
        .setName(BotCommandOptionInfo.CreateSession_SessionName)
        .setDescription(
          BotCommandOptionInfo.CreateSession_SessionName_Description
        )
        .setRequired(true)
    )
    .addIntegerOption((month) =>
      month
        .setName(BotCommandOptionInfo.CreateSession_MonthName)
        .setDescription(BotCommandOptionInfo.CreateSession_MonthDescription)
        .setChoices(monthOptionChoicesArray)
        .setRequired(true)
    )
    .addIntegerOption((day) =>
      day
        .setName(BotCommandOptionInfo.CreateSession_DayName)
        .setDescription(BotCommandOptionInfo.CreateSession_DayDescription)
        .setRequired(true)
    )
    .addIntegerOption((year) =>
      year
        .setName(BotCommandOptionInfo.CreateSession_YearName)
        .setDescription(BotCommandOptionInfo.CreateSession_YearDescription)
        .setRequired(true)
    )
    .addStringOption((time) =>
      time
        .setName(BotCommandOptionInfo.CreateSession_TimeName)
        .setDescription(BotCommandOptionInfo.CreateSession_TimeDescription)
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

      const rawSessionName = interaction.options.getString(BotCommandOptionInfo.CreateSession_SessionName, true);
      const sessionName = sanitizeUserInput(rawSessionName);

      if (!sessionName) {
        await sendEphemeralReply(BotDialogs.createSessionInvalidSessionName, interaction);
        return;
      }

      let timezone = interaction.options.getString(BotCommandOptionInfo.CreateSession_TimezoneName);

      if (!timezone) {
        timezone = await getUserTimezone(interaction.user.id);
      }

      const date = DateChecker(interaction, timezone);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      await interaction.deferReply();

      const creatorDisplayName =
        sanitizeUserInput(interaction.user.displayName) || interaction.user.username;

      const session = await initSession(
        campaign,
        sessionName,
        date,
        creatorDisplayName,
        interaction.user.id,
        timezone,
      );

      const normalizedChannelName = sessionName.replace(' ', '-').toLowerCase();

      const createdChannel = campaign.channels.cache.find(channel =>
        channel.name === normalizedChannelName
      );

      await interaction.editReply({
        content: createdChannel
          ? BotDialogs.createSessionSuccess(sessionName, date, createdChannel.id)
          : BotDialogs.createSessionSuccessFallback(sessionName, date, normalizedChannelName)
      });

      await notifyGuild(
        campaign.id,
        (userId: string) => formatSessionCreationDM(campaign, session, userId)
      );
    } catch (error) {
      const payload = {
        content: (error as Error).message || BotDialogs.createSessionError
      };
      
      if (interaction.deferred) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
      console.error(`Error creating session:`, inspect(error, { depth: null, colors: true }))
    }
  },
};
