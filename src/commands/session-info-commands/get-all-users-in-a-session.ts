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
import { SlashCommandBuilder } from 'discord.js';
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
        void interaction.reply('Only Admins can run this command!');
        return;
      }
      const sessionId = interaction.options.getString(BotCommandOptionInfo.SessionId_Name, true);

      const addUserId = interaction.options.getBoolean(BotCommandOptionInfo.UserId_Name) ?? false;
      const addUserRoleInThisSession = interaction.options.getBoolean(BotCommandOptionInfo.GetAllUsersInASession_UserRoleName) ?? false;
      const addUserDMMessageId = interaction.options.getBoolean(BotCommandOptionInfo.GetAllUsersInASession_UserChannelIDName) ?? false;

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

      void sendEphemeralReply(
        BotDialogs.sessions.allUsersResult(session.name),
        interaction,
        [attachment]
      );
    } catch (error) {
      void sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
};
