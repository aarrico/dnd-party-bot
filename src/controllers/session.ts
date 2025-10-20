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
  createPartyMemberEmbed,
} from '../discord/message.js';
import { client } from '../index.js';
import { ExtendedInteraction } from '../models/Command.js';
import { AvatarOptions, PartyMemberImgInfo } from '../models/discord.js';
import { PartyMember, RoleSelectionStatus } from '../models/party.js';
import { ListSessionsOptions, ListSessionsResult, Session } from '../models/session.js';
import { BotCommandOptionInfo, BotDialogs, BotAttachmentFileNames, BotPaths } from '../utils/botDialogStrings.js';
import { getImgAttachmentBuilder } from '../utils/attachmentBuilders.js';
import DateChecker from '../utils/dateChecker.js';
import { addUserToParty, updatePartyMemberRole, upsertUser, getUserTimezone } from '../db/user';
import { deletePartyMember } from '../db/partyMember';
import { ChannelType, Guild } from 'discord.js';
import { createChannel, renameChannel } from '../discord/channel';
import { createScheduledEvent, updateScheduledEvent, deleteScheduledEvent } from '../discord/scheduledEvent.js';
import { RoleType } from '@prisma/client';
import { sessionScheduler } from '../services/sessionScheduler.js';
import { CreateSessionData } from '../models/session.js';
import { createSessionImage } from '../utils/sessionImage.js';
import { areDatesEqual, isFutureDate } from '../utils/dateUtils.js';
import {
  safeChannelFetch,
  safeMessageFetch,
  safeMessageEdit,
  safeUserFetch,
  safeCreateDM,
  safePermissionOverwritesEdit
} from '../utils/discordErrorHandler.js';

export const initSession = async (
  campaign: Guild,
  sessionName: string,
  date: Date,
  username: string,
  userId: string,
  timezone: string,
): Promise<Session> => {

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
    timezone,
  };

  const user = await safeUserFetch(client, userId);
  const dmChannel = await safeCreateDM(user);
  await upsertUser(userId, username, dmChannel.id);

  await safePermissionOverwritesEdit(sessionChannel, userId, {
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
    timezone: (session.timezone ?? 'America/Los_Angeles') as string,
  };

  const party = await getParty(session.id);

  // Send the session message (with retry logic)
  let partyMessageId: string = '';
  try {
    partyMessageId = await sendNewSessionMessage(sessionForMessage, sessionChannel, party);
    console.log(`Received partyMessageId from sendNewSessionMessage: ${partyMessageId}`);
  } catch (error) {
    console.error(`Failed to send new session message for session ${session.id}:`, error);
    // Continue - we still want to create the session even if message sending fails
    // The message can be resent later or users can access via the channel directly
  }

  // Create Discord scheduled event (non-blocking - failures won't prevent session creation)
  let eventId: string | null = null;
  try {
    eventId = await createScheduledEvent(
      campaign.id,
      sessionChannel.name,
      date,
      sessionChannel.id
    );
    if (eventId) {
      console.log(`✓ Created scheduled event ${eventId} for session ${session.id}`);
    }
  } catch (error) {
    console.error(`Failed to create scheduled event for session ${session.id}:`, error);
    // Continue - event creation is optional
  }

  // Update session with partyMessageId and eventId
  try {
    console.log(`Attempting to update session ${session.id} with partyMessageId: ${partyMessageId}, eventId: ${eventId}`);
    const updatedSession = await updateSession(session.id, { partyMessageId, eventId });
    console.log(`✓ Successfully updated session with partyMessageId: ${updatedSession.partyMessageId}`);
  } catch (error) {
    console.error(`Failed to update session ${session.id} with partyMessageId and eventId:`, error);
    // This is a critical error but we've already created the session
    // Log it prominently for investigation
    console.error(`⚠️ SESSION ${session.id} CREATED BUT NOT UPDATED WITH MESSAGE ID ${partyMessageId}`);
  }

  sessionScheduler.scheduleSessionTasks(session.id, session.date);
  console.log(`Scheduled tasks for session ${session.id} at ${session.date.toISOString()}`);

  return sessionForMessage;
};

