import { User, RoleType } from '#generated/prisma/client.js';
import { prisma } from '../../../index.js';
import {
  ListUsersOptions,
  ListUsersResult,
  ListUserWithSessionsResult,
} from '../domain/user.types.js';
import { client } from '../../../index.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('UserRepository');

export const upsertUser = async (userId: string, username: string, channelId: string) => {
  return await prisma.user.upsert({
    where: { id: userId },
    create: {
      id: userId,
      username: username,
      channelId: channelId,
    },
    update: {
      username: username,
    },
  });
}

export const updateUserTimezone = async (userId: string, timezone: string) => {
  logger.debug('Updating user timezone', { userId, timezone });
  return await prisma.user.update({
    where: { id: userId },
    data: { timezone },
  });
};

export const upsertUserWithUsername = async (userData: User) =>
  await prisma.user.upsert({
    where: { id: userData.id },
    create: userData,
    update: { username: userData.username },
  });

export const getAllUsers = async (
  options: ListUsersOptions
): Promise<ListUsersResult[]> => {
  const { includeUserId, includeUserDMMessageId } = options;
  return prisma.user.findMany({
    select: {
      id: includeUserId,
      channelId: includeUserDMMessageId,
      username: true,
    },
  });
};

export const updatePartyMemberRole = async (
  userId: string,
  sessionId: string,
  roleId: RoleType
): Promise<void> => {
  logger.debug('Updating party member role', { userId, sessionId, roleId });
  await prisma.partyMember.update({
    where: { party_member_id: { sessionId, userId } },
    data: { roleId },
  });
};

export const addUserToParty = async (
  userId: string,
  sessionId: string,
  role: RoleType,
  username: string
): Promise<void> => {
  logger.debug('Adding user to party', { userId, sessionId, role, username });
  // Ensure the user exists in the database before adding to party
  if (username) {
    const user = await client.users.fetch(userId);
    const dmChannel = await user.createDM();

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username: username,
        channelId: dmChannel.id,
      },
      update: {
        username: username,
      },
    });
  }

  await prisma.partyMember.upsert({
    where: {
      party_member_id: {
        userId,
        sessionId,
      },
    },
    create: {
      userId,
      sessionId,
      roleId: role,
    },
    update: {
      roleId: role,
    },
  });

  logger.info('User added to party', { userId, sessionId, role });
};

/**
 * Atomically add a user to a party if there's room (max 6 members).
 * Uses a transaction to prevent race conditions where two users
 * could both pass the "party full" check simultaneously.
 *
 * @returns true if user was added, false if party is full
 */
export const addUserToPartyIfNotFull = async (
  userId: string,
  sessionId: string,
  role: RoleType,
  username: string,
  maxPartySize: number = 6
): Promise<boolean> => {
  logger.debug('Attempting to add user to party (atomic)', {
    userId,
    sessionId,
    role,
    username,
    maxPartySize,
  });

  // Ensure the user exists in the database before adding to party
  if (username) {
    const user = await client.users.fetch(userId);
    const dmChannel = await user.createDM();

    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        username: username,
        channelId: dmChannel.id,
      },
      update: {
        username: username,
      },
    });
  }

  // Use a transaction to atomically check count and insert
  const result = await prisma.$transaction(async (tx) => {
    // Count current party members
    const currentCount = await tx.partyMember.count({
      where: { sessionId },
    });

    if (currentCount >= maxPartySize) {
      logger.info('Party full during atomic add attempt', {
        sessionId,
        currentCount,
        maxPartySize,
      });
      return false;
    }

    // Add the user
    await tx.partyMember.upsert({
      where: {
        party_member_id: {
          userId,
          sessionId,
        },
      },
      create: {
        userId,
        sessionId,
        roleId: role,
      },
      update: {
        roleId: role,
      },
    });

    logger.info('User added to party (atomic)', { userId, sessionId, role });
    return true;
  });

  return result;
};

export const getSessionsForUser = async (
  userId: string,
  includeCampaign = false
): Promise<ListUserWithSessionsResult> => {
  const data = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
    include: {
      sessions: {
        include: {
          session: {
            select: {
              id: true,
              name: true,
              date: true,
              status: true,
              campaignId: true,
              campaign: includeCampaign,
            },
          },
        },
      },
    },
  });

  return {
    id: data.id,
    username: data.username,
    sessions: data.sessions.map(
      ({ session: { campaign, ...session }, roleId: userRole }) => {
        return {
          ...session,
          userRole,
          ...(includeCampaign && { campaign: campaign.name }),
        };
      }
    ),
  };
};

export const getUserTimezone = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true }
  });
  return user?.timezone ?? 'America/Los_Angeles';
};

export const getUserById = async (userId: string): Promise<User | null> => {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
};
