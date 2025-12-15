import {
  createSession as createSessionInDb,
  getParty,
  getSession,
  getSessionById,
  getSessions,
  updateSession,
  isUserInActiveSession,
  isUserHostingOnDate,
  isUserMemberOnDate,
} from '#modules/session/repository/session.repository.js';
import {
  sendNewSessionMessage,
  getRoleButtonsForSession,
  createPartyMemberEmbed,
} from '#modules/session/presentation/sessionMessages.js';
import {
  sendEphemeralReply,
  notifyParty,
} from '#shared/discord/messages.js';
import { client } from '#app/index.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import {
  AvatarOptions,
  PartyMemberImgInfo,
} from '#modules/session/domain/session.types.js';
import {
  PartyMember,
  RoleSelectionStatus,
} from '#modules/party/domain/party.types.js';
import {
  ListSessionsOptions,
  ListSessionsResult,
  Session,
} from '#modules/session/domain/session.types.js';
import {
  BotCommandOptionInfo,
  BotDialogs,
  BotAttachmentFileNames,
  BotPaths,
} from '#shared/messages/botDialogStrings.js';
import { getImgAttachmentBuilder } from '#shared/files/attachmentBuilders.js';
import DateChecker from '#shared/datetime/dateChecker.js';
import {
  addUserToParty,
  updatePartyMemberRole,
  upsertUser,
  getUserTimezone,
} from '#modules/user/repository/user.repository.js';
import { deletePartyMember } from '#modules/party/repository/partyMember.repository.js';
import { ChannelType, Guild, TextChannel } from 'discord.js';
import {
  createChannel,
  renameChannel,
} from '#modules/session/services/channelService.js';
import {
  createScheduledEvent,
  updateScheduledEvent,
  deleteScheduledEvent,
} from '#modules/session/services/scheduledEventService.js';
import { RoleType } from '#generated/prisma/client.js';
import { sessionScheduler } from '#services/sessionScheduler.js';
import { CreateSessionData } from '#modules/session/domain/session.types.js';
import { createSessionImage } from '#shared/messages/sessionImage.js';
import { areDatesEqual, isFutureDate } from '#shared/datetime/dateUtils.js';
import { sanitizeUserInput } from '#shared/validation/sanitizeUserInput.js';
import {
  safeChannelFetch,
  safeMessageFetch,
  safeMessageEdit,
  safeUserFetch,
  safeCreateDM,
  safePermissionOverwritesEdit,
  safeGuildMemberFetch,
  safeGuildFetch,
} from '#shared/discord/discordErrorHandler.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('SessionController');

/**
 * Core function to initialize a session with all required data.
 * This function performs the actual session creation without database lookups.
 * Use createSession or continueSession wrapper functions instead of calling this directly.
 */
export const initSession = async (
  campaign: Guild,
  sessionChannel: TextChannel,
  sessionName: string,
  date: Date,
  userId: string,
  timezone: string,
  party: PartyMember[]
): Promise<Session> => {
  logger.info('Initializing new session', {
    campaignId: campaign.id,
    campaignName: campaign.name,
    sessionName,
    channelId: sessionChannel.id,
    scheduledDate: date.toISOString(),
    timezone,
    creatorUserId: userId,
    initialPartySize: party.length,
  });

  const newSession: CreateSessionData = {
    id: sessionChannel.id,
    name: sessionName,
    date,
    campaignId: campaign.id,
    partyMessageId: '',
    timezone,
  };

  await safePermissionOverwritesEdit(sessionChannel, userId, {
    ViewChannel: true,
    SendMessages: true,
  });

  // Create session with all party members in a single transaction
  const session = await createSessionInDb(newSession, userId, party);

  const sessionForMessage: Session = {
    id: session.id,
    name: session.name,
    date: session.date,
    campaignId: session.campaignId,
    partyMessageId: session.partyMessageId ?? '',
    status: session.status as 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED',
    timezone: session.timezone ?? 'America/Los_Angeles',
  };

  // Send the session message (with retry logic)
  let partyMessageId: string = '';
  try {
    partyMessageId = await sendNewSessionMessage(
      sessionForMessage,
      sessionChannel,
      party
    );
    logger.info('Session message created', {
      sessionId: session.id,
      partyMessageId,
    });
  } catch (error) {
    logger.error('Failed to send new session message', {
      sessionId: session.id,
      error,
    });
    // Continue - we still want to create the session even if message sending fails
    // The message can be resent later or users can access via the channel directly
  }

  // Update session with partyMessageId
  try {
    logger.debug('Updating session with party message metadata', {
      sessionId: session.id,
      partyMessageId,
    });
    const updatedSession = await updateSession(session.id, {
      partyMessageId,
    });
    logger.info('Session metadata updated', {
      sessionId: session.id,
      partyMessageId: updatedSession.partyMessageId,
    });
  } catch (error) {
    logger.error('Failed to update session with party message metadata', {
      sessionId: session.id,
      error,
    });
    // This is a critical error but we've already created the session
    // Log it prominently for investigation
    logger.error('Session created without party message ID set', {
      sessionId: session.id,
      partyMessageId,
    });
  }

  sessionScheduler.scheduleSessionTasks(session.id, session.date);
  logger.info('Session initialization complete', {
    sessionId: session.id,
    sessionName: session.name,
    scheduledDate: session.date.toISOString(),
    partySize: party.length,
  });

  return sessionForMessage;
};

