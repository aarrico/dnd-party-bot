import 'dotenv/config';
import 'source-map-support/register.js';
import { ExtendedClient } from './structures/ExtendedClient';
import { PrismaClient } from '@prisma/client';
import { getRoles } from './db/role';
import { createActionRowOfButtons } from './utils/buttons';
import { ActionRowBuilder, ButtonBuilder } from 'discord.js';

export const client = new ExtendedClient();
export const prisma = new PrismaClient();
export let roleButtons: ActionRowBuilder<ButtonBuilder>[];

(async () => {
  try {
    roles.push(...(await getRoles()));
    roleButtons = createActionRowOfButtons(roles);

    client.login(process.env.TOKEN);
    client.start();
  } catch (error) {
    console.error(error);
  }
})();

// TODO - update db logic to use new schema
// TODO - create methods to handle guild and campaign tables
// TODO - remove role selection msg once session has started!
// TODO - clean up utils dir
// TODO - refactor AttachmentBuilder
// TODO - remove ExtendedInteraction objects as params in controllers
// TODO - use new icons
// TODO - clean up errors from adding PartyMember to typings
