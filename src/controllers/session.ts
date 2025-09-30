import {
  createSession,
  getParty,
  getSession,
  getSessionById,
  getSessions,
  updateSession,
} from '../db/session.js';
import {
  sendNewSessionMessage,
  sendEphemeralReply,
  notifyGuild,
  getRoleButtonsForSession,
} from '../discord/message.js';
import { client } from '../index.js';
import { ExtendedInteraction } from '../models/Command.js';
import { AvatarOptions, PartyMemberImgInfo } from '../models/discord.js';
import { PartyMember, RoleSelectionStatus } from '../models/party.js';
import { ListSessionsOptions, ListSessionsResult, Session } from '../models/session.js';
import { BotCommandOptionInfo, BotDialogs, BotAttachmentFileNames, BotPaths } from '../utils/botDialogStrings.js';
import { getImgAttachmentBuilder } from '../utils/attachmentBuilders.js';
import DateChecker from '../utils/dateChecker.js';
import { addUserToParty, updatePartyMemberRole, upsertUser } from '../db/user';
import { deletePartyMember } from '../db/partyMember';
import { ChannelType, Guild } from 'discord.js';
import { createChannel, renameChannel } from '../discord/channel';
import { RoleType } from '@prisma/client';
import { sessionScheduler } from '../services/sessionScheduler.js';
import { CreateSessionData } from '../models/session.js';
import { createSessionImage } from '../utils/sessionImage.js';

export const initSession = async (
  campaign: Guild,
  sessionName: string,
  date: Date,
  username: string,
  userId: string,
): Promise<string> => {

  const sessionChannel = await createChannel(
    campaign,
    sessionName
  );

  const newSession: CreateSessionData = {
    id: sessionChannel.id,
    name: sessionChannel.name,
    date,
    campaignId: campaign.id,
    partyMessageId: '',
  };

  const user = await client.users.fetch(userId);
  const dmChannel = await user.createDM();
  await upsertUser(userId, username, dmChannel.id);

  await sessionChannel.permissionOverwrites.edit(userId, {
    ViewChannel: true,
    SendMessages: true
  });

  const session = await createSession(newSession, userId);

  const sessionForMessage: Session = {
    id: session.id,
    name: session.name,
    date: session.date,
    campaignId: session.campaignId,
    partyMessageId: session.partyMessageId ?? '',
    status: session.status as 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED',
  };

  const partyMessageId = await sendNewSessionMessage(sessionForMessage, sessionChannel);
  console.log(`Received partyMessageId from sendNewSessionMessage: ${partyMessageId}`);

  const updatedSession = await updateSession(session.id, { partyMessageId });
  console.log(`Updated session with partyMessageId: ${updatedSession.partyMessageId}`);

  sessionScheduler.scheduleSessionTasks(session.id, session.date);
  console.log(`Scheduled tasks for session ${session.id} at ${session.date.toISOString()}`);

  return BotDialogs.createSessionDMSessionTime(
    campaign,
    updatedSession,
  );
};

export const cancelSession = async (sessionId: string, reason: string) => {
  const session = await getSession(sessionId);

  // Cancel any scheduled tasks first
  sessionScheduler.cancelSessionTasks(sessionId);
  console.log(`Canceled scheduled tasks for session ${sessionId}`);

  // Update database status - this should happen regardless of other failures
  try {
    await updateSession(sessionId, { status: 'CANCELED' });
    console.log(`Updated session ${sessionId} status to CANCELED in database`);
  } catch (error) {
    console.error(`Failed to update session ${sessionId} status to CANCELED:`, error);
    throw error; // Re-throw since this is critical
  }

  // Try to regenerate the session image with red border
  try {
    await createSessionImage(sessionId);
    console.log(`Regenerated session image with CANCELED status border`);
  } catch (error) {
    console.error(`Failed to regenerate session image for ${sessionId}:`, error);
    // Don't throw - image generation failure shouldn't prevent cancellation
  }

  // Try to update the Discord message with the new canceled image
  try {
    const channel = await client.channels.fetch(sessionId);
    if (channel && channel.type === ChannelType.GuildText) {
      const message = await channel.messages.fetch(session.partyMessageId);

      const attachment = getImgAttachmentBuilder(
        `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`,
        BotAttachmentFileNames.CurrentSession
      );

      await message.edit({
        content: `❌ **CANCELED** - ${session.name}\n${reason}`,
        files: [attachment],
        components: getRoleButtonsForSession('CANCELED'), // Remove buttons for canceled session
      });

      console.log(`Updated Discord message for canceled session ${sessionId}`);
    }
  } catch (error) {
    console.error(`Failed to update Discord message for canceled session ${sessionId}:`, error);
    // Don't throw - message update failure shouldn't prevent cancellation
  }

  // Try to notify guild members
  try {
    await notifyGuild(session.campaignId, reason);
    console.log(`Notified guild members about session ${sessionId} cancellation`);
  } catch (error) {
    console.error(`Failed to notify guild about session ${sessionId} cancellation:`, error);
    // Don't throw - notification failure shouldn't prevent cancellation
  }
};

