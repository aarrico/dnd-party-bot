import { SlashCommandBuilder } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '../../utils/botDialogStrings.js';
import { monthOptionChoicesArray } from '../../utils/genericInformation.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { initSession } from '../../controllers/session.js';
import DateChecker from '../../utils/dateChecker';
import { notifyGuild, sendEphemeralReply } from '../../discord/message';
import { inspect } from 'util';

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
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      const campaign = interaction.guild;
      if (!campaign) {
        throw new Error('Command must be run in a server!');
      }

      const sessionName = interaction.options.getString(BotCommandOptionInfo.CreateSession_SessionName, true);

      if (!sessionName) {
        await sendEphemeralReply(BotDialogs.createSessionInvalidSessionName, interaction);
        return;
      }

      const date = DateChecker(interaction);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      await interaction.deferReply();

      const dmMessage = await initSession(
        campaign,
        sessionName,
        date,
        interaction.user.displayName,
        interaction.user.id,
      );

      // The channel name is normalized in createChannel (first space becomes dash)
      const normalizedChannelName = sessionName.replace(' ', '-').toLowerCase();

      // Find the created channel by name
      const createdChannel = campaign.channels.cache.find(channel =>
        channel.name === normalizedChannelName
      );

      // Send public message announcing the session is ready with a link to the channel
      await interaction.editReply({
        content: createdChannel
          ? BotDialogs.createSessionSuccess(sessionName, date, createdChannel.id)
          : BotDialogs.createSessionSuccessFallback(sessionName, date, normalizedChannelName)
      });

     await notifyGuild(campaign.id, dmMessage);
    } catch (error) {
      // Public error message since we want transparency about session creation failures
      if (interaction.deferred) {
        await interaction.editReply({
          content: BotDialogs.createSessionError
        });
      } else {
        await interaction.reply({
          content: BotDialogs.createSessionError
        });
      }
      console.error(`Error creating session:`, inspect(error, { depth: null, colors: true }))
    }
  },
};
