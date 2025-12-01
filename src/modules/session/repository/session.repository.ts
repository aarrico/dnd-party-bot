import { prisma } from '#app/index.js';
import { PartyMember } from '#modules/party/domain/party.types.js';
import {
  ListSessionsOptions,
  ListSessionsResult,
  SessionWithParty,
  CreateSessionData,
} from '#modules/session/domain/session.types.js';
import { RoleType, Session } from '#generated/prisma/client.js';

export const createSession = async (
  sessionData: CreateSessionData,
  userId: string,
  party?: PartyMember[],
): Promise<Session> => {
  const { campaignId, ...session } = sessionData;

  // Build party members to create - always include the GM, then add any provided party members
  const partyMembersToCreate: { userId: string; roleId: RoleType }[] = [
    {
      userId,
      roleId: RoleType.GAME_MASTER,
    },
  ];

  // Add additional party members if provided (excluding GM)
  if (party && party.length > 0) {
    party.forEach((member) => {
      if (member.role !== RoleType.GAME_MASTER) {
        partyMembersToCreate.push({
          userId: member.userId,
          roleId: member.role,
        });
      }
    });
  }

  return await prisma.session.create({
    data: {
      ...session,
      campaign: { connect: { id: campaignId } },
      partyMembers: {
        create: partyMembersToCreate,
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

  const partyMembers = session.partyMembers.map((member) => ({
    userId: member.user.id,
    username: member.user.username,
    channelId: member.user.channelId,
    role: member.role.id,
  }));

  return {
    id: session.id,
    name: session.name,
    date: session.date,
    campaignId: session.campaignId,
    partyMessageId: session.partyMessageId,
    eventId: session.eventId ?? undefined,
    timezone: session.timezone ?? 'America/Los_Angeles',
    status: session.status as 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED',
    partyMembers: partyMembers,
  };
};

export const getParty = async (sessionId: string): Promise<PartyMember[]> => {
  const session = await prisma.session.findFirst({
    where: { id: sessionId },
    select: { partyMembers: { select: { user: true, role: true } } },
  });

  if (!session) {
    throw new Error(`Cannot find party for ${sessionId}`);
  }

  const partyMembers = session.partyMembers.map((partyMember) => ({
    userId: partyMember.user.id,
    username: partyMember.user.username,
    channelId: partyMember.user.channelId,
    role: partyMember.role.id,
  }));


  return partyMembers;
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
      status: s.status,
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
    partyMessageId: session.partyMessageId,
    eventId: session.eventId ?? undefined,
    status: session.status as 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED',
    timezone: session.timezone ?? 'America/Los_Angeles',
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
  data: Partial<CreateSessionData>,
): Promise<Session> => {
  const updateData = {
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
    ...(data.partyMessageId !== undefined && { partyMessageId: data.partyMessageId }),
    ...(data.eventId !== undefined && { eventId: data.eventId }),
    ...(data.status && { status: data.status }),
  };

  console.log(`[DB] Updating session ${sessionId} with data:`, JSON.stringify(updateData, null, 2));

  const updatedSession = await prisma.session.update({
    where: { id: sessionId },
    data: updateData,
  });

  console.log(`[DB] Updated session result - partyMessageId: ${updatedSession.partyMessageId}`);

  return updatedSession;
};

export const isUserInActiveSession = async (
  userId: string,
  excludeSessionId?: string
): Promise<boolean> => {
  const count = await prisma.session.count({
    where: {
      ...(excludeSessionId && { id: { not: excludeSessionId } }),
      status: { in: ['SCHEDULED', 'ACTIVE'] },
      partyMembers: {
        some: { userId },
      },
    },
  });

  return count > 0;
};

export const isUserHostingOnDate = async (
  userId: string,
  date: Date,
  campaignId: string,
  timezone: string
): Promise<boolean> => {
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::int as count
    FROM session s
    JOIN party_member pm ON s.id = pm.session_id
    WHERE s.campaign_id = ${campaignId}
      AND pm.user_id = ${userId}
      AND pm.role_id = 'GAME_MASTER'
      AND DATE(s.date AT TIME ZONE ${timezone}) = DATE(${date}::timestamptz AT TIME ZONE ${timezone})
  `;

  return Number(result[0].count) > 0;
};

export const isUserMemberOnDate = async (
  userId: string,
  date: Date,
  campaignId: string,
  timezone: string
): Promise<boolean> => {
  const result = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::int as count
    FROM session s
    JOIN party_member pm ON s.id = pm.session_id
    WHERE s.campaign_id = ${campaignId}
      AND pm.user_id = ${userId}
      AND pm.role_id != 'GAME_MASTER'
      AND DATE(s.date AT TIME ZONE ${timezone}) = DATE(${date}::timestamptz AT TIME ZONE ${timezone})
  `;

  return Number(result[0].count) > 0;
};
