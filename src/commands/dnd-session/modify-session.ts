import { SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { monthOptionChoicesArray } from '@shared/constants/dateConstants.js';
import { BotCommandOptionInfo } from '@shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '@shared/types/discord.js';
import { modifySession } from '@modules/session/controller/session.controller.js';
import { handleTimezoneAutocomplete } from '@shared/datetime/timezoneUtils.js';

export default {
  data: new SlashCommandBuilder()
    .setName('modify-session')
    .setDescription(
      'Makes changes to an existing session. Also updates photos to reflect changes.'
    )
    .addStringOption((id) =>
      id
        .setName(BotCommandOptionInfo.Session_Id_Name)
        .setDescription(BotCommandOptionInfo.Session_Id_Description)
        .setRequired(true)
    )
    .addStringOption((name) =>
      name
        .setName(BotCommandOptionInfo.Session_Name)
        .setDescription(
          BotCommandOptionInfo.Session_Name_Description
        )
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
        .setRequired(false)
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
    await modifySession(interaction);
  },
};
