import { prisma } from '../index.js';
import { Campaign, Prisma } from '@prisma/client';

export const getActiveCampaign = async (guildId: string): Promise<Campaign | null> => {
  try {
    return await prisma.campaign.findFirst({
      where: {
        guildId,
        active: true,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      console.error(
        'Error: Attempted to create multiple active campaigns for a guild.'
      );
      throw new Error('Multiple active campaigns are not allowed.');
    } else {
      console.error('An unexpected error occurred:', err);
      throw err;
    }
  }
};

export const createCampaign = async (campaignData: {
  id: string;
  name: string;
  guildId: string;
  active?: boolean;
}): Promise<Campaign> => {
  try {
    return await prisma.campaign.create({
      data: {
        id: campaignData.id,
        name: campaignData.name,
        guildId: campaignData.guildId,
        active: campaignData.active ?? false,
      },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      console.error(
        'Error: Attempted to create duplicate campaign or multiple active campaigns for a guild.'
      );
      throw new Error('Campaign already exists or multiple active campaigns are not allowed.');
    } else {
      console.error('An unexpected error occurred:', err);
      throw err;
    }
  }
};

export const getAllCampaigns = async (guildId: string): Promise<Campaign[]> => {
  return await prisma.campaign.findMany({
    where: { guildId },
    orderBy: { name: 'asc' },
  });
};
