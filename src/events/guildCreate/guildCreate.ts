import { Events, Guild } from 'discord.js';
import { Event } from '#shared/discord/Event.js';
import { ExtendedClient } from '#shared/discord/ExtendedClient.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('GuildCreateEvent');

export default new Event(Events.GuildCreate, async (guild: Guild) => {
  const client = guild.client as ExtendedClient;

  logger.info('Bot joined new guild', { guildId: guild.id, guildName: guild.name });

  // In production (no GUILD_ID), commands are registered globally which covers all guilds.
  // Only register guild-specific commands in development mode to avoid duplicates.
  if (!process.env.GUILD_ID) {
    logger.debug('Skipping guild command registration - using global commands', { guildId: guild.id });
    return;
  }

  try {
    // Development mode: register commands to this guild immediately for instant availability
    await client.registerCommandsToGuild(guild.id);
    logger.info('Initialized guild', { guildId: guild.id, guildName: guild.name });
  } catch (error) {
    logger.error('Error initializing guild', { guildId: guild.id, guildName: guild.name, error });
  }
});
