import { SlashCommandBuilder } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
} from '../../utils/botDialogStrings';
import { monthOptionChoicesArray } from '../../utils/genericInformation';
import { ExtendedInteraction } from '../../typings/Command';
import { initSession } from '../../controllers/session';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.CreateSessionName)
    .setDescription(BotCommandInfo.CreateSessionDescription)
    .addStringOption((option) =>
      option
        .setName(BotCommandOptionInfo.CreateSession_SessionName)
        .setDescription(BotCommandOptionInfo.CreateSession_SessionDescription)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName(BotCommandOptionInfo.CreateSession_MonthName)
        .setDescription(BotCommandOptionInfo.CreateSession_MonthDescription)
        .setChoices(monthOptionChoicesArray)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName(BotCommandOptionInfo.CreateSession_DayName)
        .setDescription(BotCommandOptionInfo.CreateSession_DayDescription)
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName(BotCommandOptionInfo.CreateSession_YearName)
        .setDescription(BotCommandOptionInfo.CreateSession_YearDescription)
        .setRequired(true)
    )
    .addNumberOption((option) =>
      option
        .setName(BotCommandOptionInfo.CreateSession_TimeName)
        .setDescription(BotCommandOptionInfo.CreateSession_TimeDescription)
        .setRequired(true)
    ),
  async execute(interaction: ExtendedInteraction) {
    await initSession(interaction);
  },
};
