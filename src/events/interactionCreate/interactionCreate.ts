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
import sendChannelDisappearingMessage from "../../utils/send-channel-disappearing-message";
import sendMessageReplyDisappearingMessage from "../../utils/send-message-reply-disappearing-message";
import {
  createNewSessionUserInDB,
  createNewUserInDB,
  getUsersByMessageID,
} from "../../utils/prisma-commands";
import Jimp from "jimp";
import "dotenv/config";
import { roles } from "../../../prisma/seed";
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
      addUserToDB(interaction);
      setTimeout(() => {
        CreateCompositeImage(message);
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

async function CreateCompositeImage(message: any) {
  const userImageData = await GetUserImageData(message.id);

  //creates a promise to handle the jimps
  await Promise.all(userImageData)
    .then(async (userData) => {
      let baseImage = await Jimp.read(baseSessionImage);
      const xValues = [365, 795, 1225, 1655, 2085];
      let spotValue = 0;
      for (var i = 0; i < userData.length; i++) {
        // console.log(userData);
        const image = await Jimp.read(userData[i].userAvatarURL);
        if (userData[i].role === roles.DM) {
          // console.log("yorgy!");
          baseImage.composite(image.resize(300, 300), 1210, 400); //DM spot
        } else {
          // console.log(spotValue, " ", xValues[spotValue]);
          baseImage.composite(image.resize(300, 300), xValues[spotValue], 1700);
          spotValue++;
        }
      }
      //this saves our modified image
      await baseImage.write(`./src/resources/images/current-session.png`);
    })
    .finally(() => {
      const absolutePath = path
        .resolve("./src/resources/images/current-session.png")
        .replace(/\//g, "/");

      console.log("Yorgy");
      const attachment = new AttachmentBuilder(absolutePath, {
        name: `./src/resources/images/current-session.png`,
      });

      console.log("Shmorgy");
      message?.edit({
        content: "Hello everyone, we have a new session for people to join!",
        files: [attachment],
      });
    });
}

async function GetUserImageData(messageId: string) {
  const usersInThisSession = await getUsersByMessageID(messageId);

  const guildMembers = await (
    await client.guilds?.fetch(`${process.env.GUILD_ID}`)
  ).members.fetch();

  let sessionMemberData: {
    userAvatarURL: string;
    username: string;
    role: string;
  }[] = [];

  guildMembers.forEach((member) => {
    const matchingUser: any = usersInThisSession.find(
      (user) => user.user.userChannelId === member.id
    );
    const memberImageURL: any = member.displayAvatarURL({
      extension: "png",
      forceStatic: true,
    });

    if (matchingUser && memberImageURL) {
      sessionMemberData = [
        ...sessionMemberData,
        {
          userAvatarURL: memberImageURL,
          username: matchingUser?.user?.username as string,
          role: matchingUser?.role as string,
        },
      ];
    }
  });

  return sessionMemberData;
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
