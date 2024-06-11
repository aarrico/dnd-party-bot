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
  await prisma.user.create({ data });
}

export async function createNewSessionUserInDB(
  interaction: any,
  messageID: string
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
      role: roles.DM,
    },
  });
}
