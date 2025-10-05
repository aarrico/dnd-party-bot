import { Guild } from 'discord.js';
import { Session } from '../models/session.js';
import { getUserTimezone } from '../db/user.js';
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
