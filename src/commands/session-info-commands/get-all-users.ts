import { Command } from "../../structures/Command";
import { GetAllUsers } from "../../utils/prisma-commands";

export default new Command({
  name: "get-all-users",
  description: "Retrieves a list of all users added to db by bot.",
  cooldown: 0,
  callBack: async ({ interaction }) => {
    try {
      const users = await GetAllUsers();
      let list: string = "";

      users.forEach((user) => {
        list = list.concat(`${user.username}:${user.id}\n`);
      });
      interaction.reply(list);
    } catch (error) {
      console.log(error);
    }
  },
});
