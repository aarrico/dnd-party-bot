import { AttachmentBuilder, ButtonInteraction, ChannelType, MessageFlags, MessagePayload, TextChannel } from 'discord.js';
import { ExtendedClient } from '../structures/ExtendedClient.js';
import { roleButtons } from '../index.js';
import { ExtendedInteraction } from '../models/Command.js';

import { Session } from '../models/session.js';
import { BotAttachmentFileNames, BotDialogs, BotPaths } from '../utils/botDialogStrings';
import { createChannel } from './channel';
import { getPNGAttachmentBuilder } from '../utils/attachmentBuilders.js';

export const createSessionMessage = async (
  client: ExtendedClient,
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

    const sessionChannel = await createChannel(
      campaignChannel.guildId,
      session.campaignId,
      session.name
    );

    const attachment = getPNGAttachmentBuilder(
      `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
      BotAttachmentFileNames.CurrentSession
    );

    const sentMessage = await sessionChannel.send({
      content: BotDialogs.sessions.scheduled(session.name, session.date),
      files: [attachment],
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
