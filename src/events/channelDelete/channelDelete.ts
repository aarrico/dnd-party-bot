import { Event } from '#shared/discord/Event.js';
import { Events, NonThreadGuildBasedChannel, ChannelType, DMChannel } from 'discord.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import { getSessionById } from '#modules/session/repository/session.repository.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';

const logger = createScopedLogger('ChannelDeleteEvent');

export default new Event(Events.ChannelDelete, async (channel: DMChannel | NonThreadGuildBasedChannel) => {
  // Only handle guild text channels that could be sessions
  if (channel.type !== ChannelType.GuildText) {
    return;
  }

  try {
    // Check if this channel is a session
    const session = await getSessionById(channel.id, false);

    if (session) {
      logger.info(`Channel ${channel.name} (${channel.id}) was deleted. Auto-canceling session.`);
      await cancelSession(channel.id, 'Session channel was deleted');
      logger.info(`Successfully canceled session for deleted channel ${channel.id}`);
    }
  } catch (error) {
    // Session doesn't exist or other error - that's fine, nothing to cancel
    logger.debug(`Channel ${channel.id} deleted but no session found or error occurred:`, error);
  }
});