/**
 * Creates a new session from scratch.
 * Performs validation, database calls, and user setup before initializing the session.
 */
export const createSession = async (
  campaign: Guild,
  sessionName: string,
  date: Date,
  username: string,
  userId: string,
  timezone: string
): Promise<Session> => {
  logger.debug('createSession called', {
    campaignId: campaign.id,
    sessionName,
    userId,
    username,
  });

  // Validate session parameters
  const validationError = await isSessionValid(
    campaign,
    date,
    userId,
    timezone
  );
  if (validationError) {
    logger.warn('Session validation failed', {
      campaignId: campaign.id,
      sessionName,
      userId,
      validationError,
    });
    throw new Error(validationError);
  }

  // Create Discord channel for the session
  const sessionChannel = await createChannel(campaign, sessionName);

  // Fetch user and create DM channel
  const user = await safeUserFetch(client, userId);
  const dmChannel = await safeCreateDM(user);
  await upsertUser(userId, username, dmChannel.id);

  // Initialize party with just the game master
  const party: PartyMember[] = [
    {
      userId,
      username,
      channelId: dmChannel.id,
      role: RoleType.GAME_MASTER,
    },
  ];

  // Initialize the session with all data
  return await initSession(
    campaign,
    sessionChannel,
    sessionName,
    date,
    userId,
    timezone,
    party
  );
};

/**
 * Continues an existing session by creating a new session with copied party members.
 * Performs validation, copies party data, and creates the new session.
 */
export const continueSession = async (
  campaign: Guild,
  existingSession: Session & { partyMembers: PartyMember[] },
  newSessionName: string,
  date: Date,
  username: string,
  userId: string,
  timezone: string
): Promise<{ session: Session; party: PartyMember[] }> => {
  logger.info('Continuing session', {
    previousSessionId: existingSession.id,
    previousSessionName: existingSession.name,
    newSessionName,
    campaignId: campaign.id,
    userId,
    carryOverPartySize: existingSession.partyMembers.length,
  });

  const validationError = await isSessionValid(
    campaign,
    date,
    userId,
    timezone
  );
  if (validationError) {
    logger.warn('Session continuation validation failed', {
      previousSessionId: existingSession.id,
      userId,
      validationError,
    });
    throw new Error(validationError);
  }

  const sessionChannel = await createChannel(campaign, newSessionName);

  // Fetch GM user and ensure DM channel exists
  const user = await safeUserFetch(client, userId);
  const dmChannel = await safeCreateDM(user);
  await upsertUser(userId, username, dmChannel.id);

  // Copy party from existing session (Game Master will be added by initSession)
  const party: PartyMember[] = [
    {
      userId,
      username,
      channelId: dmChannel.id,
      role: RoleType.GAME_MASTER,
    },
  ];

  existingSession.partyMembers.forEach((member) => {
    if (member.userId !== userId) {
      party.push({
        userId: member.userId,
        username: member.username,
        channelId: member.channelId,
        role: member.role,
      });
    }
  });

  const session = await initSession(
    campaign,
    sessionChannel,
    newSessionName,
    date,
    userId,
    timezone,
    party
  );

  return { session, party };
};

