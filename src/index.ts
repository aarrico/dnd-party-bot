import "dotenv/config";

import {
  Client,
  IntentsBitField,
  AttachmentBuilder,
  ChannelType,
} from "discord.js";
import eventHandler from "./handlers/eventHandler";
import path from "path";
const imageToSend = "./src/utils/Exodia.jpg";
import sendChannelDisappearingMessage from "./utils/send-channel-disappearing-message";
import { ExtendedClient } from "./structures/ExtendedClient";

export const client = new ExtendedClient();

export let sessionStack = {
  sessions: [{}],
};

// client.on("ready", (c) => {
//   let sessionStack = {
//     sessions: [{}],
//   };

//   console.log(sessionStack);
// });

// client.on("interactionCreate", async (interaction) => {
//   if (!interaction.isButton()) return;
//   const channel = client?.channels?.cache?.get(
//     process.env.SESSION_CHANNEL_ID as string
//   );
//   if (channel?.type === ChannelType.GuildText) {
//     const message = channel?.messages?.cache?.get(interaction.message.id);

//     let absolutePath = path.resolve(imageToSend).replace(/\//g, "/");
//     const attachment = new AttachmentBuilder(absolutePath, {
//       name: "Exodia.jpg",
//     });

//     message?.edit({
//       content: "Hello everyone, we have a new session for people to join!",
//       files: [attachment],
//     });
//   }

//   interaction.message.components.forEach((component) => {
//     console.log(component);
//     component.components.forEach((subComp: any) => {
//       if (subComp.customId === interaction.customId) {
//         let sessionPMData = {
//           userId: interaction.user.id,
//           username: interaction.user.username,
//           role: subComp.label,
//         };

//         sendChannelDisappearingMessage(
//           interaction,
//           {
//             content: `Welcome to the Party ${sessionPMData.username}. You have been added as a ${sessionPMData.role}!`,
//             ephemeral: true,
//           },
//           10
//         );
//       }
//     });
//   });
// });

// eventHandler(client);

client.start();
