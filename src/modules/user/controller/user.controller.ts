import { ActionRowBuilder, GuildMember, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { getAllUsers, upsertUser, getUserById, addUserToCampaign, isUserInCampaign } from '../repository/user.repository.js';
import { ListUsersOptions, ListUsersResult } from '../domain/user.types.js'; // listUsers overloads for type safety
import { BotDialogs } from '../../../shared/messages/botDialogStrings.js';
import { TIMEZONES } from '../../../shared/datetime/timezoneUtils.js';

const ONBOARDING_SELECT_MENU_ID = 'onboarding-timezone-select';

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
    console.log(`New member joined: ${member.user.displayName} (${member.user.id})`);

    const dmChannel = await member.user.createDM();
    await upsertUser(member.user.id, member.user.username, dmChannel.id);
    console.log(`Added user ${member.user.username} to database`);

    const timezoneSelect = new StringSelectMenuBuilder()
      .setCustomId(ONBOARDING_SELECT_MENU_ID)
      .setPlaceholder('Select your timezone')
      .addOptions(
        TIMEZONES.map((tz) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(tz.name)
            .setDescription(`${tz.value}`)
            .setValue(tz.value)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(timezoneSelect);

    await member.send({
      content: BotDialogs.onboarding.welcome(member.user.username),
      components: [row],
    });

    console.log(`Sent onboarding DM to ${member.user.displayName}`);
  } catch (error) {
    console.error(`Failed to send onboarding DM to ${member.user.displayName}:`, error);
    // Don't throw - we don't want to break the bot if DMs are disabled
  }
};

export const syncGuildMember = async (member: GuildMember, campaignId: string): Promise<void> => {
  // Skip bots
  if (member.user.bot) {
    return;
  }

  try {
    // Check if user exists in database
    const existingUser = await getUserById(member.user.id);

    // If user doesn't exist, run onboarding flow
    if (!existingUser) {
      console.log(`  → New user detected: ${member.user.username} (${member.user.id})`);
      await newGuildMember(member);
    }

    // Check if user is already in campaign
    const isInCampaign = await isUserInCampaign(member.user.id, campaignId);

    // Add user to campaign if not already a member
    if (!isInCampaign) {
      await addUserToCampaign(member.user.id, campaignId);
      console.log(`  → Added ${member.user.username} to campaign`);
    }
  } catch (error) {
    console.error(`  ✗ Failed to sync user: ${member.user.username} (${member.user.id})`, error);
    throw error;
  }
};