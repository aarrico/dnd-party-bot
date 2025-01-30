import { User } from '@prisma/client';
import { prisma } from '../index';
import { ListUsersOptions, ListUsersResult } from '../typings/user';

export const upsertUserWithUsername = async (userData: User) =>
  await prisma.user.upsert({
    where: { id: userData.id },
    create: userData,
    update: { username: userData.username },
  });

export const getUserSessions = async ({
  includeCampaign,
  userId,
}: {
  includeCampaign: boolean;
  userId: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      sessions: {
        select: {
          session: { select: { campaign: includeCampaign } },
          role: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error(`Cannot find ${userId}`);
  }

  return user.sessions || [];
};

export const getAllUsers = async (
  options: ListUsersOptions
): Promise<ListUsersResult[]> => {
  const { includeUserId, includeUserDMMessageId } = options;
  return await prisma.user.findMany({
    select: {
      id: includeUserId,
      channelId: includeUserDMMessageId,
      username: true,
    },
  });
};
