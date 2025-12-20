import { Campaign } from '#generated/prisma/client.js';
import { prisma } from '#app/index.js';
import { client } from '#app/index.js';
import { syncGuildMember } from '#modules/user/controller/user.controller.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('CampaignRepository');

export const upsertCampaign = async (campaignData: {
  id: string;
  guildId: string;
  name: string;
}): Promise<Campaign> => {
  return await prisma.campaign.upsert({
    where: { id: campaignData.id },
    create: {
      id: campaignData.id,
      guildId: campaignData.guildId,
      name: campaignData.name,
    },
    update: {
      name: campaignData.name,
      guildId: campaignData.guildId,
      updatedAt: new Date(),
    },
  });
};

export const getCampaignById = async (
  guildId: string
): Promise<Campaign | null> => {
  return await prisma.campaign.findUnique({
    where: { id: guildId },
  });
};

export const getAllCampaigns = async (): Promise<Campaign[]> => {
  return await prisma.campaign.findMany({
    orderBy: { name: 'asc' },
  });
};

export const syncCampaignsFromDiscord = async (
  discordCampaigns: { id: string; guildId: string, name: string }[]
): Promise<Campaign[]> => {
  const syncedCampaigns: Campaign[] = [];
  logger.info('Starting guild sync from Discord', {
    campaignCount: discordCampaigns.length,
  });

  for (const discordCampaign of discordCampaigns) {
    try {
      // Sync the guild itself
      const campaign = await upsertCampaign(discordCampaign);
      syncedCampaigns.push(campaign);
      logger.info('Synced campaign', { campaignId: campaign.id, campaignName: campaign.name });

      // Fetch Discord guild to get members
      const discordGuildFull = await client.guilds.fetch(discordCampaign.id);
      const members = await discordGuildFull.members.fetch();

      // Sync users and create campaign member entries
      for (const [, member] of members) {
        try {
          await syncGuildMember(member, campaign.id);
        } catch {
          // Error already logged in syncGuildMember
        }
      }

      logger.info('Synced guild members', {
        guildId: campaign.id,
        memberCount: members.size,
      });
    } catch (error) {
      logger.error('Failed to sync guild', {
        guildId: discordCampaign.id,
        guildName: discordCampaign.name,
        error,
      });
    }
  }

  logger.info('Guild sync complete', {
    totalGuilds: discordCampaigns.length,
    syncedGuilds: syncedCampaigns.length,
  });

  return syncedCampaigns;
};
