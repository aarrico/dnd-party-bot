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
  const userUUID = await prisma.user.findFirst({
    where: { userChannelId: data.userChannelId },
  });
  console.log(userUUID?.username);
  if (!userUUID?.id) {
    console.log("yorgy!");
    await prisma.user.create({
      data,
    });
  } else {
    console.log("shmorgy!");
    await prisma.user.update({
      data: { username: data.username },
      where: { id: userUUID.id },
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
  await prisma.sessionUser.create({
    data: {
      userId: createdUserID?.id,
      sessionId: createdSessionID?.id,
      role,
    },
  });
}

export async function getUsersByMessageID(messageID: string) {
  const sessionID = await prisma.session.findFirst({
    where: { sessionMessageId: messageID },
  });

  return await prisma.sessionUser.findMany({
    select: { user: true },
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
    select: { user: true },
    where: { sessionId: sessionID },
  });
}

export async function GetAllSessionsAUserIsIn(userID: string) {
  return await prisma.sessionUser.findMany({
    select: { session: true },
    where: { userId: userID },
  });
}

// export async function DeleteAllUsersWithDisplayName(displayName: string) {
//   await prisma.sessionUser.deleteMany({
//     where: { username: displayName },
//   });
//   return await prisma.user.deleteMany({
//     where: { username: displayName },
//   });
// }
