import { Session } from '@prisma/client';
import { PartyMember, RoleSelectionStatus } from '../models/party.js';
import path from 'path';
import os from 'os';
import { Guild } from 'discord.js';
import { formatSessionDateLong } from './dateUtils.js';
import { format } from 'date-fns';


export const BotDialogs = {
  // CreateSession
  createSessionInvalidSessionName: 'Your session name is invalid.',
  createSessionDMSessionTime: (
    campaign: Guild,
    session: Pick<Session, 'name' | 'id' | 'partyMessageId' | 'date'>,
    timezone: string,
  ) =>
    `🤖 New session [${session.name}](https://discord.com/channels/${campaign.id}/${session.id}/${session.partyMessageId}) for ${campaign.name} scheduled for ${formatSessionDateLong(session.date, timezone)}`,
  createSessionOneMoment:
    '🤖 One moment while I create your session. You will receive a message via Direct Message when complete!',
  createSessionInvalidDateEntered:
    "🤖 The date you entered is invalid. This could be due to the following reasons:\n- You entered a date that doesn't exist.\n- You entered a day that has already passed.",
  createSessionSuccess: (sessionName: string, date: Date, channelId: string) =>
    `✅ **${sessionName}** session has been created!\n📅 Scheduled for: ${format(date, 'PPP')}\n🎲 Join the session: <#${channelId}>`,
  createSessionSuccessFallback: (sessionName: string, date: Date, channelName: string) =>
    `✅ **${sessionName}** session has been created!\n📅 Scheduled for: ${format(date, 'PPP')}\n🎲 Join the session: #${channelName}`,
  createSessionError: '❌ There was an error creating the session. Please try again.',

  sessions: {
    listAllResult: '🤖🎉 Report for all scheduled sessions is ready!',
    forUserResult: (username: string) =>
      `🤖🎉 Report for all sessions ${username} has signed up for is ready!`,
    allUsersResult: (session: string) =>
      `🤖🎉 Report for all users in session ${session} is ready!`,
    updated: (
      name: string
    ) => `🎉 Session ${name} has been updated successfully.\n🖌️ Generating new image...give me a few seconds!`,
    scheduled: (
      date: Date,
      timezone: string
    ) => `🗓️ ${formatSessionDateLong(date, timezone)}!`,
  },

  users: {
    listAllResult:
      '🤖🎉 Report for all users that have participated in any campaign is ready!',
  },

  onboarding: {
    welcome: (username: string) =>
      `👋 Welcome to the Party Manager Bot, ${username}!\n\n` +
      `To get started, please select your timezone. This will be used to display session times in your local time when you receive direct messages.`,
    timezoneSet: (timezone: string) =>
      `✅ Great! Your timezone has been set to **${timezone}**.\n\n` +
      `_Need to change it later? Just send me a message with "timezone" and I'll help you update it!_`,
  },

  // InteractionCreate responses
  interactionCreateNonexistentCommand:
    '🤖 You have used a nonexistent command!',
  interactionCreateNewSessionAnnouncement:
    '🤖 Hello everyone, we have a new session for people to join!',

  roleChosenMessageContent: {
    welcomeToParty: (username: string, role: string) =>
      `🤖 Welcome to the Party ${username}. You have been added as a ${role}!`,
    farewell: (username: string) =>
      `🤖 Farewell, ${username}! You have been removed from the session! To rejoin, click a role button!`,
    roleSwap: (username: string, role: string) =>
      `🤖 Deciding to change the game, ${username}? You have been changed to a ${role}!`,
    partyFull:
      '🤖 Unfortunately, this party is full and no new users can be added at present!',
    dmCantSwap: '🤖 You cannot change roles as you are the Game Master!',
    sessionLocked: '🔒 This session is locked and no longer accepting role changes.',
    noActionTaken: '🤖 No Action was taken. Something went wrong',
  },
} as const;

export const getAddPartyMemberMsg = (
  status: RoleSelectionStatus,
  member: PartyMember
) => {
  switch (status) {
    case RoleSelectionStatus.ADDED_TO_PARTY:
      return BotDialogs.roleChosenMessageContent.welcomeToParty(
        member.username,
        member.role
      );
    case RoleSelectionStatus.REMOVED_FROM_PARTY:
      return BotDialogs.roleChosenMessageContent.farewell(member.username);
    case RoleSelectionStatus.ROLE_CHANGED:
      return BotDialogs.roleChosenMessageContent.roleSwap(
        member.username,
        member.role
      );
    case RoleSelectionStatus.PARTY_FULL:
      return BotDialogs.roleChosenMessageContent.partyFull;
    case RoleSelectionStatus.INVALID:
      return BotDialogs.roleChosenMessageContent.dmCantSwap;
    case RoleSelectionStatus.LOCKED:
      return BotDialogs.roleChosenMessageContent.sessionLocked;
    default:
      return BotDialogs.roleChosenMessageContent.noActionTaken;
  }
};

