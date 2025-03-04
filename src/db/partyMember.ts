import { prisma } from '../index';
import { PartyMember } from '../typings/party';

export async function getPartyForSession(
  sessionId: string,
  includeUserDetails: boolean = false
): Promise<PartyMember[]> {
  const party = await prisma.partyMember.findMany({
    where: {
      sessionId: sessionId,
    },
    include: {
      user: includeUserDetails,
    },
  });

  return party.map((member) => ({
    userId: member.userId,
    username: member.user.username,
    role: member.role,
    channelId: member.user.channelId,
  }));
}
