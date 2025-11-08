import 'dotenv/config';
import 'source-map-support/register.js';
import { ExtendedClient } from './shared/discord/ExtendedClient.js';
import { PrismaClient } from '@prisma/client';
import { getRoles } from './modules/role/repository/role.repository.js';
import { createActionRowOfButtons } from './shared/discord/buttons.js';
import { ActionRowBuilder, ButtonBuilder, Events } from 'discord.js';
import { setRoleCache } from './modules/role/domain/roleManager.js';
import { sessionScheduler } from './services/sessionScheduler.js';

export const client = new ExtendedClient();
export const prisma = new PrismaClient();
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
