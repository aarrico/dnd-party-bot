import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import { Command } from "../../structures/Command";
import "dotenv/config";
import DateChecker from "../../utils/dateChecker";
import createSessionMessage from "../../utils/create-session-message";
import {
  DeleteSessionMessageID,
  UpdateSessionMessageID,
  createNewSession,
} from "../../utils/prisma-commands";
import { CreateCompositeImage } from "../../utils/create-composite-session-Image";
import { BotDialogs } from "../../utils/botDialogStrings";
export default new Command({
  name: "create-session",
  description: "creates a session in the session stack.",
  options: [
    {
      name: "session-name",
      description: "Name of session",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
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
      description: "Year of session",
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: "time",
      description: "Time that session will take place Format:HH:MM",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  cooldown: 0,
  callBack: async ({ client, interaction }) => {
    const sessionName =
      //maybe pass this into the argument to post the right name
      interaction?.options?.get("session-name")?.value as string;
    if (!sessionName)
      interaction.reply(BotDialogs.CreateSessionInvalidSessionName);

    const date = DateChecker(interaction);
    if (date) {
      const message = `${BotDialogs.CreateSessionDMSessionTime}${
        date.getMonth() + 1
      }/${date.getDate()}/${date.getFullYear()}`;

      if (process.env.SESSION_CHANNEL_ID) {
        const channel = client.channels.cache.get(
          process.env.SESSION_CHANNEL_ID
        );

        const messageIDstr = "messageID";
        const newSessionData = {
          sessionData: {
            sessionMessageId: messageIDstr,
            sessionName: sessionName,
            sessionDate: date,
          },
          userData: {
            username: interaction.user.displayName,
            userChannelId: interaction.user.id,
          },
          interaction,
          messageID: messageIDstr,
        };
        await DeleteSessionMessageID(messageIDstr);
        await createNewSession(newSessionData);

        //create actual UI for session
        await CreateCompositeImage(client, messageIDstr);

        setTimeout(async () => {
          const messageID = await createSessionMessage(
            client,
            process.env.SESSION_CHANNEL_ID
          );
          await UpdateSessionMessageID(messageIDstr, messageID);
        }, 250);

        if (channel?.type === ChannelType.GuildText) channel?.send(message);
      }

      //send to DMs
      const user = client.users.cache.get(interaction.user.id);
      user?.send(message);
      interaction?.reply(BotDialogs.CreateSessionOneMoment);
    } else {
      interaction?.reply(BotDialogs.CreateSessionInvalidDateEntered);
    }
  },
});
