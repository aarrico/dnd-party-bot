import { prisma } from '../index.js';
import { PartyMember } from '../models/party.js';
import {
  ListSessionsOptions,
  ListSessionsResult,
  Session,
  SessionWithParty,
} from '../models/session.js';
import { RoleType } from '@prisma/client';
import { client } from '../index.js';

export const createSession = async (
  newSession: Session,
  userId: string
): Promise<void> => {
  const { campaignId, ...session } = newSession;
  
  await prisma.session.create({
    data: {
      ...session,
      campaign: { connect: { id: campaignId } },
      partyMembers: {
        create: {
          user: { connect: { id: userId } },
          role: { connect: { id: RoleType.GAME_MASTER } },
        },
      },
    },
  });
};

export const getSession = async (
  sessionId: string
): Promise<SessionWithParty> => {
  const session = await prisma.session.findUniqueOrThrow({
    where: { id: sessionId },
    include: {
      partyMembers: {
        select: {
          user: true,
          role: true,
        },
      },
    },
  });

  return {
    id: session.id,
    name: session.name,
    date: session.date,
    campaignId: session.campaignId,
    partyMembers: session.partyMembers.map((member) => ({
      userId: member.user.id,
      username: member.user.username,
      channelId: member.user.channelId,
      role: member.role.id,
    })),
  };
};

export const getParty = async (channelId: string): Promise<PartyMember[]> => {
  const session = await prisma.session.findFirst({
    where: { id: channelId },
    select: { partyMembers: { select: { user: true, role: true } } },
  });

  if (!session) {
    throw new Error(`Cannot find party for ${channelId}`);
  }

  return session.partyMembers.map((partyMember) => ({
    userId: partyMember.user.id,
    username: partyMember.user.username,
    channelId: partyMember.user.channelId,
    role: partyMember.role.id,
  }));
};

export const getSessions = async (
  options: ListSessionsOptions
): Promise<ListSessionsResult[]> => {
  const {
    userId = '',
    campaignId = '',
    includeCampaign = false,
    includeUserRole = false,
  } = options;
  const sessions = await prisma.session.findMany({
    where: {
      ...(userId && { partyMembers: { some: { userId } } }),
      ...(campaignId && { campaignId }),
    },
    include: {
      ...(includeCampaign && {
        campaign: {
          select: {
            name: true,
          },
        },
      }),
      ...(userId && { partyMembers: { select: { role: true } } }),
    },
  });

  return sessions.map((s) => {
    return {
      ...(includeCampaign && { campaign: s.campaign.name }),
      ...(includeUserRole && {
        userRole: s.partyMembers.find((pm) => pm.userId === userId)?.roleId,
      }),
      id: s.id,
      name: s.name,
      date: s.date,
    };
  });
};

export function getSessionById(
  id: string,
  includeParty: true
): Promise<SessionWithParty>;
export function getSessionById(
  id: string,
  includeParty?: false
): Promise<Session>;
export function getSessionById(
  id: string,
  includeParty?: boolean
): Promise<Session | SessionWithParty>;

export async function getSessionById(
  id: string,
  includeParty = false
): Promise<Session | SessionWithParty> {
  if (!includeParty) {
    return prisma.session.findUniqueOrThrow({ where: { id } });
  }

  const session = await prisma.session.findUniqueOrThrow({
    where: { id },
    include: {
      partyMembers: {
        include: {
          user: true,
          role: true,
        },
      },
    },
  });

  return {
    id: session.id,
    name: session.name,
    date: session.date,
    campaignId: session.campaignId,
    partyMembers: session.partyMembers.map((member) => ({
      userId: member.user.id,
      username: member.user.username,
      channelId: member.user.channelId,
      role: member.role.id,
    })),
  };
}

export const deleteSessionById = async (id: string): Promise<Session> =>
  prisma.session.delete({ where: { id } });

export const updateSession = async (
  sessionId: string,
  data: { name?: string; date?: Date; campaignId?: string }
): Promise<void> => {
  await prisma.session.update({
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
