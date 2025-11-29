import { config } from 'dotenv';
config();
import 'source-map-support/register.js';
import { ExtendedClient } from './shared/discord/ExtendedClient.js';
import { PrismaClient } from './generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { getRoles } from './modules/role/repository/role.repository.js';
import { createActionRowOfButtons } from './shared/discord/buttons.js';
import { ActionRowBuilder, ButtonBuilder, Events } from 'discord.js';
import { setRoleCache } from './modules/role/domain/roleManager.js';
import { sessionScheduler } from './services/sessionScheduler.js';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const client = new ExtendedClient();
export const prisma = new PrismaClient({ adapter });
export let roleButtons: ActionRowBuilder<ButtonBuilder>[];

await (async () => {
  try {
    const roles = await getRoles();
    setRoleCache(roles);
    roleButtons = createActionRowOfButtons(roles);

    client.once(Events.ClientReady, (readyClient) => {
      void client.start();
      console.log(`Ready! Logged in as ${readyClient.user.tag}`);

      void (async () => {
        try {
          await sessionScheduler.initializeExistingSessions();
          console.log(`Session scheduler initialized with ${sessionScheduler.getScheduledTaskCount()} scheduled tasks`);
        } catch (error) {
          console.error('Failed to initialize session scheduler:', error);
        }
      })();
    });

    await client.login(process.env.DISCORD_TOKEN);

  } catch (error) {
    console.error(error);
  }
})();

// Graceful shutdown handling
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Stop the session scheduler
    console.log('Stopping session scheduler...');
    if (sessionScheduler && typeof sessionScheduler.shutdown === 'function') {
      sessionScheduler.shutdown();
    }

    // Destroy Discord client connection
    console.log('Closing Discord connection...');
    await client.destroy();

    // Disconnect from database
    console.log('Closing database connection...');
    await prisma.$disconnect();

    console.log('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Handle termination signals
process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