export const cancelSession = async (sessionId: string, reason: string) => {
  logger.info('Canceling session', { sessionId, reason });

  const session = await getSession(sessionId);
  logger.debug('Session to cancel', {
    sessionId,
    sessionName: session.name,
    status: session.status,
    partySize: session.partyMembers.length,
  });

  // Cancel any scheduled tasks first
  sessionScheduler.cancelSessionTasks(sessionId);
  logger.info('Canceled scheduled tasks for session', { sessionId });

  // Delete Discord scheduled event if it exists (non-blocking)
  if (session.eventId) {
    try {
      await deleteScheduledEvent(session.campaignId, session.eventId);
      logger.info('Deleted scheduled event for canceled session', {
        sessionId,
        eventId: session.eventId,
      });
    } catch (error) {
      logger.error('Failed to delete scheduled event for session', {
        sessionId,
        error,
      });
      // Continue - event deletion is optional
    }
  }

  // Update database status - this should happen regardless of other failures
  try {
    await updateSession(sessionId, { status: 'CANCELED' });
    logger.info('Updated session status to CANCELED', { sessionId });
  } catch (error) {
    logger.error('Failed to update session status to CANCELED', {
      sessionId,
      error,
    });
    throw error; // Re-throw since this is critical
  }

  // Try to regenerate the session message with canceled status
  try {
    await regenerateSessionMessage(sessionId, session.campaignId);

    // Update the embed description to include the cancellation reason
    const channel = await safeChannelFetch(client, sessionId);
    if (channel && channel.type === ChannelType.GuildText) {
      const message = await safeMessageFetch(channel, session.partyMessageId);

      const attachment = getImgAttachmentBuilder(
        `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`,
        BotAttachmentFileNames.CurrentSession
      );

      const party = await getParty(sessionId);
      const embed = createPartyMemberEmbed(
        party,
        session.campaignId,
        session.name,
        'CANCELED'
      );
      embed.setDescription(`❌ **CANCELED** - ${session.name}\n${reason}`);

      await safeMessageEdit(message, {
        embeds: [embed],
        files: [attachment],
        components: getRoleButtonsForSession('CANCELED'),
      });

      logger.info('Updated Discord message for canceled session', {
        sessionId,
      });
    }
  } catch (error) {
    logger.error('Failed to update Discord message for canceled session', {
      sessionId,
      error,
    });
    // Don't throw - message update failure shouldn't prevent cancellation
  }

  try {
    const { getUserTimezone } = await import(
      '../../user/repository/user.repository.js'
    );
    const { formatSessionDateLong } = await import(
      '../../../shared/datetime/dateUtils.js'
    );

    await notifyParty(
      session.partyMembers.map((member) => member.userId),
      async (userId: string) => {
        const userTimezone = await getUserTimezone(userId);
        const sessionTime = formatSessionDateLong(session.date, userTimezone);

        return (
          `❌ **Session Canceled**\n\n` +
          `🎲 **[${session.name}](https://discord.com/channels/${session.campaignId}/${session.id}/${session.partyMessageId})** has been canceled.\n` +
          `📅 **Was scheduled for:** ${sessionTime}\n` +
          `❗ **Reason:** ${reason}\n\n` +
          `We apologize for any inconvenience. 🎯`
        );
      }
    );
    logger.info('Notified guild members about session cancellation', {
      sessionId,
    });
  } catch (error) {
    logger.error('Failed to notify guild about session cancellation', {
      sessionId,
      error,
    });
    // Don't throw - notification failure shouldn't prevent cancellation
  }

  logger.info('Session cancellation complete', {
    sessionId,
    sessionName: session.name,
    reason,
  });
};

