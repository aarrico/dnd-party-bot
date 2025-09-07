import { SlashCommandBuilder } from 'discord.js';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '../../utils/botDialogStrings.js';
import { getTxtAttachmentBuilder } from '../../utils/attachmentBuilders.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { sendEphemeralReply } from '../../discord/message.js';
import { ListSessionsOptions } from '../../models/session.js';
import { getSessionsForUser } from '../../db/user.js';
import { formatSessionsAsStr } from '../../controllers/session';

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
    const includeSessionId = interaction.options.getBoolean(BotCommandOptionInfo.SessionId_Name) ?? false;
    const includeTime = interaction.options.getBoolean(BotCommandOptionInfo.SessionTime_Name) ?? false;
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
