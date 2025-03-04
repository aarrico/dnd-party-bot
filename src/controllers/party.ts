import { getSessionById } from '../db/session';
import { ListPartyForSessionOptions, PartyMember } from '../typings/party';
import { getPartyForSession } from '../db/partyMember';

export function listPartyForSession(
  sessionId: string,
  options: ListPartyForSessionOptions,
  asString: true
): Promise<string>;
export function listPartyForSession(
  sessionId: string,
  options: ListPartyForSessionOptions,
  asString: false
): Promise<PartyMember[]>;
export function listPartyForSession(
  sessionId: string,
  options: ListPartyForSessionOptions,
  asString?: boolean
): Promise<string | PartyMember[]>;

export async function listPartyForSession(
  sessionId: string,
  options: ListPartyForSessionOptions,
  asString = false
): Promise<string | PartyMember[]> {
  const { name: sessionName } = await getSessionById(sessionId);

  const party = await getPartyForSession(sessionId, true);

  return asString ? formatAsString(party, sessionName, options) : party;
}

const formatAsString = (
  party: PartyMember[],
  sessionName: string,
  options: ListPartyForSessionOptions,
  delimiter = ', '
): string => {
  const title = `User List for ${sessionName}\n`;
  const header = [
    'Username',
    options.addUserRoleInThisSession && 'Role',
    options.addUserId && 'User ID',
    options.addUserDMMessageId && 'User DM Channel ID',
  ].filter(Boolean);

  const data = party.map((member) => {
    return [
      member.username,
      options.addUserRoleInThisSession && member.role,
      options.addUserId && member.userId,
      options.addUserDMMessageId && member.channelId,
    ].filter(Boolean);
  });

  return title + [header, ...data].map((row) => row.join(delimiter)).join('\n');
};
