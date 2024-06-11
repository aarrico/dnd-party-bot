import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import { Command } from "../../structures/Command";
import "dotenv/config";
import DateChecker from "../../utils/dateChecker";
import createSessionMessage from "../../utils/create-session-message";
import { PrismaClient } from "@prisma/client";
import { roles } from "../../../prisma/seed";
import { createNewSession } from "../../utils/prisma-commands";
export default new Command({
  name: "create-session",
  description: "creates a session in the session stack.",
  options: [
    {
      name: "month",
      description: "month of session",
      type: ApplicationCommandOptionType.Number,
      choices: [
        {
          name: "January",
          value: 1,
        },
        {
          name: "February",
          value: 2,
        },
        {
          name: "March",
          value: 3,
        },
        {
          name: "April",
          value: 4,
        },
        {
          name: "May",
          value: 5,
        },
        {
          name: "June",
          value: 6,
        },
        {
          name: "July",
          value: 7,
        },
        {
          name: "August",
          value: 8,
        },
        {
          name: "September",
          value: 9,
        },
        {
          name: "October",
          value: 10,
        },
        {
          name: "November",
          value: 11,
        },
        {
          name: "December",
          value: 12,
        },
      ],
      required: true,
    },
    {
      name: "day",
      description: "Day of session",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "year",
      description: "year of session",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
  ],
  cooldown: 0,
  callBack: ({ client, interaction }) => {
    let messageID: string = "";
    const date = DateChecker(interaction);
    if (date) {
      const message = `Hey there, I have your session scheduled for: ${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`;

      //send to general
      if (process.env.SESSION_CHANNEL_ID) {
        //get session messages channel
        const channel = client.channels.cache.get(
          process.env.SESSION_CHANNEL_ID
        );
        //create actual UI for session
        createSessionMessage(client, process.env.SESSION_CHANNEL_ID).then(
          async (message) => {
            messageID = message as string;
            try {
              const newSessionData = {
                sessionData: {
                  sessionMessageId: messageID,
                  sessionName: "Session 0",
                  sessionDate: date,
                },
                userData: {
                  username: interaction.user.displayName,
                  userChannelId: interaction.user.id,
                },
                interaction,
                messageID,
              };

              await createNewSession(newSessionData);
            } catch (error) {
              console.log(`there was an error: ${error}`);
            }
          }
        );
        if (channel?.type === ChannelType.GuildText) channel?.send(message);
      }

      // console.log(interaction);

      //send to DMs
      const user = client.users.cache.get(interaction.user.id);
      user?.send(message);
      interaction?.followUp(
        "One Moment while I create your session. You will recieve a message via Direct Message when complete!"
      );
    } else {
      interaction?.followUp(
        "The date you entered is invalid. This could be due to the following reasons:\n- You entered a date that doesnt exist.\n- You entered a day that has already passed."
      );
    }
  },
});
