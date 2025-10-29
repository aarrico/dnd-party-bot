import { prisma } from '../index.js';

export const deletePartyMember = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  await prisma.partyMember.delete({
    where: { party_member_id: { sessionId, userId } },
  });
};
