import { AttachmentBuilder, ButtonInteraction, ChannelType, MessageFlags, MessagePayload, TextChannel } from 'discord.js';
import { ExtendedClient } from '../structures/ExtendedClient.js';
import { client, roleButtons } from '../index.js';
import { ExtendedInteraction } from '../models/Command.js';

import { Session } from '../models/session.js';
import { BotAttachmentFileNames, BotDialogs, BotPaths } from '../utils/botDialogStrings';
import { createChannel } from './channel';
import { getPNGAttachmentBuilder } from '../utils/attachmentBuilders.js';
import { createSessionImage } from '../utils/sessionImage.js';
import { inspect } from 'util';

export const createSessionMessage = async (
  session: Session
) => {
  try {
    const campaignChannel = client.channels.cache.get(session.campaignId);
    if (
      !campaignChannel ||
      campaignChannel.type !== ChannelType.GuildCategory
    ) {
      throw new Error(
        `Couldn't find channel for campaign: ${session.campaignId}`
      );
    }

    await createSessionImage(session.id);

    const attachment = getPNGAttachmentBuilder(
      `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`,
      BotAttachmentFileNames.CurrentSession
    );

    const channel = await client.channels.fetch(session.id);
    if (!channel || !(channel instanceof TextChannel)) {
      throw new Error(`Channel not found or inaccessible: ${session.id}`);
    }

    const sentMessage = await channel.send({
      content: BotDialogs.sessions.scheduled(session.name, session.date),
      files: [attachment],
      components: roleButtons,
    });

    return sentMessage.id;
  } catch (error) {
    console.error(`Error creating session channel:`, inspect(error, { depth: null, colors: true }));
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

  setTimeout(() => {
    void msg.delete();
  }, 1000 * duration);
};

export const sendEphemeralReply = async (
  messageContent: string,
  interaction: ExtendedInteraction,
  files?: AttachmentBuilder[]
) => {
  try {
    if (interaction.replied || interaction.deferred) {
      // If already replied or deferred, use followUp
      return await interaction.followUp({
        content: messageContent,
        files: files ? [...files] : undefined,
        flags: MessageFlags.Ephemeral
      });
    } else {
      // If not replied yet, use reply
      return await interaction.reply({
        content: messageContent,
        files: files ? [...files] : undefined,
        flags: MessageFlags.Ephemeral
      });
    }
  } catch (error) {
    console.error('Error in sendEphemeralReply:', error);
    // If all else fails, try editReply
    try {
      return await interaction.editReply({
        content: messageContent,
        files: files ? [...files] : undefined
      });
    } catch (editError) {
      console.error('Error in editReply fallback:', editError);
      throw editError;
    }
  }
};

export const sendMessageReplyDisappearingMessage = async (
  interaction: ButtonInteraction,
  content: string,
  duration = 10
) => {
  const msg = await interaction.reply({
    content,
    flags: MessageFlags.Ephemeral
  });

  if (duration === -1) {
    return;
  }

  setTimeout(() => {
    void msg.delete();
  }, 1000 * duration);
};
