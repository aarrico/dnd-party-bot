import { SlashCommandBuilder } from 'discord.js';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '#shared/messages/botDialogStrings.js';
import { getTxtAttachmentBuilder } from '#shared/files/attachmentBuilders.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { ListSessionsOptions } from '#modules/session/domain/session.types.js';
import { getSessionsForUser } from '#modules/user/repository/user.repository.js';
import { formatSessionsAsStr } from '#modules/session/controller/session.controller.js';

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
        .setName(BotCommandOptionInfo.Session_Id_Name)
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
        .setName(BotCommandOptionInfo.Session_IncludeTime_Name)
        .setDescription(BotCommandOptionInfo.Session_IncludeTime_Description)
    )
    .addBooleanOption((includeCampaign) =>
      includeCampaign
        .setName(BotCommandOptionInfo.CampaignName_Name)
        .setDescription(BotCommandOptionInfo.Campaign_Description)
    ),
  async execute(interaction: ExtendedInteraction) {
    const includeSessionId = interaction.options.getBoolean(BotCommandOptionInfo.Session_Id_Name) ?? false;
    const includeTime = interaction.options.getBoolean(BotCommandOptionInfo.Session_IncludeTime_Name) ?? false;
    const includeCampaign = interaction.options.getBoolean(BotCommandOptionInfo.CampaignName_Name) ?? false;
    const includeUserRole = interaction.options.getBoolean(BotCommandOptionInfo.GetAllUserSessions_UserRoleName) ?? false;
    const userId = interaction.options.getString(BotCommandOptionInfo.UserId_Name, true);

    const options: ListSessionsOptions = {
      includeId: true,
      includeTime,
      includeCampaign,
      includeUserRole,
      userId,
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
