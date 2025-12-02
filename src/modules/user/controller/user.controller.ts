import { GuildMember } from 'discord.js';
import { getAllUsers, upsertUser, getUserById, addUserToCampaign, isUserInCampaign } from '../repository/user.repository.js';
import { ListUsersOptions, ListUsersResult } from '../domain/user.types.js';
import { sendTimezoneOnboardingDM } from '../../../shared/datetime/timezoneUtils.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('UserController');

// listUsers overloads for type safety
export function listUsers(
  options: ListUsersOptions,
  asString: true
): Promise<string>;
export function listUsers(
  options: ListUsersOptions,
  asString: false
): Promise<ListUsersResult[]>;
export function listUsers(
  options: ListUsersOptions,
  asString?: boolean
): Promise<ListUsersResult[] | string>;

// listUsers implementation
export async function listUsers(
  options: ListUsersOptions,
  asString = false
): Promise<ListUsersResult[] | string> {
  const users = await getAllUsers(options);
  return asString ? formatAsString(users, options) : users;
}

const formatAsString = (
  users: ListUsersResult[],
  options: ListUsersOptions,
  delimiter = ', '
): string => {
  const header = [
    'Username',
    options.includeUserId && 'User Id',
    options.includeUserDMMessageId && 'User Channel Id',
  ].filter(Boolean);

  const data = users.map((user) => {
    return [
      user.username,
      options.includeUserId && user.id,
      options.includeUserDMMessageId && user.channelId,
    ].filter(Boolean);
  });

  return [header, ...data].map((row) => row.join(delimiter)).join('\n');
};

export const newGuildMember = async (member: GuildMember) => {
  if (member.user.bot) {
    return;
  }

  try {
    logger.info('New guild member joined', {
      userId: member.user.id,
      username: member.user.username,
      displayName: member.user.displayName,
      guildId: member.guild.id,
    });

    const dmChannel = await member.user.createDM();
    await upsertUser(member.user.id, member.user.username, dmChannel.id);
    logger.info('Added user to database', { userId: member.user.id });

    await sendTimezoneOnboardingDM(member.user);

    await addUserToCampaign(member.user.id, member.guild.id);
  } catch (error) {
    logger.error('Failed to add new guild member', {
      displayName: member.user.displayName,
      userId: member.user.id,
      error,
    });
    // Don't throw - we don't want to break the bot if DMs are disabled
  }
};

export const syncGuildMember = async (member: GuildMember, campaignId: string): Promise<void> => {
  if (member.user.bot) {
    return;
  }

  try {
    const existingUser = await getUserById(member.user.id);
    if (!existingUser) {
      logger.info('New user detected during sync', {
        userId: member.user.id,
        username: member.user.username,
        campaignId,
      });
      await newGuildMember(member);
      return;
    }

    const isInCampaign = await isUserInCampaign(member.user.id, campaignId);
    if (!isInCampaign) {
      await addUserToCampaign(member.user.id, campaignId);
      logger.info('Added user to campaign', {
        userId: member.user.id,
        username: member.user.username,
        campaignId,
      });
    }
  } catch (error) {
    logger.error('Failed to sync user', {
      userId: member.user.id,
      username: member.user.username,
      campaignId,
      error,
    });
    throw error;
  }
};