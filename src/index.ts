import 'dotenv/config';
import 'source-map-support/register.js';
import { ExtendedClient } from './structures/ExtendedClient.js';
import { PrismaClient } from '@prisma/client';
import { getRoles } from './db/role.js';
import { createActionRowOfButtons } from './utils/buttons.js';
import { ActionRowBuilder, ButtonBuilder, Events } from 'discord.js';
import { setRoleCache } from './models/role.js';

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
    });

    await client.login(process.env.DISCORD_TOKEN);
    
  } catch (error) {
    console.error(error);
  }
})();
