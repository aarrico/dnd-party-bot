import { SlashCommandBuilder } from 'discord.js';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '../../utils/botDialogStrings';
import { ExtendedInteraction } from '../../typings/Command';
import { listSessions } from '../../controllers/session';
import { getTxtAttachmentBuilder } from '../../utils/attachmentBuilders';
import { sendEphemeralReply } from '../../discord/message';

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
      const includeSessionId = interaction.options.get(
        BotCommandOptionInfo.SessionId_Name,
        true
      )?.value as boolean;

      const includeTime = interaction.options.get(
        BotCommandOptionInfo.SessionTime_Name,
        true
      )?.value as boolean;

      const includeCampaign = interaction.options.get(
        BotCommandOptionInfo.CampaignName_Name,
        true
      )?.value as boolean;

      const sessions = await listSessions(
        {
          includeSessionId,
          includeTime,
          includeCampaign,
        },
        true
      );

      if (!sessions || sessions instanceof Array) {
        throw new Error('There was an error building the list.');
      }

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllSessionInformation}`,
        BotAttachmentFileNames.AllSessionInformation,
        sessions
      );

      await sendEphemeralReply(
        BotDialogs.GetAllSessions_HereIsTheList,
        interaction,
        [attachment]
      );
    } catch (error) {
      await sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
};
