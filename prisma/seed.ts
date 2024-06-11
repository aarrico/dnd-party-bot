import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

//can store this as enum in DB if needed.***
export const roles = {
  TANK: "tank",
  SUPPORT: "support",
  RANGEDPS: "range dps",
  MELEEDPS: "melee dps",
  FACE: "face",
  CONTROL: "control",
  DM: "dungeon master",
};

const sessions = [
  {
    sessionMessageId: "1",
    sessionName: "Session 1",
    sessionDate: new Date(),
  },
  {
    sessionMessageId: "2",
    sessionName: "Session 2",
    sessionDate: new Date(),
  },
  {
    sessionMessageId: "3",
    sessionName: "Session 3",
    sessionDate: new Date(),
  },
  {
    sessionMessageId: "4",
    sessionName: "Session 4",
    sessionDate: new Date(),
  },
];

const users = [
  {
    username: "user 1",
    userChannelId: "12313213",
  },
  {
    username: "user 2",
    userChannelId: "234234234",
  },
  {
    username: "user 3",
    userChannelId: "345345345",
  },
  {
    username: "user 4",
    userChannelId: "456456456",
  },
  {
    username: "user 5",
    userChannelId: "567567567",
  },
  {
    username: "user 6",
    userChannelId: "678678678",
  },
  {
    username: "user 7",
    userChannelId: "789789789",
  },
  {
    username: "user 8",
    userChannelId: "890890890",
  },
  {
    username: "user 9",
    userChannelId: "901901901",
  },
  {
    username: "user 10",
    userChannelId: "012012012",
  },
  {
    username: "DM 1",
    userChannelId: "000000001",
  },
  {
    username: "DM 2",
    userChannelId: "000000002",
  },
  {
    username: "DM 3",
    userChannelId: "000000003",
  },
];

async function createSessions() {
  await prisma.session.createMany({
    data: sessions,
  });

  //returns all record on that table.
  return prisma.session.findMany();
}

async function createUsers() {
  await prisma.user.createMany({
    data: users,
  });

  //returns all record on that table.
  return prisma.user.findMany();
}

async function createSessionUsers(sessionData: any, userData: any) {
  //Session 1 with 5 users
  createSessionUser(sessionData[0].id, userData[10].id, roles.DM);
  createSessionUser(sessionData[0].id, userData[0].id, roles.CONTROL);
  createSessionUser(sessionData[0].id, userData[1].id, roles.MELEEDPS);
  createSessionUser(sessionData[0].id, userData[2].id, roles.RANGEDPS);
  createSessionUser(sessionData[0].id, userData[3].id, roles.TANK);
  createSessionUser(sessionData[0].id, userData[4].id, roles.SUPPORT);
  //Session 2 with 5 users
  createSessionUser(sessionData[1].id, userData[11].id, roles.DM);
  createSessionUser(sessionData[1].id, userData[0].id, roles.FACE);
  createSessionUser(sessionData[1].id, userData[5].id, roles.MELEEDPS);
  createSessionUser(sessionData[1].id, userData[6].id, roles.RANGEDPS);
  createSessionUser(sessionData[1].id, userData[7].id, roles.TANK);
  createSessionUser(sessionData[1].id, userData[8].id, roles.SUPPORT);
  //Session 3 with 3 users
  createSessionUser(sessionData[2].id, userData[12].id, roles.DM);
  createSessionUser(sessionData[2].id, userData[2].id, roles.RANGEDPS);
  createSessionUser(sessionData[2].id, userData[3].id, roles.TANK);
  createSessionUser(sessionData[2].id, userData[5].id, roles.SUPPORT);
  //Session 4 with 1 users
  createSessionUser(sessionData[3].id, userData[10].id, roles.DM);
  createSessionUser(sessionData[3].id, userData[8].id, roles.SUPPORT);
}

async function createSessionUser(sessionID: any, userID: any, role: any) {
  await prisma.sessionUser.create({
    data: {
      sessionId: sessionID,
      userId: userID,
      role: role,
    },
  });
}

async function main() {
  if ((await prisma.session.findMany()).length > 0) return;
  const sessionData = await createSessions();
  const userData = await createUsers();
  await createSessionUsers(sessionData, userData);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
