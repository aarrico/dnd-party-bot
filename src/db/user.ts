import { User } from '@prisma/client';
import { prisma } from '../index';
import {
  ListUsersOptions,
  ListUsersResult,
  ListUserWithSessionsResult,
} from '../typings/user';

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
  role: string
): Promise<User> => {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      sessions: {
        update: {
          where: { party_member_id: { sessionId, userId } },
          data: { role },
        },
      },
    },
  });
};

export const addUserToParty = async (
  userId: string,
  sessionId: string,
  role: string
): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      sessions: {
        create: { sessionId, role },
      },
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
      ({ session: { campaign, ...session }, role: userRole }) => {
        return {
          ...session,
          userRole,
          ...(includeCampaign && { campaign: campaign.name }),
        };
      }
    ),
  };
};