//potential resolve path here instead.
export const BotPaths = {
  TempDir: process.env.TEMP_DIR || os.tmpdir(),
  SessionBackdrop: path.join(process.cwd(), 'resources/images/backdrop.png'),
};

export enum BotAttachmentFileNames {
  SessionsUserHasSignedUpFor = 'SessionsUserHasSignedUpFor.txt',
  AllSessionInformation = 'AllSessionInformation.txt',
  AllUserInformation = 'AllUserInformation.txt',
  AllUsersInSessionInformation = 'AllUsersInSessionInformation.txt',
  CurrentSession = 'current-session.png',
}

export enum BotCommandInfo {
  CreateSessionName = 'create-session',
  CreateSessionDescription = 'creates an session in the session stack.',
  //GetAllUserSessions
  GetAllUserSessions_Name = 'get-all-sessions-a-user-is-in',
  GetAllUserSessions_Description = 'Retrieves a list of all sessions that a user has signed up for from the db.',
  //GetAllSessions
  GetAllSessions_Name = 'get-all-sessions',
  GetAllSessions_Description = 'Retrieves a list of all sessions added to db by bot.',
  //GetAllUsersInASession
  GetAllUsersInASession_Name = 'get-all-users-in-a-session',
  GetAllUsersInASession_Description = 'Retrieves a list of all users in a particular session via Session UUID string added to db by bot.',
  //GetAllUsers
  GetAllUsers_Name = 'get-all-users',
  GetAllUsers_Description = 'Retrieves a list of all users added to db by bot.',
}

export enum BotCommandOptionInfo {
  SessionId_Name = 'session-id',
  SessionId_Description = 'Channel ID of the session - found by right-clicking channel.',
  UserId_Name = 'user-id',
  UserId_Description = 'User ID of the session - found by right-clicking user.',
  SessionTime_Name = 'session-date-time',
  SessionTime_Description = 'Date/Time of session in DB',
  CampaignName_Name = 'campaign-name',
  CampaignId_Name = 'campaign-id',
  CampaignId_Description = 'Campaign ID of the session - found by right-clicking campaign channel. Defaults to active campaign.',
  //CreateSession
  CreateSession_SessionName = 'session-name',
  CreateSession_SessionName_Description = 'Name of session',
  CreateSession_MonthName = 'month',
  CreateSession_MonthDescription = 'Month of session',
  CreateSession_DayName = 'day',
  CreateSession_DayDescription = 'Day of session',
  CreateSession_YearName = 'year',
  CreateSession_YearDescription = 'Year of session',
  CreateSession_TimeName = 'time',
  CreateSession_TimeDescription = 'Time in 12-hour (7:00 PM) or 24-hour (19:00) format',
  //GetAllUserSessions
  GetAllUserSessions_UserIDDescription = 'User ID that you are finding the sessions for.',
  GetAllUserSessions_SessionIDDescription = 'UUID of session in DB(unique identifier)',
  GetAllUserSessions_UserRoleName = 'user-role-in-this-session',
  GetAllUserSessions_UserRoleDescription = 'User role for session',
  GetAllUserSessions_SessionMessageIDName = 'session-message-id',
  GetAllUserSessions_SessionMessageIDDescription = 'discord message id for session',
  //GetAllSessions
  GetAllSessions_SessionMessageIDName = 'session-message-id',
  GetAllSessions_SessionMessageIDDescription = 'Discord message ID for session list',
  //GetAllUsersInASession
  GetAllUsersInASession_UserIDDescription = 'UUID of user in DB(unique identifier)',
  GetAllUsersInASession_UserRoleName = 'user-role-in-this-session',
  GetAllUsersInASession_UserRoleDescription = 'Discord message ID for this session',
  GetAllUsersInASession_UserChannelIDName = 'user-channel-id',
  GetAllUsersInASession_UserChannelIDDescription = 'User DM channel id',
  //GetAllUsers
  GetAllUsers_UserChannelIDName = 'user-dm-channel-id',
  GetAllUsers_UserChannelIDDescription = 'User DM channel ID',
  CancelSession_Name = 'cancel-session',
  CancelSession_Description = 'Deletes an session from a campaign, including its associated channel.',
  CancelSession_ReasonName = 'reason',
  CancelSession_ReasonDescription = 'Message to party members about the cancellation of the session.',
  Campaign_Description = 'Include campaign name in the output.',
  CreateSession_TimezoneName = "timezone",
  CreateSession_TimezoneDescription = "Timezone for the session (defaults to your saved timezone)",
}
