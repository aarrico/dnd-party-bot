import {
  AttachmentBuilder,
  ChannelType,
  CommandInteractionOptionResolver,
} from "discord.js";
import { client } from "../..";
import { Event } from "../../structures/Event";
import { ExtendedInteraction } from "../../typings/Command";
import path from "path";
import sendChannelDisappearingMessage from "../../utils/send-channel-disappearing-message";
const imageToSend = "./src/utils/Exodia.jpg";

export default new Event("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return await interaction.reply("You have used a nonexistent command!");
    }
    command.callBack({
      args: interaction.options as CommandInteractionOptionResolver,
      client,
      interaction: interaction as ExtendedInteraction,
    });
  } else if (interaction.isButton() && interaction.message) {
    const channel = client?.channels?.cache?.get(
      process.env.SESSION_CHANNEL_ID as string
    );
    if (channel?.type === ChannelType.GuildText) {
      const message = channel?.messages?.cache?.get(interaction.message.id);

      let absolutePath = path.resolve(imageToSend).replace(/\//g, "/");
      const attachment = new AttachmentBuilder(absolutePath, {
        name: "Exodia.jpg",
      });

      message?.edit({
        content: "Hello everyone, we have a new session for people to join!",
        files: [attachment],
      });
    }

    interaction.message.components.forEach((component) => {
      component.components.forEach((subComp: any) => {
        if (subComp.customId === interaction.customId) {
          let sessionPMData = {
            userId: interaction.user.id,
            username: interaction.user.username,
            role: subComp.label,
          };
          sendChannelDisappearingMessage(
            channel,
            {
              content: `Welcome to the Party ${sessionPMData.username}. You have been added as a ${sessionPMData.role}!`,
              ephemeral: true,
            },
            10
          );
          interaction.deferUpdate();
        }
      });
    });
  }
});
