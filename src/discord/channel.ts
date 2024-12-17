import { ChannelType } from 'discord.js';
import { ExtendedClient } from '../structures/ExtendedClient';

export async function createChannel(
  client: ExtendedClient,
  channelName: string
) {
  const guild = await client.guilds.fetch(process.env.GUILD_ID as string);
  const parentChannel = await guild.channels.fetch(
    process.env.SESSION_CATEGORY_CHANNEL_ID as string
  );
  const createdGuild = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: parentChannel?.id,
  });

  return createdGuild.id;
}

export async function deleteChannel(
  client: ExtendedClient,
  channelID: string,
  reason: string = 'session expired.'
) {
  const guild = await client.guilds.fetch(process.env.GUILD_ID as string);
  const channelToDelete = await guild.channels.fetch(channelID as string);
  if (channelToDelete) await guild.channels.delete(channelToDelete, reason);
}

export async function RenameChannel(
  client: ExtendedClient,
  channelID: string,
  name: string
) {
  const guild = await client.guilds.fetch(process.env.GUILD_ID as string);
  const channel = await guild.channels.fetch(channelID as string);
  const newChannelName = name.replace(' ', '-');
  if (channel) await guild.channels.edit(channel, { name: newChannelName });
}
