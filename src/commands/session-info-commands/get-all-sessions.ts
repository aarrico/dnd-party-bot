import { SlashCommandBuilder } from 'discord.js';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '@shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '@models/Command.js';
import {
  formatSessionsAsStr,
  listSessions,
} from '@modules/session/controller/session.controller.js';
import { getTxtAttachmentBuilder } from '@shared/files/attachmentBuilders.js';
import { sendEphemeralReply } from '@discord/message.js';
import { ListSessionsOptions } from '@modules/session/domain/session.types.js';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.GetAllSessions_Name)
    .setDescription(BotCommandInfo.GetAllSessions_Description)
    .addBooleanOption((includeSessionId) =>
      includeSessionId
        .setName(BotCommandOptionInfo.Session_Id_Name)
        .setDescription('Include channel id of the session in the output.')
    )
    .addBooleanOption((includeTime) =>
      includeTime
        .setName(BotCommandOptionInfo.Session_DateTime_Name)
        .setDescription('Include scheduled time in the output.')
    )
    .addBooleanOption((includeCampaign) =>
      includeCampaign
        .setName(BotCommandOptionInfo.CampaignName_Name)
        .setDescription('Include campaign name in the output.')
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      const includeId = interaction.options.getBoolean(BotCommandOptionInfo.Session_Id_Name) ?? false;
      const includeTime = interaction.options.getBoolean(BotCommandOptionInfo.Session_DateTime_Name) ?? false;
      const includeCampaign = interaction.options.getBoolean(BotCommandOptionInfo.CampaignName_Name) ?? false;

      const options: ListSessionsOptions = {
        includeId,
        includeUserRole: false,
        includeTime,
        includeCampaign,
      };

      const sessions = await listSessions(options);

      if (!sessions) {
        throw new Error('There was an error building the list.');
      }

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllSessionInformation}`,
        BotAttachmentFileNames.AllSessionInformation,
        formatSessionsAsStr(sessions, options)
      );

      await sendEphemeralReply(BotDialogs.sessions.listAllResult, interaction, [
        attachment,
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await sendEphemeralReply(`There was an error: ${errorMessage}`, interaction);
    }
  },
};
