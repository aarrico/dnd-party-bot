import { SlashCommandBuilder } from 'discord.js';

import { getTxtAttachmentBuilder } from '../../utils/attachmentBuilders';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '../../utils/botDialogStrings';

import { sendEphemeralReply } from '../../discord/message';
import { ExtendedInteraction } from '../../typings/Command';
import {
  formatSessionPartyAsStr,
  listPartyForSession,
} from '../../controllers/party';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.GetAllUsersInASession_Name)
    .setDescription(BotCommandInfo.GetAllUsersInASession_Description)
    .addStringOption((id) =>
      id
        .setName(BotCommandOptionInfo.SessionId_Name)
        .setDescription(BotCommandOptionInfo.SessionId_Description)
        .setRequired(true)
    )
    .addBooleanOption((userId) =>
      userId
        .setName(BotCommandOptionInfo.UserId_Name)
        .setDescription(
          BotCommandOptionInfo.GetAllUsersInASession_UserIDDescription
        )
    )
    .addBooleanOption((userRole) =>
      userRole
        .setName(BotCommandOptionInfo.GetAllUsersInASession_UserRoleName)
        .setDescription(
          BotCommandOptionInfo.GetAllUsersInASession_UserRoleDescription
        )
    )
    .addBooleanOption((userDMMessageID) =>
      userDMMessageID
        .setName(BotCommandOptionInfo.GetAllUsersInASession_UserChannelIDName)
        .setDescription(
          BotCommandOptionInfo.GetAllUsersInASession_UserChannelIDDescription
        )
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      if (!interaction.member.permissions.has('Administrator')) {
        interaction.reply('Only Admins can run this command!');
        return;
      }
      const sessionId = interaction?.options?.get(
        BotCommandOptionInfo.SessionId_Name
      )?.value as string;

      const addUserId = interaction?.options?.get(
        BotCommandOptionInfo.UserId_Name
      )?.value as boolean;
      const addUserRoleInThisSession = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsersInASession_UserRoleName
      )?.value as boolean;
      const addUserDMMessageId = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsersInASession_UserChannelIDName
      )?.value as boolean;

      const session = await listPartyForSession(sessionId);

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllUsersInSessionInformation}`,
        BotAttachmentFileNames.AllUsersInSessionInformation,
        formatSessionPartyAsStr(session, {
          addUserRoleInThisSession,
          addUserId,
          addUserDMMessageId,
        })
      );

      sendEphemeralReply(
        BotDialogs.sessions.allUsersResult(session.name),
        interaction,
        [attachment]
      );
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
};
