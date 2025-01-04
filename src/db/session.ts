import { prisma } from '../index';
import { Prisma, RoleType } from '@prisma/client';
import { PartyMember } from '../models/party';

export type Session = {
  id: string;
  name: string;
  date: Date;
  campaignId: string;
};

export const createSession = async (newSession: Session, userId: string) => {
  const { campaignId, ...session } = newSession;
  await prisma.session.create({
    data: {
      ...session,
      campaign: { connect: { id: campaignId } },
      partyMembers: {
        create: {
          user: { connect: { id: userId } },
          role: RoleType.GAME_MASTER,
        },
      },
    },
  });
};

export const getSession = async (sessionId: string) =>
  await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      partyMembers: { select: { user: true, role: true } },
    },
  });

export const getParty = async (channelId: string): Promise<PartyMember[]> => {
  const session = await prisma.session.findFirst({
    where: { id: channelId },
    select: { partyMembers: { select: { user: true, role: true } } },
  });

  if (!session) {
    throw new Error(`Cannot find party for ${channelId}`);
  }

  return session.partyMembers;
};

export const getSessions = async () => await prisma.session.findMany();

export const getSessionById = async (id: string) =>
  await prisma.session.findUniqueOrThrow({ where: { id } });

export const deleteSessionById = async (id: string) =>
  prisma.session.delete({ where: { id } });

export const getAllUsers = async () => await prisma.user.findMany();

export const getUserById = async (id: string) =>
  await prisma.user.findUniqueOrThrow({ where: { id } });

export const getAllSessionsForUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessions: { select: { session: true, role: true } } },
  });

  if (!user) {
    throw new Error(`Cannot find ${userId}`);
  }

  return user.sessions || [];
};

export const updateSessionCampaignId = async (
  oldCampaignId: string,
  newCampaignId: string
) =>
  prisma.session.update({
    where: {
      campaignId: oldCampaignId,
    },
    data: {
      campaignId: newCampaignId,
    },
  });

export const updateSession = async (
  sessionId: string,
  data: { name?: string; date?: Date; campaignId?: string }
) => {
  prisma.session.update({
    where: { id: sessionId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.date && {
        date: data.date,
      }),
      ...(data.campaignId && {
        campaign: {
          connect: {
            id: data.campaignId,
          },
        },
      }),
    },
  });
};

export const updatePartyMemberRole = async (
  userId: string,
  sessionId: string,
  role: string
) =>
  prisma.user.update({
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

export const deletePartyMember = async (userId: string, sessionId: string) =>
  prisma.partyMember.delete({
    where: { party_member_id: { sessionId, userId } },
  });

export const addUserToParty = async (
  userId: string,
  sessionId: string,
  role: string
) =>
  prisma.user.update({
    where: { id: userId },
    data: {
      sessions: {
        create: { sessionId, role },
      },
    },
  });