export const modifySession = async (interaction: ExtendedInteraction) => {
  try {
    const sessionId = interaction.options.getString(
      BotCommandOptionInfo.ModifySession_ChannelName,
      true
    );
    const rawNewSessionName = interaction?.options?.get('new-session-name')
      ?.value as string;
    const newSessionName = rawNewSessionName
      ? sanitizeUserInput(rawNewSessionName)
      : undefined;

    if (rawNewSessionName && !newSessionName) {
      await sendEphemeralReply(
        BotDialogs.createSessionInvalidSessionName,
        interaction
      );
      return;
    }

    const session = await getSessionById(sessionId);

    // Ensure user exists in database before getting their timezone
    const user = await safeUserFetch(client, interaction.user.id);
    const dmChannel = await safeCreateDM(user);
    const username =
      sanitizeUserInput(interaction.user.displayName) ||
      interaction.user.username;
    await upsertUser(interaction.user.id, username, dmChannel.id);

    // Get timezone from command or user's stored timezone
    let timezone = interaction.options.getString(
      BotCommandOptionInfo.CreateSession_TimezoneName
    );

    if (!timezone) {
      timezone = await getUserTimezone(interaction.user.id);
    }

    const newProposedDate = DateChecker(interaction, timezone);
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
      logger.info('Rescheduled session tasks', {
        sessionId,
        date: session.date.toISOString(),
      });
    }

    // Update Discord scheduled event if it exists and something changed
    if (session.eventId && (dateChanged || nameChanged)) {
      try {
        const updates: { name?: string; scheduledStartTime?: Date } = {};
        if (nameChanged) updates.name = session.name;
        if (dateChanged) updates.scheduledStartTime = session.date;

        const eventIdString = session.eventId;
        const success = await updateScheduledEvent(
          session.campaignId,
          eventIdString,
          updates
        );
        if (success) {
          logger.info('Updated scheduled event for session', {
            sessionId,
            eventId: eventIdString,
          });
        }
      } catch (error) {
        logger.error('Failed to update scheduled event for session', {
          sessionId,
          error,
        });
        // Continue - event update is optional
      }
    }

    // Regenerate session message if name or date changed
    if (dateChanged || nameChanged) {
      try {
        await regenerateSessionMessage(sessionId, session.campaignId);
        logger.info('Regenerated session message after modification', {
          sessionId,
        });
      } catch (error) {
        logger.error('Failed to regenerate session message', {
          sessionId,
          error,
        });
        // Continue - message update failure shouldn't prevent modification
      }
    }

    logger.info('Session modification complete', {
      sessionId,
      sessionName: session.name,
      dateChanged,
      nameChanged,
    });

    await sendEphemeralReply(
      BotDialogs.sessions.updated(session.name),
      interaction
    );
  } catch (error) {
    logger.error('Error modifying session', { error });
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
  const { date, partyMembers: party, status, campaignId, timezone } = session;

  logger.debug('Processing role selection', {
    sessionId,
    userId: newPartyMember.userId,
    username: newPartyMember.username,
    role: newPartyMember.role,
    partySize: party.length,
  });

  if (status && status !== 'SCHEDULED') {
    logger.info('Rejected role selection: session locked', {
      sessionId,
      status,
    });
    return RoleSelectionStatus.LOCKED;
  }

  if (!isFutureDate(date)) {
    logger.info('Rejected role selection: session expired', { sessionId });
    return RoleSelectionStatus.EXPIRED;
  }

  if (newPartyMember.role === RoleType.GAME_MASTER) {
    logger.info('Rejected role selection: GM role not allowed', {
      sessionId,
      userId: newPartyMember.userId,
    });
    return RoleSelectionStatus.INVALID;
  }

  // Check if user is already in this party BEFORE other checks
  const existingMember = party.find(
    (member) => member.userId === newPartyMember.userId
  );

  // If user is already in the party, handle role change/removal
  if (existingMember) {
    if (existingMember.role === newPartyMember.role) {
      logger.info('Removing user from party (same role selected)', {
        sessionId,
        userId: existingMember.userId,
      });
      await deletePartyMember(existingMember.userId, sessionId);
      return RoleSelectionStatus.REMOVED_FROM_PARTY;
    }

    logger.info('Changing user role', {
      sessionId,
      userId: existingMember.userId,
      fromRole: existingMember.role,
      toRole: newPartyMember.role,
    });
    await updatePartyMemberRole(
      newPartyMember.userId,
      sessionId,
      newPartyMember.role
    );
    return RoleSelectionStatus.ROLE_CHANGED;
  }

  // User is NOT in the party - check if they can join
  const isInAnotherSession = await isUserInActiveSession(
    newPartyMember.userId,
    sessionId
  );

  if (isInAnotherSession) {
    logger.info('Rejected role selection: user already in another session', {
      sessionId,
      userId: newPartyMember.userId,
    });
    return RoleSelectionStatus.ALREADY_IN_SESSION;
  }

  const isHostingOnSameDay = await isUserHostingOnDate(
    newPartyMember.userId,
    date,
    campaignId,
    timezone
  );

  if (isHostingOnSameDay) {
    logger.info('Rejected role selection: user hosting on same day', {
      sessionId,
      userId: newPartyMember.userId,
    });
    return RoleSelectionStatus.HOSTING_SAME_DAY;
  }

  if (party.length >= 6) {
    logger.info('Rejected role selection: party full', {
      sessionId,
      partySize: party.length,
    });
    return RoleSelectionStatus.PARTY_FULL;
  }

  logger.info('Adding user to party', {
    sessionId,
    userId: newPartyMember.userId,
    role: newPartyMember.role,
  });
  await addUserToParty(
    newPartyMember.userId,
    sessionId,
    newPartyMember.role,
    newPartyMember.username
  );
  return RoleSelectionStatus.ADDED_TO_PARTY;
};

