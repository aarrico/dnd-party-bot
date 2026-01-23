import { Event } from '#shared/discord/Event.js';
import { Events, Message, PartialMessage } from 'discord.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import { getSessionById } from '#modules/session/repository/session.repository.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';
import { sessionScheduler } from '#services/sessionScheduler.js';

const logger = createScopedLogger('MessageDeleteEvent');

export default new Event(Events.MessageDelete, async (message: Message | PartialMessage) => {
  try {
    // In new architecture: session.id = message.id
    // So we just need to check if a session exists with this message ID
    const session = await getSessionById(message.id, false);

    if (session) {
      logger.info(`Session message ${message.id} (${session.name}) was deleted. Auto-canceling session.`);

      // Cancel scheduled tasks first to prevent errors
      sessionScheduler.cancelSessionTasks(session.id);
      logger.info(`Canceled scheduled tasks for session ${session.id}`);

      await cancelSession(session.id, 'Session message was deleted');
      logger.info(`Successfully canceled session ${session.id} due to deleted message`);
    }
  } catch (error) {
    // Session doesn't exist or already canceled - that's fine
    logger.debug(`Message ${message.id} deleted but no active session found:`, error);

    // Even if session lookup fails, try to cancel any scheduled tasks with this ID
    // This handles the case where DB cascade-deleted the session but tasks remain
    sessionScheduler.cancelSessionTasks(message.id);
  }
});
