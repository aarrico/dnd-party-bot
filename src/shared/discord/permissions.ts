import { GuildMember } from 'discord.js';
import { isUserGameMaster } from '#modules/session/repository/session.repository.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('Permissions');

export interface SessionPermissionResult {
  allowed: boolean;
  isAdmin: boolean;
  isGameMaster: boolean;
}

/**
 * Check if a guild member has permission to manage a session.
 * A user is allowed if they are a server Administrator OR the Game Master of the session.
 */
export async function canManageSession(
  member: GuildMember,
  sessionId: string
): Promise<SessionPermissionResult> {
  const isAdmin = member.permissions.has('Administrator');
  const isGM = await isUserGameMaster(member.id, sessionId);

  const allowed = isAdmin || isGM;

  if (!allowed) {
    logger.info('User denied session management permission', {
      userId: member.id,
      sessionId,
      isAdmin,
      isGameMaster: isGM,
    });
  }

  return { allowed, isAdmin, isGameMaster: isGM };
}
