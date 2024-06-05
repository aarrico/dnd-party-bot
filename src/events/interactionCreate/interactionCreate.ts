import { CommandInteractionOptionResolver } from "discord.js";
import { client } from "../..";
import { Event } from "../../structures/Event";
import { ExtendedInteraction } from "../../typings/Command";

export default new Event("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    await interaction.deferReply();
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return await interaction.followUp("You have used a nonexistent command!");
    }
    command.callBack({
      args: interaction.options as CommandInteractionOptionResolver,
      client,
      interaction: interaction as ExtendedInteraction,
    });
  }
});
