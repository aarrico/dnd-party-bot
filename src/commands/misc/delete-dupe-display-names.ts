import { Command } from "../../structures/Command";
import { deleteAllUsersWithDisplayName } from "../../db/session";

export default new Command({
  name: "delete-all-by-display-name",
  description: "delete all users with given display name",
  cooldown: 0,
  callBack: async ({ interaction }) => {
    try {
      await deleteAllUsersWithDisplayName("WitterYouDoing");
      interaction.reply("all users of that name deleted.");
    } catch (error) {
      console.log(error);
    }
  },
});
