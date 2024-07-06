import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import { GetAllUsers } from "../../utils/prisma-commands";
import { writeFileSync } from "fs";
import path from "path";

export default new Command({
  name: "get-all-users",
  description: "Retrieves a list of all users added to db by bot.",
  cooldown: 0,
  options: [
    {
      name: "user-id",
      description: "UUID of user in DB(unique identifier)",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "user-dm-channel-id",
      description: "User DM channel id",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      const addUserID = interaction?.options?.get("user-id")?.value as boolean;
      const addUserDMMessageID = interaction?.options?.get("user-dm-channel-id")
        ?.value as boolean;
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

      writeFileSync("./src/resources/temp/AllUserInformation.txt", list, {
        flag: "w",
      });

      const attachment = new AttachmentBuilder(
        path
          .resolve("./src/resources/temp/AllUserInformation.txt")
          .replace(/\//g, "/"),
        {
          name: "User_Info.txt",
        }
      );

      interaction.reply({
        content: "Here is the list of Users you currently have on file.",
        files: [attachment],
      });
    } catch (error) {
      console.log(error);
    }
  },
});
