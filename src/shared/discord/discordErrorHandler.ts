import { retryWithBackoff, RetryOptions } from './retryWithBackoff.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('DiscordErrorHandler');
import {
  Client,
  Guild,
  Channel,
  TextChannel,
  User,
  Message,
  GuildMember,
  MessagePayload,
  MessageCreateOptions,
  MessageEditOptions,
  GuildChannelEditOptions,
  GuildChannelCreateOptions,
  PermissionOverwriteOptions,
  DMChannel,
} from 'discord.js';

/**
 * Default retry options for Discord API calls
 */
const DEFAULT_DISCORD_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  onRetry: (attempt, error: unknown, delayMs) => {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: string }).code)
          : 'Unknown';
    logger.warn('Discord API retry attempt', {
      attempt,
      delayMs,
      error: errorMsg,
    });
  },
};

/**
 * Safely fetch a guild with automatic retry
 */
export async function safeGuildFetch(
  client: Client,
  guildId: string,
  options?: RetryOptions
): Promise<Guild> {
  return retryWithBackoff(
    async () => {
      const guild = await client.guilds.fetch(guildId);
      if (!guild) {
        throw new Error(`Guild ${guildId} not found`);
      }
      return guild;
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely fetch a channel with automatic retry
 */
export async function safeChannelFetch(
  client: Client,
  channelId: string,
  options?: RetryOptions
): Promise<Channel> {
  return retryWithBackoff(
    async () => {
      const channel = await client.channels.fetch(channelId);
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }
      return channel;
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely fetch a user with automatic retry
 */
export async function safeUserFetch(
  client: Client,
  userId: string,
  options?: RetryOptions
): Promise<User> {
  return retryWithBackoff(
    async () => {
      const user = await client.users.fetch(userId);
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      return user;
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely fetch guild members with automatic retry
 */
export async function safeGuildMembersFetch(
  guild: Guild,
  options?: RetryOptions
): Promise<Map<string, GuildMember>> {
  return retryWithBackoff(
    async () => {
      return await guild.members.fetch();
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely fetch a single guild member with automatic retry
 */
export async function safeGuildMemberFetch(
  guild: Guild,
  userId: string,
  options?: RetryOptions
): Promise<GuildMember> {
  return retryWithBackoff(
    async () => {
      const member = await guild.members.fetch(userId);
      if (!member) {
        throw new Error(
          `Guild member ${userId} not found in guild ${guild.id}`
        );
      }
      return member;
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely send a message to a channel with automatic retry
 */
export async function safeChannelSend(
  channel: TextChannel,
  content: string | MessagePayload | MessageCreateOptions,
  options?: RetryOptions
): Promise<Message> {
  return retryWithBackoff(
    async () => {
      return await channel.send(content);
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely send a DM to a user with automatic retry
 */
export async function safeUserSend(
  user: User,
  content: string | MessagePayload | MessageCreateOptions,
  options?: RetryOptions
): Promise<Message> {
  return retryWithBackoff(
    async () => {
      return await user.send(content);
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely create a DM channel with automatic retry
 */
export async function safeCreateDM(
  user: User,
  options?: RetryOptions
): Promise<DMChannel> {
  return retryWithBackoff(
    async () => {
      return await user.createDM();
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely edit a message with automatic retry
 */
export async function safeMessageEdit(
  message: Message,
  content: string | MessagePayload | MessageEditOptions,
  options?: RetryOptions
): Promise<Message> {
  return retryWithBackoff(
    async () => {
      return await message.edit(content);
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely delete a message with automatic retry
 */
export async function safeMessageDelete(
  message: Message,
  options?: RetryOptions
): Promise<Message> {
  return retryWithBackoff(
    async () => {
      return await message.delete();
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely fetch a message with automatic retry
 */
export async function safeMessageFetch(
  channel: TextChannel,
  messageId: string,
  options?: RetryOptions
): Promise<Message> {
  return retryWithBackoff(
    async () => {
      return await channel.messages.fetch(messageId);
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely delete a channel with automatic retry
 */
export async function safeChannelDelete(
  channel: Channel,
  reason?: string,
  options?: RetryOptions
): Promise<Channel> {
  return retryWithBackoff(
    async () => {
      return await channel.delete(reason);
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely edit a channel with automatic retry
 */
export async function safeChannelEdit(
  channel: TextChannel,
  data: GuildChannelEditOptions,
  options?: RetryOptions
): Promise<TextChannel> {
  return retryWithBackoff(
    async () => {
      return await channel.edit(data);
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely create a channel with automatic retry
 */
export async function safeChannelCreate(
  guild: Guild,
  data: GuildChannelCreateOptions,
  options?: RetryOptions
): Promise<TextChannel> {
  return retryWithBackoff(
    async () => {
      return await guild.channels.create(data);
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}

/**
 * Safely edit permission overwrites with automatic retry
 */
export async function safePermissionOverwritesEdit(
  channel: TextChannel,
  userOrRoleId: string,
  permissions: PermissionOverwriteOptions,
  options?: RetryOptions
): Promise<TextChannel> {
  return retryWithBackoff(
    async () => {
      await channel.permissionOverwrites.edit(userOrRoleId, permissions);
      return channel;
    },
    { ...DEFAULT_DISCORD_RETRY_OPTIONS, ...options }
  );
}
