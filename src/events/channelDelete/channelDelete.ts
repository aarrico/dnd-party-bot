import { Event } from '#shared/discord/Event.js';
import { Events, NonThreadGuildBasedChannel, ChannelType, DMChannel } from 'discord.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';
import { getActiveSessionsByCampaignId } from '#modules/session/repository/session.repository.js';
import { sessionScheduler } from '#services/sessionScheduler.js';

const logger = createScopedLogger('ChannelDeleteEvent');

export default new Event(Events.ChannelDelete, async (channel: DMChannel | NonThreadGuildBasedChannel) => {
  if (channel.type !== ChannelType.GuildText) {
    return;
  }

  try {
    const sessions = await getActiveSessionsByCampaignId(channel.id);

    if (sessions.length > 0) {
      logger.info(`Channel ${channel.name} (${channel.id}) was deleted. Auto-canceling ${sessions.length} session(s).`);

      for (const session of sessions) {
        try {
          // Cancel scheduled tasks first to prevent errors
          sessionScheduler.cancelSessionTasks(session.id);
          logger.info(`Canceled scheduled tasks for session ${session.id}`);

          await cancelSession(session.id, 'Campaign channel was deleted');
          logger.info(`Successfully canceled session ${session.id} (${session.name})`);
        } catch (error) {
          logger.error(`Failed to cancel session ${session.id}:`, error);
          // Even if cancelSession fails, ensure tasks are canceled
          sessionScheduler.cancelSessionTasks(session.id);
        }
      }
    }
  } catch (error) {
    logger.error(`Error processing channel deletion for ${channel.id}:`, error);
  }
});