export const getPartyInfoForImg = async (
  sessionId: string
): Promise<PartyMemberImgInfo[]> => {
  const session = await getSession(sessionId);
  const party = await getParty(sessionId);
  const avatarOptions: AvatarOptions = {
    extension: 'png',
    forceStatic: true,
  };

  // Fetch the guild to get member-specific information
  let guild: Guild | null = null;
  try {
    guild = await safeGuildFetch(client, session.campaignId);
  } catch (error) {
    logger.warn('Could not fetch guild for session image generation', {
      sessionId,
      campaignId: session.campaignId,
      error,
    });
  }

  const partyWithAvatars = await Promise.all(
    party.map(async (member) => {
      try {
        const user = await safeUserFetch(client, member.userId);

        // Try to get guild-specific information (avatar and nickname)
        let displayName = member.username;
        let avatarURL = user.displayAvatarURL(avatarOptions);

        if (guild) {
          try {
            const guildMember = await safeGuildMemberFetch(guild, member.userId);
            displayName = guildMember.displayName;
            avatarURL = guildMember.displayAvatarURL(avatarOptions);
          } catch (guildMemberError) {
            logger.debug('Could not fetch guild member, using user-level data', {
              userId: member.userId,
              guildId: guild.id,
              error: guildMemberError,
            });
          }
        }

        return {
          userId: member.userId,
          username: member.username,
          displayName,
          userAvatarURL: avatarURL,
          role: member.role,
        };
      } catch (error) {
        logger.warn('Could not fetch avatar for user avatar rendering', {
          userId: member.userId,
          error,
        });
        return {
          userId: member.userId,
          username: member.username,
          displayName: member.username,
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
    logger.error('Failed to list sessions', { error, options });
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
  const headerParts = [
    'Session Name',
    includeId && 'Session Channel ID',
    includeTime && 'Scheduled Date',
    includeCampaign && 'Campaign Name',
    includeRole && 'User Role',
  ].filter(Boolean);
  const header = headerParts.join('\t');

  const data = sessions.map((session) => {
    const row = [session.name];
    if (includeId) row.push(session.id);
    if (includeTime) row.push(session.date.toUTCString());
    if (includeCampaign && session.campaign) {
      row.push(session.campaign);
    }
    if (includeRole && session.userRole) row.push(session.userRole);
    return row;
  });

  return [[header], ...data].map((row) => row.join(delimiter)).join('\n');
};

const isSessionValid = async (
  campaign: Guild,
  date: Date,
  userId: string,
  timezone: string
): Promise<string> => {
  if (!campaign) {
    return BotDialogs.createSessionInvalidGuild;
  }

  if (!date || isNaN(date.getTime())) {
    return BotDialogs.createSessionInvalidDate;
  }
  if (!isFutureDate(date)) {
    return BotDialogs.createSessionDateMustBeFuture;
  }

  if (!userId) {
    return BotDialogs.createSessionInvalidUserId;
  }

  // Check if the user is already hosting a session on the same day
  const isHostingOnSameDay = await isUserHostingOnDate(
    userId,
    date,
    campaign.id,
    timezone
  );
  if (isHostingOnSameDay) {
    return BotDialogs.createSessionHostingMultipleSessions;
  }

  // Check if the user is a member of another session on the same day
  const isMemberOnSameDay = await isUserMemberOnDate(
    userId,
    date,
    campaign.id,
    timezone
  );
  if (isMemberOnSameDay) {
    return BotDialogs.createSessionAlreadyMemberSameDay;
  }

  return '';
};

export const regenerateSessionMessage = async (
  sessionId: string,
  guildId: string
): Promise<void> => {
  logger.debug('Regenerating session message', { sessionId, guildId });

  const session = await getSessionById(sessionId);
  const sessionChannel = await safeChannelFetch(client, sessionId);

  if (!sessionChannel || sessionChannel.type !== ChannelType.GuildText) {
    throw new Error('Session channel not found or is not a text channel');
  }

  const partyForImg = await getPartyInfoForImg(sessionId);
  await createSessionImage(session, partyForImg);

  const attachment = getImgAttachmentBuilder(
    `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`,
    BotAttachmentFileNames.CurrentSession
  );

  const party = await getParty(sessionId);
  const embed = createPartyMemberEmbed(
    party,
    guildId,
    session.name,
    session.status
  );
  embed.setDescription(
    BotDialogs.sessions.scheduled(
      session.date,
      session.timezone ?? 'America/Los_Angeles'
    )
  );

  const message = await safeMessageFetch(
    sessionChannel,
    session.partyMessageId
  );
  await safeMessageEdit(message, {
    embeds: [embed],
    files: [attachment],
    components: getRoleButtonsForSession(session.status),
  });

  logger.debug('Session message regenerated', {
    sessionId,
    messageId: session.partyMessageId,
  });
};
