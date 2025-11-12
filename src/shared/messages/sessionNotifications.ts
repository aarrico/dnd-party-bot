import { Guild } from 'discord.js';
import { Session } from '@modules/session/domain/session.types.js';
import { getUserTimezone } from '@modules/user/repository/user.repository.js';
import { BotDialogs } from './botDialogStrings.js';

/**
 * Formats a session creation DM message for a specific user in their timezone
 */
export async function formatSessionCreationDM(
  campaign: Guild,
  session: Session,
  userId: string
): Promise<string> {
  const userTimezone = await getUserTimezone(userId);
  return BotDialogs.createSessionDMSessionTime(campaign, session, userTimezone);
}
