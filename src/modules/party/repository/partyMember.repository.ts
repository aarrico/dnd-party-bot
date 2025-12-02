import { prisma } from '#app/index.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('PartyMemberRepository');

export const deletePartyMember = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  logger.debug('Removing party member', { userId, sessionId });
  await prisma.partyMember.delete({
    where: { party_member_id: { sessionId, userId } },
  });
  logger.info('Party member removed', { userId, sessionId });
};
