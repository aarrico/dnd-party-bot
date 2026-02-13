import {
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventEntityType,
  GuildScheduledEvent,
} from 'discord.js';
import { client } from '#app/index.js';
import { safeGuildFetch } from '#shared/discord/discordErrorHandler.js';
import { retryWithBackoff } from '#shared/discord/retryWithBackoff.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('ScheduledEventService');

/**
 * Default session duration in hours
 */
const DEFAULT_SESSION_DURATION_HOURS = 4;

/**
 * Creates a Discord scheduled event for a tabletop RPG session
 * @param guildId - The Discord guild/server ID
 * @param sessionName - Name of the session
 * @param sessionDate - Start date/time of the session
 * @param channelId - Optional channel ID to associate with the event
 * @returns The created scheduled event ID, or null if creation failed
 */
export const createScheduledEvent = async (
  guildId: string,
  sessionName: string,
  sessionDate: Date,
  channelId?: string
): Promise<string | null> => {
  logger.debug('Creating scheduled event', {
    guildId,
    sessionName,
    sessionDate: sessionDate.toISOString(),
    channelId,
  });

  try {
    const guild = await safeGuildFetch(client, guildId);
    if (!guild) {
      logger.warn('Guild not found for scheduled event creation', { guildId });
      return null;
    }

    const endTime = new Date(
      sessionDate.getTime() + DEFAULT_SESSION_DURATION_HOURS * 60 * 60 * 1000
    );

    const event: GuildScheduledEvent = await retryWithBackoff(async () => {
      return await guild.scheduledEvents.create({
        name: sessionName,
        scheduledStartTime: sessionDate,
        scheduledEndTime: endTime,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        entityMetadata: {
          location: channelId
            ? `Session Channel: #${channelId}`
            : 'Game Session',
        },
        description: `🎲 Click "Interested" to get notifications about this session!\n`,
      });
    });

    logger.info('Created scheduled event', {
      guildId,
      eventId: event.id,
      sessionName,
    });
    return event.id;
  } catch (error) {
    logger.error('Failed to create scheduled event', {
      guildId,
      sessionName,
      error,
    });
    return null;
  }
};

/**
 * Updates an existing Discord scheduled event
 * @param guildId - The Discord guild/server ID
 * @param eventId - The scheduled event ID to update
 * @param updates - Object containing fields to update
 * @returns True if successful, false otherwise
 */
export const updateScheduledEvent = async (
  guildId: string,
  eventId: string,
  updates: {
    name?: string;
    scheduledStartTime?: Date;
    description?: string;
  }
): Promise<boolean> => {
  try {
    const guild = await safeGuildFetch(client, guildId);
    if (!guild) {
      logger.warn('Guild not found for scheduled event update', {
        guildId,
        eventId,
      });
      return false;
    }

    const event = await retryWithBackoff(async () => {
      return await guild.scheduledEvents.fetch(eventId);
    });

    if (!event) {
      logger.warn('Scheduled event not found for update', { guildId, eventId });
      return false;
    }

    const updateData: {
      name?: string;
      scheduledStartTime?: Date;
      scheduledEndTime?: Date;
      description?: string;
    } = {};

    if (updates.name) {
      updateData.name = updates.name;
    }

    if (updates.scheduledStartTime) {
      updateData.scheduledStartTime = updates.scheduledStartTime;
      updateData.scheduledEndTime = new Date(
        updates.scheduledStartTime.getTime() +
          DEFAULT_SESSION_DURATION_HOURS * 60 * 60 * 1000
      );
    }

    if (updates.description) {
      updateData.description = updates.description;
    }

    await retryWithBackoff(async () => {
      return await event.edit(updateData);
    });

    logger.info('Updated scheduled event', { guildId, eventId });
    return true;
  } catch (error) {
    logger.error('Failed to update scheduled event', {
      guildId,
      eventId,
      error,
    });
    return false;
  }
};

/**
 * Deletes a Discord scheduled event
 * @param guildId - The Discord guild/server ID
 * @param eventId - The scheduled event ID to delete
 * @returns True if successful, false otherwise
 */
export const deleteScheduledEvent = async (
  guildId: string,
  eventId: string
): Promise<boolean> => {
  try {
    const guild = await safeGuildFetch(client, guildId);
    if (!guild) {
      logger.warn('Guild not found for scheduled event deletion', {
        guildId,
        eventId,
      });
      return false;
    }

    const event = await retryWithBackoff(async () => {
      return await guild.scheduledEvents.fetch(eventId);
    });

    if (!event) {
      logger.warn('Scheduled event not found or already deleted', {
        guildId,
        eventId,
      });
      return false;
    }

    await retryWithBackoff(async () => {
      return await event.delete();
    });

    logger.info('Deleted scheduled event', { guildId, eventId });
    return true;
  } catch (error) {
    logger.error('Failed to delete scheduled event', {
      guildId,
      eventId,
      error,
    });
    return false;
  }
};

/**
 * Cancels a scheduled event by setting its status to CANCELED
 * This keeps the event visible but marked as canceled
 * @param guildId - The Discord guild/server ID
 * @param eventId - The scheduled event ID to cancel
 * @param reason - Optional cancellation reason to append to description
 * @returns True if successful, false otherwise
 */
export const cancelScheduledEvent = async (
  guildId: string,
  eventId: string,
  reason?: string
): Promise<boolean> => {
  try {
    const guild = await safeGuildFetch(client, guildId);
    if (!guild) {
      logger.warn('Guild not found for scheduled event cancellation', {
        guildId,
        eventId,
      });
      return false;
    }

    const event = await retryWithBackoff(async () => {
      return await guild.scheduledEvents.fetch(eventId);
    });

    if (!event) {
      logger.warn('Scheduled event not found for cancellation', {
        guildId,
        eventId,
      });
      return false;
    }

    let description = event.description || '';
    if (reason) {
      description = `❌ **CANCELED**\n\nReason: ${reason}\n\n---\n${description}`;
    } else {
      description = `❌ **CANCELED**\n\n---\n${description}`;
    }

    await retryWithBackoff(async () => {
      return await event.edit({
        description,
        status: 4, // CANCELED status
      });
    });

    logger.info('Canceled scheduled event', { guildId, eventId, reason });
    return true;
  } catch (error) {
    logger.error('Failed to cancel scheduled event', {
      guildId,
      eventId,
      error,
    });
    return false;
  }
};
