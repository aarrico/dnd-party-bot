import { ChannelType, TextChannel } from 'discord.js';
import { client } from '../index';

export const createChannel = async (
  guildId: string,
  campaignId: string,
  channelName: string
): Promise<TextChannel> => {
  const guild = await client.guilds.fetch(guildId);
  const campaign = await guild.channels.fetch(campaignId);

  if (!campaign) {
    throw new Error('No campaign channel found to host session in!');
  }

  const session = await guild.channels.create({
    name: channelName.replace(' ', '-'),
    type: ChannelType.GuildText,
    parent: campaign.id,
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
  const channel = await client.channels.fetch(channelId as string);
  if (channel && channel.type === ChannelType.GuildText) {
    await channel.edit({ name: name.replace(' ', '-') });
  }
};
