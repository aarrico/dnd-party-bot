import { ApplicationCommandOptionType } from 'discord.js';
import { Command } from '../../structures/Command';
import DateChecker from '../../utils/dateChecker';
import createSessionMessage from '../../utils/create-session-message';
import {
  createSession,
  DeleteSessionMessageId,
  UpdateSessionMessageId,
} from '../../db/session';
import { createSessionImage } from '../../utils/sessionImage';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '../../utils/botDialogStrings';
import { monthOptionChoicesArray } from '../../utils/genericInformation';
import { CreateChannel } from '../../utils/channel-methods';
import { sendEphemeralReply } from '../../utils/send-ephemeral-reply';

export default new Command({
  name: BotCommandInfo.CreateSessionName,
  description: BotCommandInfo.CreateSessionDescription,
  options: [
    {
      name: BotCommandOptionInfo.CreateSession_SessionName,
      description: BotCommandOptionInfo.CreateSession_SessionDescription,
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_MonthName,
      description: BotCommandOptionInfo.CreateSession_MonthDescription,
      type: ApplicationCommandOptionType.Number,
      choices: monthOptionChoicesArray,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_DayName,
      description: BotCommandOptionInfo.CreateSession_DayDescription,
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_YearName,
      description: BotCommandOptionInfo.CreateSession_YearDescription,
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: BotCommandOptionInfo.CreateSession_TimeName,
      description: BotCommandOptionInfo.CreateSession_TimeDescription,
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
      if (process.env.SESSION_CHANNEL_ID) {
        const newChannelId = await CreateChannel(
          client,
          sessionName.replace(' ', '-')
        );
        const messageIDstr = 'messageID';
        const newSessionData = {
          sessionData: {
            messageId: messageIDstr,
            name: sessionName,
            date: date,
            channelId: newChannelId,
          },
          userData: {
            username: interaction.user.displayName,
            userChannelId: interaction.user.id,
          },
          interaction,
          messageID: messageIDstr,
        };

        await DeleteSessionMessageId(messageIDstr);
        await createSession(newSessionData);
        await createSessionImage(client, messageIDstr);

        setTimeout(async () => {
          const messageID = await createSessionMessage(client, newChannelId);
          await UpdateSessionMessageId(messageIDstr, messageID);
        }, 250);

        const message = `${
          BotDialogs.CreateSessionDMSessionTime
        }${date.toLocaleString()}`;
        const user = client.users.cache.get(interaction.user.id);
        user?.send(message);
      }
      //send to DMs
      sendEphemeralReply(BotDialogs.CreateSessionOneMoment, interaction);
    } else {
      sendEphemeralReply(
        BotDialogs.CreateSessionInvalidDateEntered,
        interaction
      );
    }
  },
});
