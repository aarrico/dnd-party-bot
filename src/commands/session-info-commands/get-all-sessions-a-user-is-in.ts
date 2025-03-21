import { SlashCommandBuilder } from 'discord.js';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '../../utils/botDialogStrings';
import { ExtendedInteraction } from '../../typings/Command';
import { getTxtAttachmentBuilder } from '../../utils/attachmentBuilders';
import { sendEphemeralReply } from '../../discord/message';
import { formatSessionsAsStr } from '../../controllers/session';
import { ListSessionsOptions } from '../../typings/session';
import { getSessionsForUser } from '../../db/user';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.GetAllUserSessions_Name)
    .setDescription(BotCommandInfo.GetAllUserSessions_Description)
    .addStringOption((userId) =>
      userId
        .setName(BotCommandOptionInfo.UserId_Name)
        .setDescription(
          BotCommandOptionInfo.GetAllUserSessions_UserIDDescription
        )
        .setRequired(true)
    )
    .addBooleanOption((includeSession) =>
      includeSession
        .setName(BotCommandOptionInfo.SessionId_Name)
        .setDescription(
          BotCommandOptionInfo.GetAllUserSessions_SessionIDDescription
        )
    )
    .addBooleanOption((includeRole) =>
      includeRole
        .setName(BotCommandOptionInfo.GetAllUserSessions_UserRoleName)
        .setDescription(
          BotCommandOptionInfo.GetAllUserSessions_UserRoleDescription
        )
    )
    .addBooleanOption((includeTime) =>
      includeTime
        .setName(BotCommandOptionInfo.SessionTime_Name)
        .setDescription(BotCommandOptionInfo.SessionTime_Description)
    )
    .addBooleanOption((includeCampaign) =>
      includeCampaign
        .setName(BotCommandOptionInfo.CampaignName_Name)
        .setDescription(BotCommandOptionInfo.Campaign_Description)
    ),
  async execute(interaction: ExtendedInteraction) {
    const includeId = interaction.options.get(
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

    const includeRole = interaction.options.get(
      BotCommandOptionInfo.GetAllUserSessions_UserRoleName,
      true
    )?.value as boolean;

    const userId = interaction.options.get(
      BotCommandOptionInfo.UserId_Name,
      true
    )?.value as string;

    const options: ListSessionsOptions = {
      includeId,
      includeTime,
      includeCampaign,
      userId,
      includeRole,
    };

    const data = await getSessionsForUser(userId);
    if (!data) {
      throw new Error('There was an error building the list.');
    }

    const attachment = getTxtAttachmentBuilder(
      `${BotPaths.TempDir}${BotAttachmentFileNames.AllSessionInformation}`,
      BotAttachmentFileNames.AllSessionInformation,
      formatSessionsAsStr(data.sessions, options)
    );

    await sendEphemeralReply(
      BotDialogs.sessions.forUserResult(data.username),
      interaction,
      [attachment]
    );
  },
};
