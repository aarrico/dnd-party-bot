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
    messageId: "1",
    name: "Session 1",
    date: new Date(),
    channelId: "1",
  },
  {
    messageId: "2",
    name: "Session 2",
    date: new Date(),
    channelId: "2",
  },
  {
    messageId: "3",
    name: "Session 3",
    date: new Date(),
    channelId: "3",
  },
  {
    messageId: "4",
    name: "Session 4",
    date: new Date(),
    channelId: "4",
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

async function createParties(sessionData: any, userData: any) {
  //Session 1 with 5 users
  addPartyMember(sessionData[0].id, userData[10].id, roles.DM);
  addPartyMember(sessionData[0].id, userData[0].id, roles.CONTROL);
  addPartyMember(sessionData[0].id, userData[1].id, roles.MELEEDPS);
  addPartyMember(sessionData[0].id, userData[2].id, roles.RANGEDPS);
  addPartyMember(sessionData[0].id, userData[3].id, roles.TANK);
  addPartyMember(sessionData[0].id, userData[4].id, roles.SUPPORT);
  //Session 2 with 5 users
  addPartyMember(sessionData[1].id, userData[11].id, roles.DM);
  addPartyMember(sessionData[1].id, userData[0].id, roles.FACE);
  addPartyMember(sessionData[1].id, userData[5].id, roles.MELEEDPS);
  addPartyMember(sessionData[1].id, userData[6].id, roles.RANGEDPS);
  addPartyMember(sessionData[1].id, userData[7].id, roles.TANK);
  addPartyMember(sessionData[1].id, userData[8].id, roles.SUPPORT);
  //Session 3 with 3 users
  addPartyMember(sessionData[2].id, userData[12].id, roles.DM);
  addPartyMember(sessionData[2].id, userData[2].id, roles.RANGEDPS);
  addPartyMember(sessionData[2].id, userData[3].id, roles.TANK);
  addPartyMember(sessionData[2].id, userData[5].id, roles.SUPPORT);
  //Session 4 with 1 users
  addPartyMember(sessionData[3].id, userData[10].id, roles.DM);
  addPartyMember(sessionData[3].id, userData[8].id, roles.SUPPORT);
}

async function addPartyMember(sessionID: any, userID: any, role: any) {
  await prisma.partyMember.create({
    data: {
      sessionId: sessionID,
      userId: userID,
      role: role,
    },
  });
}

async function main() {
  if ((await prisma.session.findMany())?.length > 0) return;
  const sessionData = await createSessions();
  const userData = await createUsers();
  await createParties(sessionData, userData);
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
