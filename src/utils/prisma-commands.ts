import { PrismaClient } from "@prisma/client";
import { roles } from "../../prisma/seed";

const prisma = new PrismaClient();

export async function createNewSession(data: {
  sessionData: {
    sessionMessageId: string;
    sessionName: string;
    sessionDate: Date;
  };
  userData: {
    username: string;
    userChannelId: string;
  };
  interaction: any;
  messageID: string;
}) {
  await createNewSessionInDB(data.sessionData);
  await createNewUserInDB(data.userData);
  await createNewSessionUserInDB(data.interaction, data.messageID, roles.DM);
}

export async function createNewSessionInDB(data: {
  sessionMessageId: string;
  sessionName: string;
  sessionDate: Date;
}) {
  await prisma.session.create({ data });
}

export async function createNewUserInDB(data: {
  username: string;
  userChannelId: string;
}) {
  //   await prisma.user.create({ data });
  //   //change to upsert
  const userUUID = await prisma.user.findMany({
    where: { userChannelId: data.userChannelId },
  });
  if (userUUID?.length === 0) {
    await prisma.user.create({
      data,
    });
  } else {
    await prisma.user.update({
      data: { username: data?.username },
      where: { id: userUUID[0]?.id },
    });
  }
}

export async function createNewSessionUserInDB(
  interaction: any,
  messageID: string,
  role: string
) {
  const createdUserID = await prisma.user.findFirstOrThrow({
    select: { id: true },
    where: { username: interaction?.user?.displayName },
  });

  const createdSessionID = await prisma.session.findFirstOrThrow({
    select: { id: true },
    where: { sessionMessageId: messageID },
  });

  if (createdUserID?.id && createdSessionID?.id) {
    const allUserInSession = await GetUsersBySessionID(createdSessionID?.id);
    const isUserRoleTaken = allUserInSession.some(
      (user) => user?.role === role && user?.user?.id !== createdUserID?.id
    );

    if (isUserRoleTaken) return "role taken";
    else if (allUserInSession.length >= 6) return "party full";

    const existingUser = await prisma.sessionUser.findFirst({
      where: { userId: createdUserID.id, sessionId: createdSessionID.id },
    });

    const isUserBeingAddedTheDM =
      existingUser && existingUser.role === roles.DM;

    if (!existingUser) {
      await prisma.sessionUser.create({
        data: {
          userId: createdUserID?.id,
          sessionId: createdSessionID?.id,
          role,
        },
      });
      return "created";
    } else if (role === existingUser?.role) {
      await prisma.sessionUser.delete({
        where: {
          role,
          sessionId_userId: {
            userId: existingUser.userId,
            sessionId: existingUser.sessionId,
          },
        },
      });
      return "deleted";
    } else {
      if (isUserBeingAddedTheDM) return "Cant Change DM";
      await prisma.sessionUser.update({
        where: {
          sessionId_userId: {
            userId: existingUser?.userId as string,
            sessionId: existingUser?.sessionId as string,
          },
        },
        data: {
          role,
        },
      });
      return "updated";
    }
  }
}

export async function getUsersByMessageID(messageID: string) {
  const sessionID = await prisma.session.findFirst({
    where: { sessionMessageId: messageID },
  });

  return await prisma.sessionUser.findMany({
    select: { user: true, role: true },
    where: { sessionId: sessionID?.id },
  });
}

export async function GetAllSessions() {
  return await prisma.session.findMany();
}
export async function GetSessionsByName(sessionName: string) {
  return await prisma.session.findMany({ where: { sessionName } });
}

export async function GetSessionByID(id: string) {
  return await prisma.session.findFirstOrThrow({ where: { id } });
}

export async function DeleteSessionByID(id: string) {
  await prisma.sessionUser.deleteMany({ where: { sessionId: id } });
  return await prisma.session.delete({ where: { id } });
}

export async function GetAllUsers() {
  return await prisma.user.findMany();
}

export async function GetUsersByUsername(username: string) {
  return await prisma.user.findMany({ where: { username } });
}

export async function GetUserByID(id: string) {
  return await prisma.user.findFirstOrThrow({ where: { id } });
}

export async function GetAllSessionUsers() {
  return await prisma.sessionUser.findMany();
}

export async function GetSessionUserByUserID(userID: string) {
  return await prisma.sessionUser.findMany({ where: { userId: userID } });
}

export async function GetUsersBySessionID(sessionID: string) {
  // let users: string[] = [];
  return await prisma.sessionUser.findMany({
    select: { user: true, role: true },
    where: { sessionId: sessionID },
  });
}

export async function GetAllSessionsAUserIsIn(userID: string) {
  return await prisma.sessionUser.findMany({
    select: { session: true, role: true },
    where: { userId: userID },
  });
}

export async function DeleteAllUsersWithDisplayName(displayName: string) {
  const users = await prisma.user.findMany({
    where: { username: displayName },
  });

  users.forEach(async (user) => {
    await prisma.sessionUser.deleteMany({
      where: { userId: user.id },
    });
  });

  return await prisma.user.deleteMany({
    where: { username: displayName },
  });
}
