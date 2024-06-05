import { Command } from "../../structures/Command";

export default new Command({
  name: "hey",
  description: "Responds with hello!",
  cooldown: 0,
  callBack: ({ interaction }) => {
    interaction.followUp(`Hello ${interaction.user.username}`);
  },
});
