import {
  getSessionById,
  updateSession,
} from '#modules/session/repository/session.repository.js';
import { ListPartyForSessionOptions } from '#modules/party/domain/party.types.js';
import { SessionWithParty } from '#modules/session/domain/session.types.js';
import { notifyParty } from '#app/shared/discord/messages.js';
import { formatSessionFullDM } from '#app/shared/messages/sessionNotifications.js';
import { Guild } from 'discord.js';
import { createScheduledEvent } from '#modules/session/services/scheduledEventService.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('PartyController');

export const partyFull = async (
  campaign: Guild,
  session: SessionWithParty
): Promise<void> => {
  // Update session status to FULL
  await updateSession(session.id, { status: 'FULL' });
  logger.info('Updated session status to FULL', {
    sessionId: session.id,
    partySize: session.partyMembers.length,
  });

  // Notify all party members that the party is full
  await notifyParty(
    session.partyMembers.map((member) => member.userId),
    (userId: string) => formatSessionFullDM(campaign, session, userId)
  );

  // Create Discord scheduled event now that the party is set
  let eventId: string | null = null;
  try {
    const channel = await campaign.channels.fetch(session.campaignId);
    const channelName = channel?.name || session.name;

    eventId = await createScheduledEvent(
      campaign.id,
      channelName,
      session.date,
      session.id
    );

    if (eventId) {
      logger.info('Created scheduled event for full session', {
        sessionId: session.id,
        eventId,
      });

      // Update session with eventId
      await updateSession(session.id, { eventId });
      logger.info('Updated session with event ID', {
        sessionId: session.id,
        eventId,
      });
    }
  } catch (error) {
    logger.error('Failed to create scheduled event for full session', {
      sessionId: session.id,
      error,
    });
    // Continue - event creation is optional, don't throw
  }
};

export async function listPartyForSession(
  sessionId: string
): Promise<SessionWithParty> {
  return await getSessionById(sessionId, true);
}

export const formatSessionPartyAsStr = (
  session: SessionWithParty,
  options: ListPartyForSessionOptions,
  delimiter = ', '
): string => {
  const title = `User List for Session ${session.name}\n`;
  const header = [
    'Username',
    options.addUserRoleInThisSession && 'Role',
    options.addUserId && 'User ID',
    options.addUserDMMessageId && 'User DM Channel ID',
  ].filter(Boolean);

  const data = session.partyMembers.map((member) => {
    return [
      member.username,
      options.addUserRoleInThisSession && member.role,
      options.addUserId && member.userId,
      options.addUserDMMessageId && member.channelId,
    ].filter(Boolean);
  });

  return title + [header, ...data].map((row) => row.join(delimiter)).join('\n');
};
