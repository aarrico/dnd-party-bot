import { ChannelType, Guild, TextChannel } from 'discord.js';
import { client } from '../index';

export const createChannel = async (
  campaign: Guild,
  channelName: string
): Promise<TextChannel> => {
  const session = await campaign.channels.create({
    name: channelName.replace(' ', '-'),
    type: ChannelType.GuildText,
  });

  return session;
};

export const deleteChannel = async (
  channelId: string,
  reason: string = 'session expired.'
) => {
  const channel = await client.channels.fetch(channelId);
  if (channel) {
    await channel.delete(reason);
  }
};

export const renameChannel = async (channelId: string, name: string) => {
  const channel = await client.channels.fetch(channelId);
  if (channel && channel.type === ChannelType.GuildText) {
    await channel.edit({ name: name.replace(' ', '-') });
  }
};
