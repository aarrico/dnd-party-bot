import { ChannelType } from 'discord.js';
import { client } from '../index';

export const createChannel = async (
  guildId: string,
  campaignId: string,
  channelName: string
) => {
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

  return session.id;
};

export const deleteChannel = async (
  guildId: string,
  channelId: string,
  reason: string = 'session expired.'
) => {
  const guild = await client.guilds.fetch(guildId);
  const channelToDelete = await guild.channels.fetch(channelId);
  if (channelToDelete) {
    await guild.channels.delete(channelToDelete, reason);
  }
};

export const renameChannel = async (
  guildId: string,
  channelId: string,
  name: string
) => {
  const guild = await client.guilds.fetch(guildId);
  const channel = await guild.channels.fetch(channelId as string);
  if (channel) {
    await guild.channels.edit(channel, { name: name.replace(' ', '-') });
  }
};