export const modifySession = async (interaction: ExtendedInteraction) => {
  try {
    const sessionId = interaction?.options?.get(
      BotCommandOptionInfo.SessionId_Name
    )?.value as string;
    const newSessionName = interaction?.options?.get('new-session-name')
      ?.value as string;
    const newProposedDate = DateChecker(interaction);

    const session = await getSessionById(sessionId);
    let dateChanged = false;

    if (newProposedDate) {
      if (session.date.getTime() !== newProposedDate.getTime()) {
        session.date = newProposedDate;
        dateChanged = true;
      }
    }

    if (newSessionName && newSessionName !== session.name) {
      await renameChannel(session.id, newSessionName);
      session.name = newSessionName;
    }

    await updateSession(sessionId, session);

    if (dateChanged) {
      sessionScheduler.scheduleSessionTasks(sessionId, session.date);
      console.log(`Rescheduled tasks for session ${sessionId} to new date: ${session.date.toISOString()}`);
    }

    await sendEphemeralReply(
      BotDialogs.sessions.updated(session.name),
      interaction
    );
  } catch (error) {
    console.error('Error modifying session:', error);
    await sendEphemeralReply(
      'An error occurred while modifying the session.',
      interaction
    );
  }
};

export const processRoleSelection = async (
  newPartyMember: PartyMember,
  sessionId: string
): Promise<RoleSelectionStatus> => {
  const session = await getSession(sessionId);
  const { date, partyMembers: party, status } = session;

  // Check if session allows role selection (only SCHEDULED sessions)
  if (status && status !== 'SCHEDULED') {
    return RoleSelectionStatus.LOCKED;
  }

  if (date < new Date()) {
    return RoleSelectionStatus.EXPIRED;
  }

  if (party.length >= 6) {
    return RoleSelectionStatus.PARTY_FULL;
  }

  const existingMember = party.find(
    (member) => member.userId === newPartyMember.userId
  );

  if (newPartyMember.role === RoleType.GAME_MASTER) {
    return RoleSelectionStatus.INVALID;
  }

  if (!existingMember) {
    await addUserToParty(newPartyMember.userId, sessionId, newPartyMember.role, newPartyMember.username);
    return RoleSelectionStatus.ADDED_TO_PARTY;
  }

  if (existingMember.role === newPartyMember.role) {
    await deletePartyMember(existingMember.userId, sessionId);
    return RoleSelectionStatus.REMOVED_FROM_PARTY;
  }

  await updatePartyMemberRole(
    newPartyMember.userId,
    sessionId,
    newPartyMember.role
  );
  return RoleSelectionStatus.ROLE_CHANGED;
};

export const getPartyInfoForImg = async (
  sessionId: string
): Promise<PartyMemberImgInfo[]> => {
  const party = await getParty(sessionId);
  const avatarOptions: AvatarOptions = {
    extension: 'png',
    forceStatic: true,
  };

  const partyWithAvatars = await Promise.all(
    party.map(async (member) => {
      try {
        const user = await client.users.fetch(member.userId);
        return {
          userId: member.userId,
          username: member.username,
          userAvatarURL: user.displayAvatarURL(avatarOptions),
          role: member.role,
        };
      } catch (error) {
        console.warn(`Could not fetch avatar for user ${member.userId}:`, error);
        return {
          userId: member.userId,
          username: member.username,
          userAvatarURL: `https://cdn.discordapp.com/embed/avatars/${member.userId.slice(-1)}.png`,
          role: member.role,
        };
      }
    })
  );

  return partyWithAvatars;
};

export const listSessions = async (
  options: ListSessionsOptions
): Promise<ListSessionsResult[]> => {
  let sessions: ListSessionsResult[] = [];
  try {
    sessions = await getSessions(options);
  } catch (error) {
    console.error(error);
  }

  return sessions;
};

export const formatSessionsAsStr = (
  sessions: ListSessionsResult[],
  options: ListSessionsOptions,
  delimiter = ', '
): string => {
  const {
    includeTime,
    includeCampaign,
    includeId,
    includeRole = false,
  } = options;
  const header = `Session Name${includeId && '\tSession Channel ID'}]\
    ${includeTime && '\tScheduled Date'}${includeCampaign && '\tCampaign Name'}\
    ${includeRole && '\tUser Role'}`;

  const data = sessions.map((session) => {
    const row = [session.name];
    if (includeId) row.push(session.id);
    if (includeTime) row.push(session.date.toUTCString());
    if (includeCampaign && session.campaign) row.push(session.campaign);
    if (includeRole && session.userRole) row.push(session.userRole);
    return row;
  });

  return [[header], ...data].map((row) => row.join(delimiter)).join('\n');
};
