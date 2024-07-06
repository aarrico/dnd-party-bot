import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";
import { GetAllUsers } from "../../utils/prisma-commands";
import { getTxtAttachmentBuilder } from "../../utils/attachmentBuilders";
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from "../../utils/botDialogStrings";

export default new Command({
  name: BotCommandInfo.GetAllUsers_Name,
  description: BotCommandInfo.GetAllUsers_Description,
  cooldown: 0,
  options: [
    {
      name: BotCommandOptionInfo.GetAllUsers_UserIDName,
      description: BotCommandOptionInfo.GetAllUsers_UserIDDescription,
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
        BotCommandOptionInfo.GetAllUsers_UserIDName
      )?.value as boolean;
      const addUserDMMessageID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsers_UserChannelIDName
      )?.value as boolean;
      const users = await GetAllUsers();

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

      interaction.reply({
        content: BotDialogs.GetAllUsers_HereIsTheList,
        files: [attachment],
        ephemeral: true,
      });
    } catch (error) {
      console.log(error);
    }
  },
});
