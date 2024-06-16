import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";
import { GetAllSessionsAUserIsIn } from "../../utils/prisma-commands";

export default new Command({
  name: "get-all-sessions-a-user-is-in",
  description:
    "Retrieves a list of all sessions that a user has signed up for from the db.",
  cooldown: 0,
  options: [
    {
      name: "user",
      description: "User that you are finding the session for.",
      type: ApplicationCommandOptionType.String,
      //   choices: (await getCommandChoices()) as any,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      const sessions = await GetAllSessionsAUserIsIn(
        interaction?.options?.get("user")?.value as string
      );
      let list: string = "";
      sessions.forEach((session) => {
        list = list.concat(`${session.session.sessionName}\n`);
      });

      interaction.reply(list);
    } catch (error) {
      console.log(error);
    }
  },
});
