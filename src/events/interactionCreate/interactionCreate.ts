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
import sendMessageReplyDisappearingMessage from "../../utils/send-message-reply-disappearing-message";
import {
  createNewSessionUserInDB,
  createNewUserInDB,
  getUsersByMessageID,
} from "../../utils/prisma-commands";
import Jimp from "jimp";
import "dotenv/config";
const baseSessionImage = "./src/utils/TW_ui_menu_backplate.png";
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

      const userImg = interaction.user.displayAvatarURL({
        extension: "png",
        forceStatic: true,
      });

      const absolutePath = path.resolve(imageToSend).replace(/\//g, "/");
      const attachment = new AttachmentBuilder(absolutePath, {
        name: "Exodia.jpg",
      });

      let images = [baseSessionImage, userImg];
      let jimps = [];

      //turns the images into readable variables for jimp, then pushes them into a new array
      for (var i = 0; i < images.length; i++) {
        jimps.push(Jimp.read(images[i]));
      }

      //get users
      const usersInThisSession = await getUsersByMessageID(
        interaction.message.id
      );

      const guildMembers = await (
        await client.guilds?.fetch(`${process.env.GUILD_ID}`)
      ).members.fetch();

      guildMembers.forEach((member) => {
        member.displayAvatarURL();
      });
      //get all users avatars

      //store avatar photo to jimps, make sure
      //then do jimps stuff

      //creates a promise to handle the jimps
      await Promise.all(jimps).then(async (data) => {
        // --- THIS IS WHERE YOU MODIFY THE IMAGES --- \\
        data[0].composite(data[1].resize(300, 300), 1210, 400); //DM spot
        data[0].composite(data[1].resize(300, 300), 365, 1700); //spot 1 for PMs
        data[0].composite(data[1].resize(300, 300), 795, 1700); //spot 2 for PMs
        data[0].composite(data[1].resize(300, 300), 1225, 1700); //spot 3 for PMs
        data[0].composite(data[1].resize(300, 300), 1655, 1700); //spot 4 for PMs
        data[0].composite(data[1].resize(300, 300), 2085, 1700); //spot 5 for PMs

        //this saves our modified image
        data[0].write(`./src/resources/images/current-session.png`);
      });

      // const absolutePath = path.resolve(imageToSend).replace(/\//g, "/");
      // const attachment = new AttachmentBuilder(absolutePath, {
      //   name: `./src/resources/images/current-session.png`,
      // });

      message?.edit({
        content: "Hello everyone, we have a new session for people to join!",
        files: [attachment],
      });
    }

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
});
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
