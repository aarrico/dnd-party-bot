import { getSessionById } from '../db/session';
import { ListPartyForSessionOptions } from '../typings/party';
import { SessionWithParty } from '../typings/session';

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
  const title = `User List for ${session.name}\n`;
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
