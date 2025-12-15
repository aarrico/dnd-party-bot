import { Event } from '#shared/discord/Event.js';
import { Events, Message, PartialMessage } from 'discord.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import { getSessionByPartyMessageId } from '#modules/session/repository/session.repository.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';

const logger = createScopedLogger('MessageDeleteEvent');

export default new Event(Events.MessageDelete, async (message: Message | PartialMessage) => {
  try {
    // Check if this message is a party message for any session
    const session = await getSessionByPartyMessageId(message.id);

    if (session) {
      logger.info(`Party message ${message.id} for session ${session.name} was deleted. Auto-canceling session.`);
      await cancelSession(session.id, 'Session party message was deleted');
      logger.info(`Successfully canceled session ${session.id} due to deleted party message`);
    }
  } catch (error) {
    logger.error(`Error checking for session with deleted message ${message.id}:`, error);
  }
});
