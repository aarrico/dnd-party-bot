import { SlashCommandBuilder } from 'discord.js';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '../../utils/botDialogStrings';
import { ExtendedInteraction } from '../../models/Command.js';
import {
  formatSessionsAsStr,
  listSessions,
} from '../../controllers/session.js';
import { getTxtAttachmentBuilder } from '../../utils/attachmentBuilders.js';
import { sendEphemeralReply } from '../../discord/message.js';
import { ListSessionsOptions } from '../../models/session';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.GetAllSessions_Name)
    .setDescription(BotCommandInfo.GetAllSessions_Description)
    .addBooleanOption((includeSessionId) =>
      includeSessionId
        .setName(BotCommandOptionInfo.SessionId_Name)
        .setDescription('Include channel id of the session in the output.')
    )
    .addBooleanOption((includeTime) =>
      includeTime
        .setName(BotCommandOptionInfo.SessionTime_Name)
        .setDescription('Include scheduled time in the output.')
    )
    .addBooleanOption((includeCampaign) =>
      includeCampaign
        .setName(BotCommandOptionInfo.CampaignName_Name)
        .setDescription('Include campaign name in the output.')
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      const includeId = interaction.options.getBoolean(BotCommandOptionInfo.SessionId_Name) ?? false;
      const includeTime = interaction.options.getBoolean(BotCommandOptionInfo.SessionTime_Name) ?? false;
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
      await sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
};
