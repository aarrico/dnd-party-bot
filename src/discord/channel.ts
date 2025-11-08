import { ChannelType, Guild, TextChannel } from 'discord.js';
import { client } from '@app/index.js';
import {
  safeChannelFetch,
  safeChannelCreate,
  safeChannelDelete,
  safeChannelEdit,
} from '@shared/discord/discordErrorHandler.js';

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

export const deleteChannel = async (
  channelId: string,
  reason: string = 'session expired.'
) => {
  const channel = await safeChannelFetch(client, channelId);
  if (channel) {
    await safeChannelDelete(channel, reason);
  }
};

export const renameChannel = async (channelId: string, name: string) => {
  const channel = await safeChannelFetch(client, channelId);
  if (channel && channel.type === ChannelType.GuildText) {
    await safeChannelEdit(channel, { name: name.replace(' ', '-') });
  }
};
