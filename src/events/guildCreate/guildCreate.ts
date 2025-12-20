import { Events, Guild } from 'discord.js';
import { Event } from '#shared/discord/Event.js';
import { ExtendedClient } from '#shared/discord/ExtendedClient.js';
import { upsertCampaign } from '#modules/guild/repository/guild.repository.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('GuildCreateEvent');

export default new Event(Events.GuildCreate, async (guild: Guild) => {
  const client = guild.client as ExtendedClient;

  logger.info('Bot joined new guild', { guildId: guild.id, guildName: guild.name });

  try {
    // Register commands to this guild immediately for instant availability
    await client.registerCommandsToGuild(guild.id);

    // Create the guild/campaign in the database
    await upsertCampaign({ id: guild.id, name: guild.name });
    logger.info('Initialized guild', { guildId: guild.id, guildName: guild.name });
  } catch (error) {
    logger.error('Error initializing guild', { guildId: guild.id, guildName: guild.name, error });
  }
});
