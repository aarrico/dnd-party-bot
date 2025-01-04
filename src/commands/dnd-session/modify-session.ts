import { monthOptionChoicesArray } from '../../utils/genericInformation';
import { BotCommandOptionInfo } from '../../utils/botDialogStrings';
import { ExtendedInteraction } from '../../typings/Command';
import { modifySession } from '../../controllers/session';
import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('modify-session')
    .setDescription(
      'Makes changes to existing session. Also updates photos to reflect changes.'
    )
    .addStringOption((id) =>
      id
        .setName(BotCommandOptionInfo.SessionId_Name)
        .setDescription(BotCommandOptionInfo.SessionId_Description)
        .setRequired(true)
    )
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
    await modifySession(interaction);
  },
};
