import { User, RoleType } from '@prisma/client';
import { prisma } from '../index';
import {
  ListUsersOptions,
  ListUsersResult,
  ListUserWithSessionsResult,
} from '../models/user';
import { client } from '../index';

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

  await prisma.partyMember.create({
    data: {
      userId,
      sessionId,
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
