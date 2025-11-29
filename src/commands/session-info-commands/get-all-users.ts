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
import { listUsers } from '#modules/user/controller/user.controller.js';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.GetAllUsers_Name)
    .setDescription(BotCommandInfo.GetAllUsers_Description)
    .addBooleanOption((userId) =>
      userId
        .setName(BotCommandOptionInfo.UserId_Name)
        .setDescription(BotCommandOptionInfo.UserId_Description)
    )
    .addBooleanOption((userChannelId) =>
      userChannelId
        .setName(BotCommandOptionInfo.GetAllUsers_UserChannelIDName)
        .setDescription(
          BotCommandOptionInfo.GetAllUsers_UserChannelIDDescription
        )
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      const includeUserId = interaction.options.getBoolean(BotCommandOptionInfo.UserId_Name) ?? false;
      const includeUserDMMessageId = interaction.options.getBoolean(BotCommandOptionInfo.GetAllUsers_UserChannelIDName) ?? false;

      const options = {
        includeUserId,
        includeUserDMMessageId,
      };
      const users = await listUsers(options, true);

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllUserInformation}`,
        BotAttachmentFileNames.AllUserInformation,
        users
      );

      void sendEphemeralReply(BotDialogs.users.listAllResult, interaction, [
        attachment,
      ]);
    } catch (error) {
      void sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
};
