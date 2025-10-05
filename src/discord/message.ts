import { AttachmentBuilder, ButtonInteraction, ChannelType, MessageFlags, MessagePayload, TextChannel, ActionRowBuilder, ButtonBuilder } from 'discord.js';
import { client, roleButtons } from '../index.js';
import { ExtendedInteraction } from '../models/Command.js';
import { SessionStatus } from '@prisma/client';

import { Session } from '../models/session.js';
import { BotAttachmentFileNames, BotDialogs, BotPaths } from '../utils/botDialogStrings';
import { getImgAttachmentBuilder } from '../utils/attachmentBuilders.js';
import { createSessionImage } from '../utils/sessionImage.js';

/**
 * Get role buttons for session based on status
 * Only sessions with SCHEDULED status allow role selection
 */
export const getRoleButtonsForSession = (sessionStatus?: SessionStatus | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'): ActionRowBuilder<ButtonBuilder>[] => {
  return sessionStatus === SessionStatus.SCHEDULED ? roleButtons : [];
};

export const sendNewSessionMessage = async (
  session: Session,
  channel: TextChannel,
) => {
  console.log(`Sending new session message for session: ${session.id}`);

  try {
    console.log(`Creating session image...`);
    await createSessionImage(session.id);

    const imagePath = `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`;
    console.log(`Attempting to attach image from: ${imagePath}`);

    // Check if the file exists before trying to attach it
    const fs = await import('fs');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at: ${imagePath}`);
    }

    const stats = fs.statSync(imagePath);
    console.log(`Image file found. Size: ${stats.size} bytes`);

    const attachment = getImgAttachmentBuilder(
      imagePath,
      BotAttachmentFileNames.CurrentSession
    );

    console.log(`Sending message with image to channel: ${channel.id}`);
    const sentMessage = await channel.send({
      content: BotDialogs.sessions.scheduled(session.name, session.date, session.timezone ?? 'America/Los_Angeles'),
      files: [attachment],
      components: getRoleButtonsForSession(session.status),
    });

    console.log(`Message sent successfully with ID: ${sentMessage.id}`);
    return sentMessage.id;
  } catch (error) {
    console.error(`Error creating session image, falling back to message without image:`, error);

    // Fallback: send message without image
    try {
      console.log(`Sending fallback message without image to channel: ${channel.id}`);
      const sentMessage = await channel.send({
        content: BotDialogs.sessions.scheduled(session.name, session.date, session.timezone ?? 'America/Los_Angeles'),
        components: getRoleButtonsForSession(session.status),
      });

      console.log(`Fallback message sent successfully with ID: ${sentMessage.id}`);
      return sentMessage.id;
    } catch (fallbackError) {
      console.error(`Failed to send fallback message:`, fallbackError);
      throw fallbackError;
    }
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

export const notifyGuild = async (
  guildId: string,
  messageFormatter: (userId: string) => Promise<string>
) => {
  const guild = await client.guilds.fetch(guildId);
  if (!guild) {
    throw new Error(`Guild with ID ${guildId} not found`);
  }
  const users = (await guild.members.fetch()).map(member => { if (!member.user.bot) return member.user; }).filter(user => user !== undefined);
  await Promise.allSettled(users.map(async user => {
    const formattedMessage = await messageFormatter(user.id);
    return user.send({
      content: formattedMessage,
    });
  }));
};