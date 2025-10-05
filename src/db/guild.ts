import { Campaign } from '@prisma/client';
import { prisma } from '../index.js';
import { client } from '../index.js';
import { syncGuildMember } from '../controllers/users.js';

export const upsertGuild = async (guildData: { id: string; name: string }): Promise<Campaign> => {
  return await prisma.campaign.upsert({
    where: { id: guildData.id },
    create: {
      id: guildData.id,
      name: guildData.name,
    },
    update: {
      name: guildData.name,
      updatedAt: new Date(),
    },
  });
};

export const getGuildById = async (guildId: string): Promise<Campaign | null> => {
  return await prisma.campaign.findUnique({
    where: { id: guildId },
  });
};

export const getAllGuilds = async (): Promise<Campaign[]> => {
  return await prisma.campaign.findMany({
    orderBy: { name: 'asc' },
  });
};

export const syncGuildsFromDiscord = async (discordGuilds: { id: string; name: string }[]): Promise<Campaign[]> => {
  const syncedGuilds: Campaign[] = [];

  for (const discordGuild of discordGuilds) {
    try {
      // Sync the guild itself
      const guild = await upsertGuild(discordGuild);
      syncedGuilds.push(guild);
      console.log(`✓ Synced guild: ${guild.name} (${guild.id})`);

      // Fetch Discord guild to get members
      const discordGuildFull = await client.guilds.fetch(discordGuild.id);
      const members = await discordGuildFull.members.fetch();

      // Sync users and create campaign member entries
      for (const [, member] of members) {
        try {
          await syncGuildMember(member, guild.id);
        } catch {
          // Error already logged in syncGuildMember
        }
      }

      console.log(`  ✓ Synced ${members.size} members for ${guild.name}`);
    } catch (error) {
      console.error(`✗ Failed to sync guild: ${discordGuild.name} (${discordGuild.id})`, error);
    }
  }

  return syncedGuilds;
};
