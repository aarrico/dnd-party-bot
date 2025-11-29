import { getSessionById } from '#modules/session/repository/session.repository.js';
import { ListPartyForSessionOptions } from '#modules/party/domain/party.types.js';
import { SessionWithParty } from '#modules/session/domain/session.types.js';

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
