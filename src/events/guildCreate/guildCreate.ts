import { Events, Guild } from 'discord.js';
import { Event } from '@shared/discord/Event.js';
import { ExtendedClient } from '@shared/discord/ExtendedClient.js';
import { upsertGuild } from '@modules/guild/repository/guild.repository.js';

export default new Event(Events.GuildCreate, async (guild: Guild) => {
  const client = guild.client as ExtendedClient;

  console.log(`Bot joined new guild: ${guild.name} (${guild.id})`);

  try {
    // Register commands to this guild immediately for instant availability
    await client.registerCommandsToGuild(guild.id);

    // Create the guild/campaign in the database
    await upsertGuild({ id: guild.id, name: guild.name });
    console.log(`Successfully initialized guild ${guild.name}`);
  } catch (error) {
    console.error(`Error initializing guild ${guild.name}:`, error);
  }
});
