import {
  AttachmentBuilder,
  ButtonInteraction,
  ChannelType,
  MessageFlags,
  MessagePayload,
  TextChannel
} from 'discord.js';
import { client } from '#app/index.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import {
  safeGuildFetch,
  safeGuildMembersFetch,
  safeUserSend,
} from '#shared/discord/discordErrorHandler.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('DiscordMessages');

/**
 * Send a disappearing message to a channel
 * @param channel - The text channel to send to
 * @param messageContentPayload - The message payload
 * @param duration - Duration in seconds before deletion (-1 for permanent)
 */
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

/**
 * Send an ephemeral reply to an interaction
 * Handles various interaction states (replied, deferred, etc.)
 * @param messageContent - The message content
 * @param interaction - The interaction to reply to
 * @param files - Optional file attachments
 */
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
    logger.error('Error in sendEphemeralReply', { error });
    // If all else fails, try editReply
    try {
      return await interaction.editReply({
        content: messageContent,
        files: files ? [...files] : undefined
      });
    } catch (editError) {
      logger.error('Error in editReply fallback', { error: editError });
      throw editError;
    }
  }
};

/**
 * Send a disappearing reply to a button interaction
 * @param interaction - The button interaction
 * @param content - The message content
 * @param duration - Duration in seconds before deletion (-1 for permanent)
 */
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

/**
 * Send a direct message to all non-bot members in a guild
 * @param guildId - The guild ID
 * @param messageFormatter - Function to format the message for each user
 */
export const notifyGuild = async (
  guildId: string,
  messageFormatter: (userId: string) => Promise<string>
) => {
  const guild = await safeGuildFetch(client, guildId);
  if (!guild) {
    throw new Error(`Guild with ID ${guildId} not found`);
  }
  const members = await safeGuildMembersFetch(guild);
  const users = Array.from(members.values())
    .map(member => { if (!member.user.bot) return member.user; })
    .filter(user => user !== undefined);

  await Promise.allSettled(users.map(async user => {
    try {
      const formattedMessage = await messageFormatter(user.id);
      return await safeUserSend(user, {
        content: formattedMessage,
      });
    } catch (error) {
      logger.warn('Failed to send DM to user', { userId: user.id, error });
      return null;
    }
  }));
};

export const notifyParty = async (
  partyMemberIds: string[],
  messageFormatter: (userId: string) => Promise<string>
) => {
  await Promise.allSettled(partyMemberIds.map(async userId => {
    try {
      const formattedMessage = await messageFormatter(userId);
      const user = await client.users.fetch(userId);
      return await safeUserSend(user, {
        content: formattedMessage,
      });
    } catch (error) {
      logger.warn('Failed to send DM to party member', { userId, error });
      return null;
    }
  }));
};
