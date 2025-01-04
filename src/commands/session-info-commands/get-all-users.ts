import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";
import { getAllUsers } from "../../db/session";
import { getTxtAttachmentBuilder } from "../../utils/attachmentBuilders";
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from "../../utils/botDialogStrings";

import {sendEphemeralReply} from "../../discord/message";

export default new Command({
  name: BotCommandInfo.GetAllUsers_Name,
  description: BotCommandInfo.GetAllUsers_Description,
  cooldown: 0,
  options: [
    {
      name: BotCommandOptionInfo.UserId_Name,
      description: BotCommandOptionInfo.UserId_Description,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllUsers_UserChannelIDName,
      description: BotCommandOptionInfo.GetAllUsers_UserChannelIDDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      const addUserID = interaction?.options?.get(
        BotCommandOptionInfo.UserId_Name
      )?.value as boolean;
      const addUserDMMessageID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsers_UserChannelIDName
      )?.value as boolean;
      const users = await getAllUsers();

      let list: string = "User List:\nFormat:\n\nUser Name";

      if (addUserID) list = list.concat(` : User ID`);
      if (addUserDMMessageID) list = list.concat(` : User DM Message ID`);
      list = list.concat(`\n`);

      users.forEach((user) => {
        list = list.concat(`${user.username}`);
        if (addUserID) list = list.concat(` : ${user.id}`);
        if (addUserDMMessageID) list = list.concat(` : ${user.userChannelId}`);
        list = list.concat(`\n`);
      });

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllUserInformation}`,
        BotAttachmentFileNames.AllUserInformation,
        list
      );

      sendEphemeralReply(BotDialogs.GetAllUsers_HereIsTheList, interaction, [
        attachment,
      ]);
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
});
