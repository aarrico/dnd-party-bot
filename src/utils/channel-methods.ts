import { ChannelType } from "discord.js";
import { ExtendedClient } from "../structures/ExtendedClient";

export async function CreateChannel(
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
    // your permission overwrites or other options here
  });

  return createdGuild.id;
}

export async function DeleteChannel(
  client: ExtendedClient,
  channelID: string,
  reason: string = "session expired."
) {
  const guild = await client.guilds.fetch(process.env.GUILD_ID as string);
  const channelToDelete = await guild.channels.fetch(channelID as string);
  if (channelToDelete) guild.channels.delete(channelToDelete, reason);
}
