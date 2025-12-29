import { Campaign } from '#generated/prisma/client.js';
import { prisma } from '#app/index.js';
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
  campaignId: string
): Promise<Campaign | null> => {
  return await prisma.campaign.findUnique({
    where: { id: campaignId },
  });
};

export const getAllCampaigns = async (): Promise<Campaign[]> => {
  return await prisma.campaign.findMany({
    orderBy: { name: 'asc' },
  });
};
