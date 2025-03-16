import {
  AttachmentBuilder,
  ButtonInteraction,
  ChannelType,
  MessagePayload,
  TextChannel,
} from 'discord.js';
import { ExtendedClient } from '../structures/ExtendedClient';
import { roleButtons } from '../index';
import { ExtendedInteraction } from '../typings/Command';

import { Session } from '../typings/session';
import { BotDialogs } from '../utils/botDialogStrings';

export const createSessionMessage = async (
  client: ExtendedClient,
  session: Session
) => {
  try {
    const channel = client.channels.cache.get(session.campaignId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Couldn't find text channel ${session.campaignId}`);
    }

    // const attachment = getPNGAttachmentBuilder(
    //   `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
    //   BotAttachmentFileNames.CurrentSession
    // );
    // content: `🎉 New session - ${session.name} has been scheduled for ${session.date}! Choose a role below 🧙`,

    const sentMessage = await channel.send({
      content: BotDialogs.sessions.scheduled(session.name, session.date),
      //files: [attachment],
      components: roleButtons,
    });

    return sentMessage.id;
  } catch (error) {
    return `error caught: ${error}`;
  }
};

export const sendChannelDisappearingMessage = async (
  channel: TextChannel,
  messageContentPayload: MessagePayload,
  duration = 10
) => {
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const msg = await channel.send(messageContentPayload);
  if (duration === -1) {
    return;
  }

  setTimeout(async () => {
    await msg.delete();
  }, 1000 * duration);
};

export const sendEphemeralReply = (
  messageContent: string,
  interaction: ExtendedInteraction,
  files?: AttachmentBuilder[]
) =>
  interaction.reply({
    content: messageContent,
    files: files ? [...files] : undefined,
    ephemeral: true,
  });

export const sendMessageReplyDisappearingMessage = async (
  interaction: ButtonInteraction,
  content: string,
  duration = 10
) => {
  const msg = await interaction.reply({
    content,
    ephemeral: true,
  });

  if (duration === -1) {
    return;
  }

  setTimeout(async () => {
    await msg.delete();
  }, 1000 * duration);
};