export const cancelSession = async (sessionId: string, reason: string) => {
  const session = await getSession(sessionId);

  // Cancel any scheduled tasks first
  sessionScheduler.cancelSessionTasks(sessionId);
  console.log(`Canceled scheduled tasks for session ${sessionId}`);

  // Delete Discord scheduled event if it exists (non-blocking)
  if (session.eventId) {
    try {
      await deleteScheduledEvent(session.campaignId, session.eventId);
      console.log(`✓ Deleted scheduled event ${session.eventId} for canceled session ${sessionId}`);
    } catch (error) {
      console.error(`Failed to delete scheduled event for session ${sessionId}:`, error);
      // Continue - event deletion is optional
    }
  }

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
    const channel = await safeChannelFetch(client, sessionId);
    if (channel && channel.type === ChannelType.GuildText) {
      const message = await safeMessageFetch(channel, session.partyMessageId);

      const attachment = getImgAttachmentBuilder(
        `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`,
        BotAttachmentFileNames.CurrentSession
      );

      const party = await getParty(sessionId);
      const embed = createPartyMemberEmbed(party, session.campaignId, session.name, 'CANCELED');
      embed.setImage(`attachment://${BotAttachmentFileNames.CurrentSession}`);
      embed.setDescription(`❌ **CANCELED** - ${session.name}\n${reason}`);

      await safeMessageEdit(message, {
        embeds: [embed],
        files: [attachment],
        components: getRoleButtonsForSession('CANCELED'),
      });

      console.log(`Updated Discord message for canceled session ${sessionId}`);
    }
  } catch (error) {
    console.error(`Failed to update Discord message for canceled session ${sessionId}:`, error);
    // Don't throw - message update failure shouldn't prevent cancellation
  }

  // Try to notify guild members
  try {
    const { getUserTimezone } = await import('../db/user.js');
    const { formatSessionDateLong } = await import('../utils/dateUtils.js');

    await notifyGuild(session.campaignId, async (userId: string) => {
      const userTimezone = await getUserTimezone(userId);
      const sessionTime = formatSessionDateLong(session.date, userTimezone);

      return `❌ **Session Canceled**\n\n` +
        `🎲 **[${session.name}](https://discord.com/channels/${session.campaignId}/${session.id}/${session.partyMessageId})** has been canceled.\n` +
        `📅 **Was scheduled for:** ${sessionTime}\n` +
        `❗ **Reason:** ${reason}\n\n` +
        `We apologize for any inconvenience. 🎯`;
    });
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

    // Get timezone from command or user's stored timezone
    let timezone = interaction.options.getString(BotCommandOptionInfo.CreateSession_TimezoneName);

    if (!timezone) {
      timezone = await getUserTimezone(interaction.user.id);
    }

    const newProposedDate = DateChecker(interaction, timezone);

    const session = await getSessionById(sessionId);
    let dateChanged = false;
    let nameChanged = false;

    if (newProposedDate) {
      if (!areDatesEqual(session.date, newProposedDate)) {
        session.date = newProposedDate;
        dateChanged = true;
      }
    }

    if (newSessionName && newSessionName !== session.name) {
      await renameChannel(session.id, newSessionName);
      session.name = newSessionName;
      nameChanged = true;
    }

    await updateSession(sessionId, session);

    if (dateChanged) {
      sessionScheduler.scheduleSessionTasks(sessionId, session.date);
      console.log(`Rescheduled tasks for session ${sessionId} to new date: ${session.date.toISOString()}`);
    }

    // Update Discord scheduled event if it exists and something changed
    if (session.eventId && (dateChanged || nameChanged)) {
      try {
        const updates: { name?: string; scheduledStartTime?: Date } = {};
        if (nameChanged) updates.name = session.name;
        if (dateChanged) updates.scheduledStartTime = session.date;

        const eventIdString = session.eventId as string;
        const success = await updateScheduledEvent(
          session.campaignId,
          eventIdString,
          updates
        );
        if (success) {
          console.log(`✓ Updated scheduled event ${eventIdString} for session ${sessionId}`);
        }
      } catch (error) {
        console.error(`Failed to update scheduled event for session ${sessionId}:`, error);
        // Continue - event update is optional
      }
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

  if (!isFutureDate(date)) {
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
        const user = await safeUserFetch(client, member.userId);
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
