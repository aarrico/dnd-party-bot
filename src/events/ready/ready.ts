import { Event } from '#shared/discord/Event.js';
import { Events } from 'discord.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('ReadyEvent');

export default new Event(Events.ClientReady, () => {
  logger.info('Bot is online!');
});
