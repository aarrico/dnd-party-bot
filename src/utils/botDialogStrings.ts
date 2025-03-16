import { PartyMember, RoleSelectionStatus } from '../typings/party';
import path from 'path';

export const BotDialogs = {
  // CreateSession
  createSessionInvalidSessionName: 'Your session name is invalid.',
  createSessionDMSessionTime: (
    campaign: string,
    sessionName: string,
    date: Date
  ) =>
    `🤖 New session ${sessionName} for ${campaign} scheduled for ${date.toLocaleString()}`,
  createSessionOneMoment:
    '🤖 One Moment while I create your session. You will receive a message via Direct Message when complete!',
  createSessionInvalidDateEntered:
    "🤖 The date you entered is invalid. This could be due to the following reasons:\n- You entered a date that doesn't exist.\n- You entered a day that has already passed.",

  sessions: {
    listAllResult: '🤖🎉 Report for all scheduled sessions is ready!',
    forUserResult: (username: string) =>
      `🤖🎉 Report for all sessions ${username} has signed up for is ready!`,
    allUsersResult: (session: string) =>
      `🤖🎉 Report for all users in session ${session} is ready!`,
    updated: (
      name: string
    ) => `🤖🎉 Session ${name} has been updated successfully.\n \
    🤖🖌️ Generating new image...give me a few seconds!`,
    scheduled: (
      name: string,
      date: Date
    ) => `🤖🗓️ Session ${name} has been scheduled for ${date.toLocaleString()}!\n \
    🤖⚙️ Please wait a moment while I get things ready!`,
  },

  users: {
    listAllResult:
      '🤖🎉 Report for all users that have participated in any campaign is ready!',
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
    dmCantSwap: '🤖 You cannot change roles as you are the Dungeon Master!',
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
    default:
      return BotDialogs.roleChosenMessageContent.noActionTaken;
  }
};

//potential resolve path here instead.
export const BotPaths = {
  TempDir: path.join(process.cwd(), 'tmp'),
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
  CreateSessionDescription = 'creates a session in the session stack.',
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
  CreateSession_TimeDescription = 'Time using 24 hour HH:MM format',
  //GetAllUserSessions
  GetAllUserSessions_UserIDDescription = 'User ID that you are finding the sessions for.',
  GetAllUserSessions_SessionIDDescription = 'UUID of session in DB(unique identifier)',
  GetAllUserSessions_UserRoleName = 'user-role-in-this-session',
  GetAllUserSessions_UserRoleDescription = 'User role for session',
  GetAllUserSessions_SessionMessageIDName = 'session-message-id',
  GetAllUserSessions_SessionMessageIDDescription = 'discord message id for session',
  //GetAllSessions
  GetAllSessions_SessionMessageIDName = 'session-message-id',
  GetAllSessions_SessionMessageIDDescription = 'discord message id for session',
  //GetAllUsersInASession
  GetAllUsersInASession_UserIDDescription = 'UUID of user in DB(unique identifier)',
  GetAllUsersInASession_UserRoleName = 'user-role-in-this-session',
  GetAllUsersInASession_UserRoleDescription = 'discord message id for session',
  GetAllUsersInASession_UserChannelIDName = 'user-channel-id',
  GetAllUsersInASession_UserChannelIDDescription = 'User DM channel id',
  //GetAllUsers
  GetAllUsers_UserChannelIDName = 'user-dm-channel-id',
  GetAllUsers_UserChannelIDDescription = 'User DM channel id',
  CancelSession_Name = 'cancel-session',
  CancelSession_Description = 'Deletes a session from a campaign, including its associated channel.',
  CancelSession_ReasonName = 'reason',
  CancelSession_ReasonDescription = 'Message to party members about the cancellation of the session.',
  Campaign_Description = 'Include campaign name in the output.',
}
