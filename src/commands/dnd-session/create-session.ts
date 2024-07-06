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
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from "../../utils/botDialogStrings";
import { monthOptionChoicesArray } from "../../utils/genericInformation";

export default new Command({
  name: BotCommandInfo.CreateSessionName,
  description: BotCommandInfo.CreateSessionDescription,
  options: [
    {
      name: BotCommandOptionInfo.CreateSession_SessionName,
      description: BotCommandOptionInfo.CreateSession_SessionNameDescription,
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_MonthName,
      description: BotCommandOptionInfo.CreateSession_MonthNameDescription,
      type: ApplicationCommandOptionType.Number,
      choices: monthOptionChoicesArray,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_DayName,
      description: BotCommandOptionInfo.CreateSession_DayNameDescription,
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_YearName,
      description: BotCommandOptionInfo.CreateSession_YearNameDescription,
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_TimeName,
      description: BotCommandOptionInfo.CreateSession_TimeNameDescription,
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  cooldown: 0,
  callBack: async ({ client, interaction }) => {
    const sessionName =
      //maybe pass this into the argument to post the right name
      interaction?.options?.get(BotCommandOptionInfo.CreateSession_SessionName)
        ?.value as string;
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
