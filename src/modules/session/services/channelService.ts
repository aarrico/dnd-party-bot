import { ChannelType, Guild, TextChannel } from 'discord.js';
import { client } from '#app/index.js';
import {
  safeChannelFetch,
  safeChannelCreate,
  safeChannelDelete,
  safeChannelEdit,
} from '#shared/discord/discordErrorHandler.js';

/**
 * Create a new text channel for a session
 * @param campaign - The guild to create the channel in
 * @param channelName - The name of the channel
 * @returns The created text channel
 */
export const createChannel = async (
  campaign: Guild,
  channelName: string
): Promise<TextChannel> => {
  const session = await safeChannelCreate(campaign, {
    name: channelName.replace(' ', '-'),
    type: ChannelType.GuildText,
  });

  return session;
};

/**
 * Delete a channel by ID
 * @param channelId - The channel ID to delete
 * @param reason - Optional reason for deletion
 */
export const deleteChannel = async (
  channelId: string,
  reason: string = 'session expired.'
) => {
  const channel = await safeChannelFetch(client, channelId);
  if (channel) {
    await safeChannelDelete(channel, reason);
  }
};

/**
 * Rename a channel by ID
 * @param channelId - The channel ID to rename
 * @param name - The new channel name
 */
export const renameChannel = async (channelId: string, name: string) => {
  const channel = await safeChannelFetch(client, channelId);
  if (channel && channel.type === ChannelType.GuildText) {
    await safeChannelEdit(channel, { name: name.replace(' ', '-') });
  }
};
