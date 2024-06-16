import { Command } from "../../structures/Command";
import { GetAllSessions, GetAllUsers } from "../../utils/prisma-commands";

export default new Command({
  name: "get-all-sessions",
  description: "Retrieves a list of all sessions added to db by bot.",
  cooldown: 0,
  callBack: async ({ interaction }) => {
    try {
      const sessions = await GetAllSessions();
      let list: string = "";

      sessions.forEach((session) => {
        list = list.concat(`${session.sessionName}:${session.id}\n`);
      });
      interaction.reply(list);
    } catch (error) {
      console.log(error);
    }
  },
});
