import { SlashCommandBuilder } from 'discord.js';
import { listUsers } from '../../controllers/users';
import { getTxtAttachmentBuilder } from '../../utils/attachmentBuilders';
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '../../utils/botDialogStrings';
import { ExtendedInteraction } from '../../typings/Command';

import { sendEphemeralReply } from '../../discord/message';

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
      const includeUserId = interaction?.options?.get(
        BotCommandOptionInfo.UserId_Name
      )?.value as boolean;
      const includeUserDMMessageId = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsers_UserChannelIDName
      )?.value as boolean;

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

      sendEphemeralReply(BotDialogs.GetAllUsers_HereIsTheList, interaction, [
        attachment,
      ]);
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
};
