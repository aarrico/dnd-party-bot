import { Campaign } from '@prisma/client';
import { prisma } from '../index.js';

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
      const guild = await upsertGuild(discordGuild);
      syncedGuilds.push(guild);
      console.log(`✓ Synced guild: ${guild.name} (${guild.id})`);
    } catch (error) {
      console.error(`✗ Failed to sync guild: ${discordGuild.name} (${discordGuild.id})`, error);
    }
  }
  
  return syncedGuilds;
};
