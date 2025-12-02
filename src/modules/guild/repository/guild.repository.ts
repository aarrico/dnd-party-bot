import { Campaign } from '#generated/prisma/client.js';
import { prisma } from '#app/index.js';
import { client } from '#app/index.js';
import { syncGuildMember } from '#modules/user/controller/user.controller.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('GuildRepository');

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
  logger.info('Starting guild sync from Discord', { guildCount: discordGuilds.length });

  for (const discordGuild of discordGuilds) {
    try {
      // Sync the guild itself
      const guild = await upsertGuild(discordGuild);
      syncedGuilds.push(guild);
      logger.info('Synced guild', { guildId: guild.id, guildName: guild.name });

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

      logger.info('Synced guild members', {
        guildId: guild.id,
        memberCount: members.size,
      });
    } catch (error) {
      logger.error('Failed to sync guild', {
        guildId: discordGuild.id,
        guildName: discordGuild.name,
        error,
      });
    }
  }

  logger.info('Guild sync complete', {
    totalGuilds: discordGuilds.length,
    syncedGuilds: syncedGuilds.length,
  });

  return syncedGuilds;
};
