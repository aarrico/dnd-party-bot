import 'dotenv/config';
import 'source-map-support/register.js';
import { ExtendedClient } from './structures/ExtendedClient';
import { PrismaClient } from '@prisma/client';
import { getRoles } from './db/role';
import { Role } from '@prisma/client';

export const client = new ExtendedClient();
export const prisma = new PrismaClient();
export const roles: Role[] = [];

(async () => {
  try {
    roles.push(...(await getRoles()));

    client.login(process.env.TOKEN);
    client.start();
  } catch (error) {
    console.error(error);
  }
})();
