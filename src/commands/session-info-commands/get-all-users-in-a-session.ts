import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";
import {
  GetSessionById,
  GetPartyForSession,
} from "../../utils/prisma-commands";
import { getTxtAttachmentBuilder } from "../../utils/attachmentBuilders";
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from "../../utils/botDialogStrings";
import { sendEphemeralReply } from "../../utils/send-ephemeral-reply";

export default new Command({
  name: BotCommandInfo.GetAllUsersInASession_Name,
  description: BotCommandInfo.GetAllUsersInASession_Description,
  cooldown: 0,
  options: [
    {
      name: BotCommandOptionInfo.GetAllUsersInASession_SessionIDName,
      description:
        BotCommandOptionInfo.GetAllUsersInASession_SessionIDDescription,
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: BotCommandOptionInfo.GetAllUsersInASession_UserIDName,
      description: BotCommandOptionInfo.GetAllUsersInASession_UserIDDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllUsersInASession_UserRoleName,
      description:
        BotCommandOptionInfo.GetAllUsersInASession_UserRoleDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllUsersInASession_UserChannelIDName,
      description:
        BotCommandOptionInfo.GetAllUsersInASession_UserChannelIDDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      if (!interaction.member.permissions.has("Administrator")) {
        interaction.reply("Only Admins can run this command!");
        return;
      }
      const sessionID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsersInASession_SessionIDName
      )?.value as string;

      const addUserID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsersInASession_UserIDName
      )?.value as boolean;
      const addUserRoleInThisSession = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsersInASession_UserRoleName
      )?.value as boolean;
      const addUserDMMessageID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUsersInASession_UserChannelIDName
      )?.value as boolean;

      let list: string = `User List for ${
        (await GetSessionById(sessionID)).name
      }:\nFormat:\n\nUsername`;
      if (addUserRoleInThisSession) list = list.concat(` : User Role`);
      if (addUserID) list = list.concat(` : User ID`);
      if (addUserDMMessageID) list = list.concat(` : User DM Message ID`);
      list = list.concat(`\n`);

      const party = await GetPartyForSession(sessionID, true);
      party.forEach((user) => {
        list = list.concat(`${user.user.username}`);
        if (addUserRoleInThisSession) list = list.concat(` : ${user.role}`);
        if (addUserID) list = list.concat(` : ${user.user.id}`);
        if (addUserDMMessageID)
          list = list.concat(` : ${user.user.userChannelId}`);
        list = list.concat(`\n`);
      });

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllUsersInSessionInformation}`,
        BotAttachmentFileNames.AllUsersInSessionInformation,
        list
      );

      sendEphemeralReply(
        BotDialogs.GetAllUsersInASession_HereIsTheList,
        interaction,
        [attachment]
      );
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
});
