import { SlashCommandBuilder } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '../../utils/botDialogStrings';
import { monthOptionChoicesArray } from '../../utils/genericInformation';
import { ExtendedInteraction } from '../../typings/Command';
import { initSession } from '../../controllers/session';
import DateChecker from '../../utils/dateChecker';
import { sendEphemeralReply } from '../../discord/message';
import { client } from '../../index';

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
      const guild = interaction.guild;
      if (!guild) {
        throw new Error('Command must be run in a server!');
      }

      const sessionName = interaction.options.get(
        BotCommandOptionInfo.CreateSession_SessionName
      )?.value as string;

      if (!sessionName) {
        await interaction.reply(BotDialogs.createSessionInvalidSessionName);
      }

      const date = DateChecker(interaction);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      await sendEphemeralReply(BotDialogs.createSessionOneMoment, interaction);

      const message = await initSession(
        guild.id,
        sessionName,
        date,
        interaction.user.displayName,
        interaction.user.id
      );

      const user = client.users.cache.get(interaction.user.id);
      user?.send(message);
    } catch (error) {
      await sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
};
