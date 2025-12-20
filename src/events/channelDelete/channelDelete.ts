import { Event } from '#shared/discord/Event.js';
import { Events, NonThreadGuildBasedChannel, ChannelType, DMChannel } from 'discord.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import { prisma } from '#generated/prisma/client.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';

const logger = createScopedLogger('ChannelDeleteEvent');

export default new Event(Events.ChannelDelete, async (channel: DMChannel | NonThreadGuildBasedChannel) => {
  // Only handle guild text channels that could be campaigns (channels with sessions)
  if (channel.type !== ChannelType.GuildText) {
    return;
  }

  try {
    // Check if this channel is a campaign (has sessions)
    // In new architecture: Campaign.id = channel ID
    const sessions = await prisma.session.findMany({
      where: {
        campaignId: channel.id,
        status: { notIn: ['COMPLETED', 'CANCELED'] }
      }
    });

    if (sessions.length > 0) {
      logger.info(`Channel ${channel.name} (${channel.id}) was deleted. Auto-canceling ${sessions.length} session(s).`);

      for (const session of sessions) {
        try {
          await cancelSession(session.id, 'Campaign channel was deleted');
          logger.info(`Successfully canceled session ${session.id} (${session.name})`);
        } catch (error) {
          logger.error(`Failed to cancel session ${session.id}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error(`Error processing channel deletion for ${channel.id}:`, error);
  }
});
