import { Command } from "../../structures/Command";

export default new Command({
  name: "ping",
  description: "Pong!",

  cooldown: 0,
  callBack({ client, interaction }) {
    interaction.followUp(`Pong! ${client.ws.ping}ms`);
  },
});
