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
  await createNewSessionUserInDB(data.interaction, data.messageID);
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
  await prisma.user.upsert({
    where: { id: userUUID?.id },
    update: { username: data.username },
    create: { username: data.username, userChannelId: data.userChannelId },
  });
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

//delete one session
// prisma.session.delete();
//delete multiple sessions based on criteria
// prisma.session.deleteMany();
//Arguments to update or create a Session.
// prisma.session.upsert();

export async function deleteFullSession() {
  //get session UUID
  //get all users UUIDs associated with Session UUID
  //delete session by UUID
  //delete all
}
