const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const alice = await prisma.session.create({
    data: {
        sessionMessageId: '1',
        sessionName: 'Session 1',
        sessionDate: new Date()
    } 
  })

  const bob = await prisma.user.create({
    data: {
        username: "yorgy",
    userChannelId: '12313213',
    } 
    
  })

  const christy = await prisma.sessionUser.create({
    data: {
        sessionId: alice.id,
        userId: bob.id,
        role: 'Range-DPS'
        }
  });
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })