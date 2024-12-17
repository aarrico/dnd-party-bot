import { ApplicationCommandOptionType } from 'discord.js';
import { monthOptionChoicesArray } from '../../utils/genericInformation';
import { Command } from '../../structures/Command';
import { GetSessionById, UpdateSession } from '../../db/session';
import DateChecker from '../../utils/dateChecker';
import { createSessionImage } from '../../utils/sessionImage';
import { getPNGAttachmentBuilder } from '../../utils/attachmentBuilders';
import {
  BotAttachmentFileNames,
  BotDialogs,
  BotPaths,
} from '../../utils/botDialogStrings';
import { sendEphemeralReply } from '../../discord/send-ephemeral-reply';
import { RenameChannel } from '../../discord/channel';

export default new Command({
  name: 'modify-session',
  description:
    'Makes changes to existing session. Also updates photos to reflect changes.',
  options: [
    {
      name: 'session-id',
      description: 'uuid of session you want to modify',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'new-session-name',
      description: 'New proposed session name',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'month',
      description: 'New proposed session month',
      choices: monthOptionChoicesArray,
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: 'day',
      description: 'New proposed session day',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: 'year',
      description: 'New proposed session year',
      type: ApplicationCommandOptionType.Number,
      required: true,
    },
    {
      name: 'time',
      description: 'New proposed session time Format: HH:MM\nEX:23:59',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  cooldown: 0,
  callBack: async ({ client, interaction }) => {
    try {
      const sessionID = interaction?.options?.get('session-id')
        ?.value as string;
      const newSessionName = interaction?.options?.get('new-session-name')
        ?.value as string;
      const newProposedDate = DateChecker(interaction);

      //get session by uuid
      const existingSession = await GetSessionById(sessionID);

      if (newProposedDate && newSessionName) {
        if (
          !existingSession?.name?.match(newSessionName) ||
          !existingSession?.date
            .toUTCString()
            .match(newProposedDate?.toUTCString())
        ) {
          if (!existingSession?.name?.match(newSessionName)) {
            await RenameChannel(
              client,
              existingSession.channelId,
              newSessionName
            );
          }
          await UpdateSession(sessionID, {
            name: newSessionName,
            date: newProposedDate,
            messageId: existingSession.messageId,
            channelId: existingSession.channelId,
          });
          setTimeout(async () => {
            await createSessionImage(client, existingSession.messageId);

            const attachment = getPNGAttachmentBuilder(
              `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
              BotAttachmentFileNames.CurrentSession
            );

            const channel = await client.channels.fetch(
              existingSession.channelId as string
            );
            if (channel?.isTextBased()) {
              const message = await channel?.messages.fetch(
                existingSession.messageId
              );
              message?.edit({
                content: BotDialogs.InteractionCreate_HereIsANewSessionMessage,
                files: [attachment],
              });
            }
          }, 250);

          sendEphemeralReply(
            'Session has been updated successfully. I will generate a new image for that message now. Please give it a few seconds to update it.',
            interaction
          );
        } else {
          sendEphemeralReply(
            'You have entered in data that would completely match the existing session data.',
            interaction
          );
        }
      }
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
});
