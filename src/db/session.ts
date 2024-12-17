import { roles } from '../../prisma/seed';
import { UserData } from './user';
import { prisma } from '../index';

export type SessionData = {
  messageId: string;
  name: string;
  date: Date;
  channelId: string;
};

export const createSession = async ({
  sessionData,
  userData,
}: {
  sessionData: SessionData;
  userData: UserData;
}) => {
  const user = await upsertUserWithUsername(userData);

  await prisma.session.create({
    data: {
      ...sessionData,
      users: {
        create: {
          user: { connect: { id: user.id } },
          role: roles.DM,
        },
      },
    },
  });
};

export async function AddUserToSession(
  newUserData: UserData,
  sessionMessageId: string,
  role: string
) {
  const {
    id: sessionId,
    date,
    users: party,
  } = await getPartyBySessionMessageId(sessionMessageId);

  const existingUser = await upsertUserWithUsername(newUserData);

  // reject changes if the session has already occured, but allow for user upsert first??
  if (date < new Date()) {
    return 'session expired';
  }

  const partyMember = party.find(
    (member) => member.user.userChannelId === newUserData.userChannelId
  );
  if (partyMember) {
    if (partyMember.role === roles.DM) return 'Cant Change DM';

    if (role === partyMember.role) {
      await deletePartyMember(partyMember.user.id, sessionId);
      return 'deleted';
    }

    await updatePartyMemberRole(partyMember.user.id, sessionId, role);
    return 'updated';
  }

  if (party.length >= 6) return 'party full';

  await addUserToParty(existingUser.id, sessionId, role);
  return 'created';
}

export async function getUsersByMessageId(messageId: string) {
  const session = await prisma.session.findFirst({
    where: { messageId: messageId },
    include: { users: { select: { user: true, role: true } } },
  });

  return session ? [...session.users] : [];
}

export async function GetAllSessions() {
  return await prisma.session.findMany();
}

export async function GetSessionsByName(sessionName: string) {
  return await prisma.session.findMany({ where: { name: sessionName } });
}

export async function GetSessionById(id: string) {
  return await prisma.session.findUniqueOrThrow({ where: { id } });
}

export async function GetSessionByMessageId(messageId: string) {
  return await prisma.session.findUniqueOrThrow({
    where: { messageId: messageId },
  });
}

export async function DeleteSessionById(id: string) {
  return await prisma.session.delete({ where: { id } });
}

export async function GetAllUsers() {
  return await prisma.user.findMany();
}

export async function GetUsersByUsername(username: string) {
  return await prisma.user.findMany({ where: { username } });
}

export async function GetUserById(id: string) {
  return await prisma.user.findUniqueOrThrow({ where: { id } });
}

export async function GetAllPartyMembers() {
  return await prisma.partyMember.findMany();
}

// could be updated to go through user table
export async function GetPartyMemberByUserId(userId: string) {
  return await prisma.partyMember.findMany({ where: { userId } });
}

// could be updated to go through session table
export async function GetPartyForSession(
  sessionId: string,
  sortByUsername = false
) {
  return await prisma.partyMember.findMany({
    select: { user: true, session: true, role: true },
    where: { sessionId },
    ...(sortByUsername && { orderBy: { user: { username: 'asc' } } }),
  });
}

export async function GetAllSessionsAUserIsIn(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessions: { select: { session: true, role: true } } },
  });

  return user?.sessions || [];
}

export async function DeleteAllUsersWithDisplayName(displayName: string) {
  return await prisma.user.deleteMany({
    where: { username: displayName },
  });
}

export async function UpdateSessionMessageId(
  oldMessageId: string,
  newMessageId: string
) {
  return await prisma.session.update({
    where: {
      messageId: oldMessageId,
    },
    data: {
      messageId: newMessageId,
    },
  });
}

export async function UpdateSession(
  sessionId: string,
  sessionUpdateData: SessionData
) {
  return await prisma.session.update({
    data: {
      name: sessionUpdateData.name,
      date: sessionUpdateData.date,
      messageId: sessionUpdateData.messageId,
    },
    where: {
      id: sessionId,
    },
  });
}

export async function DeleteSessionMessageId(messageId: string) {
  return await prisma.session.deleteMany({
    where: {
      messageId: messageId,
    },
  });
}

async function upsertUserWithUsername(userData: UserData) {
  return await prisma.user.upsert({
    where: { userChannelId: userData.userChannelId },
    create: userData,
    update: { username: userData.username },
  });
}

async function updatePartyMemberRole(
  userId: string,
  sessionId: string,
  role: string
) {
  return prisma.user.update({
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
}

async function deletePartyMember(userId: string, sessionId: string) {
  return prisma.partyMember.delete({
    where: { party_member_id: { sessionId, userId } },
  });
}

async function addUserToParty(userId: string, sessionId: string, role: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      sessions: {
        create: { sessionId, role },
      },
    },
  });
}

async function getPartyBySessionMessageId(messageId: string) {
  return await prisma.session.findUniqueOrThrow({
    select: {
      id: true,
      date: true,
      users: { select: { user: true, role: true } },
    },
    where: { messageId },
  });
}
