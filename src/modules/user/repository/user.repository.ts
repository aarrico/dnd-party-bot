import { User, RoleType } from '#generated/prisma/client.js';
import { prisma } from '../../../index.js';
import {
  ListUsersOptions,
  ListUsersResult,
  ListUserWithSessionsResult,
} from '../domain/user.types.js';
import { client } from '../../../index.js';

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
  await prisma.partyMember.update({
    where: { party_member_id: { sessionId, userId } },
    data: { roleId },
  });
};

export const addUserToParty = async (
  userId: string,
  sessionId: string,
  roleId: RoleType,
  username?: string
): Promise<void> => {
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
      roleId,
    },
    update: {
      roleId,
    },
  });
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

export const addUserToCampaign = async (userId: string, campaignId: string): Promise<void> => {
  await prisma.faction.upsert({
    where: {
      campaign_member_id: {
        campaignId,
        userId,
      },
    },
    create: {
      campaignId,
      userId,
    },
    update: {}, // No updates needed if already exists
  });
};

export const isUserInCampaign = async (userId: string, campaignId: string): Promise<boolean> => {
  const campaignMember = await prisma.faction.findUnique({
    where: {
      campaign_member_id: {
        campaignId,
        userId,
      },
    },
  });
  return campaignMember !== null;
};
