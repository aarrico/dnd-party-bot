import {
  AttachmentBuilder,
  ButtonInteraction,
  CacheType,
  ChannelType,
  CommandInteractionOptionResolver,
} from "discord.js";
import { client } from "../..";
import { Event } from "../../structures/Event";
import { ExtendedInteraction } from "../../typings/Command";
import path from "path";
import sendMessageReplyDisappearingMessage from "../../utils/send-message-reply-disappearing-message";
import {
  createNewSessionUserInDB,
  createNewUserInDB,
} from "../../utils/prisma-commands";
import "dotenv/config";
import { CreateCompositeImage } from "../../utils/create-composite-session-Image";

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
      addUserToDB(interaction);
      setTimeout(async () => {
        await CreateCompositeImage(client, message?.id as string, interaction);

        const absolutePath = path
          .resolve("./src/resources/images/current-session.png")
          .replace(/\//g, "/");

        const attachment = new AttachmentBuilder(absolutePath, {
          name: `./src/resources/images/current-session.png`,
        });

        message?.edit({
          content: "Hello everyone, we have a new session for people to join!",
          files: [attachment],
        });
      }, 250);
    }
  }
});

function addUserToDB(interaction: ButtonInteraction<CacheType>) {
  interaction.message.components.forEach((component) => {
    component.components.forEach(async (subComp: any) => {
      if (subComp.customId === interaction.customId) {
        let sessionPMData = {
          userId: interaction.user.id,
          username: interaction.user.username,
          role: subComp.label,
        };

        let userData = {
          username: interaction.user.displayName,
          userChannelId: interaction.user.id,
        };
        await createNewUserInDB(userData);
        const actionTaken = await createNewSessionUserInDB(
          interaction,
          interaction.message.id,
          subComp.label
        );

        const messageContent = GetMessageContent(actionTaken, sessionPMData);

        sendMessageReplyDisappearingMessage(
          interaction,
          {
            content: messageContent,
            ephemeral: true,
          },
          10
        );
      }
    });
  });
}

function GetMessageContent(
  actionTaken: string | undefined,
  sessionPMData: { userId: string; username: string; role: any }
) {
  switch (actionTaken) {
    case "created":
      return `Welcome to the Party ${sessionPMData.username}. You have been added as a ${sessionPMData.role}!`;
    case "deleted":
      return `Farewell, ${sessionPMData.username}? You have been removed from the session! To rejoin, click a role button!`;
    case "updated":
      return `Deciding to change the game, ${sessionPMData.username}? You have been changed to a ${sessionPMData.role}!`;
    case "role taken":
      return `Sorry, this role has been taken. You will have to choose another.`;
    case "party full":
      return `Unfortunately, this party is full and no new users can be added at present!`;
    case "Cant Change DM":
      return `You cannot change roles as you are the Dungeon Master!`;
    default:
      return "No Action was taken. Something went wrong";
  }
}
