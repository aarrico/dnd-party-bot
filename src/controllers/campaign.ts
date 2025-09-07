import { Campaign } from "@prisma/client";
import { ChannelType } from "discord.js";
import { client } from "..";
import { createCampaign, getActiveCampaign, getAllCampaigns } from "../db/campaign";

export const findCampaign = async (
  guildId: string,
  campaignOption: string,
  newCampaignName?: string
): Promise<Campaign> => {
  let campaign;
  if (campaignOption === 'new' && newCampaignName) {
    const guild = await client.guilds.fetch(guildId);
    const categoryChannel = await guild.channels.create({
      name: newCampaignName,
      type: ChannelType.GuildCategory,
    });

    campaign = await createCampaign({
      id: categoryChannel.id,
      name: newCampaignName,
      guildId: guildId,
      active: false, // Default to false as specified
    });
  } else if (campaignOption === 'active') {
    campaign = await getActiveCampaign(guildId);
    if (!campaign) {
      throw new Error('No active campaign found. Please create or activate a campaign first.');
    }
  } else {
    const campaigns = await getAllCampaigns(guildId);
    campaign = campaigns.find(c => c.id === campaignOption);
    if (!campaign) {
      throw new Error('Specified campaign not found.');
    }
  }

  return campaign;
};