import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";
import { GetUsersBySessionID } from "../../utils/prisma-commands";

export default new Command({
  name: "get-all-users-in-a-session",
  description:
    "Retrieves a list of all users in a particular session via id string added to db by bot.",
  cooldown: 0,
  options: [
    {
      name: "session",
      description: "Session to display list of users.",
      type: ApplicationCommandOptionType.String,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      const sessionUsers = await GetUsersBySessionID(
        interaction?.options?.get("session")?.value as string
      );
      let list: string = "";
      sessionUsers.forEach((user) => {
        list = list.concat(`${user.user.username}\n`);
      });
      interaction.reply(list);
    } catch (error) {
      console.log(error);
    }
  },
});
