import { prisma } from '../index';
import { Prisma } from '@prisma/client';

export const getActiveCampaign = async (guildId: string) => {
  try {
    return await prisma.campaign.findFirstOrThrow({
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
