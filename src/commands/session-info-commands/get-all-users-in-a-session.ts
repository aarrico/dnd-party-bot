import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import {
  GetSessionByID,
  GetUsersBySessionID,
} from "../../utils/prisma-commands";
import { writeFileSync } from "fs";
import path from "path";

export default new Command({
  name: "get-all-users-in-a-session",
  description:
    "Retrieves a list of all users in a particular session via Session UUID string added to db by bot.",
  cooldown: 0,
  options: [
    {
      name: "session-id",
      description: "UUID of session in DB(unique identifier)",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "user-id",
      description: "UUID of user in DB(unique identifier)",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "user-role-in-this-session",
      description: "discord message id for session",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "user-channel-id",
      description: "User DM channel id",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      if (!interaction.member.permissions.has("Administrator")) {
        interaction.reply("Only Admins can run this command!");
        return;
      }
      const sessionID = interaction?.options?.get("session-id")
        ?.value as string;
      const sessionUsers = await GetUsersBySessionID(sessionID);

      const addUserID = interaction?.options?.get("user-id")?.value as boolean;
      const addUserRoleInThisSession = interaction?.options?.get(
        "user-role-in-this-session"
      )?.value as boolean;
      const addUserDMMessageID = interaction?.options?.get("user-channel-id")
        ?.value as boolean;

      let list: string = `User List for ${
        (await GetSessionByID(sessionID)).sessionName
      }:\nFormat:\n\nUsername`;
      if (addUserRoleInThisSession) list = list.concat(` : User Role`);
      if (addUserID) list = list.concat(` : User ID`);
      if (addUserDMMessageID) list = list.concat(` : User DM Message ID`);
      list = list.concat(`\n`);

      sessionUsers.sort().forEach((user) => {
        list = list.concat(`${user.user.username}`);
        if (addUserID) list = list.concat(` : ${user.user.id}`);
        if (addUserRoleInThisSession) list = list.concat(` : ${user.role}`);
        if (addUserDMMessageID)
          list = list.concat(` : ${user.user.userChannelId}`);
        list = list.concat(`\n`);
      });

      writeFileSync(
        "./src/resources/temp/AllUsersInSessionInformation.txt",
        list,
        {
          flag: "w",
        }
      );

      const attachment = new AttachmentBuilder(
        path
          .resolve("./src/resources/temp/AllUsersInSessionInformation.txt")
          .replace(/\//g, "/"),
        {
          name: "AllUsersInSessionInformation.txt",
        }
      );

      interaction.reply({
        content: "Here is the list of Users in this session.",
        files: [attachment],
        ephemeral: true,
      });
    } catch (error) {
      console.log(error);
    }
  },
});
