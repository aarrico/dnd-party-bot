import { Command } from "../../structures/Command";
import { DeleteAllUsersWithDisplayName } from "../../utils/prisma-commands";

export default new Command({
  name: "delete-all-by-display-name",
  description: "delete all users with given display name",
  cooldown: 0,
  callBack: async ({ interaction }) => {
    try {
      await DeleteAllUsersWithDisplayName("WitterYouDoing");
      interaction.reply("all users of that name deleted.");
    } catch (error) {
      console.log(error);
    }
  },
});
