import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  TextChannel,
} from 'discord.js';
import { RoleType } from '#generated/prisma/client.js';
import {
  Session,
  SessionStatus,
} from '#modules/session/domain/session.types.js';
import { PartyMember } from '#modules/party/domain/party.types.js';
import {
  BotAttachmentFileNames,
  BotDialogs,
} from '#shared/messages/botDialogStrings.js';
import { getImgAttachmentBuilderFromBuffer } from '#shared/files/attachmentBuilders.js';
import { createSessionImage } from '#shared/messages/sessionImage.js';
import { safeChannelSend } from '#shared/discord/discordErrorHandler.js';
import { roleButtons } from '#app/index.js';
import { createScopedLogger } from '#shared/logging/logger.js';
import {
  getPartyInfoForImg,
  convertPartyToImgInfo,
} from '#modules/session/services/partyImageService.js';

const logger = createScopedLogger('SessionMessages');

/**
 * Get role buttons for session based on status
 * Only sessions with SCHEDULED status allow role selection
 */
export const getRoleButtonsForSession = (
  sessionStatus?: SessionStatus
): ActionRowBuilder<ButtonBuilder>[] => {
  return sessionStatus === 'SCHEDULED' ? roleButtons : [];
};

/**
 * Create an embed showing party members by role
 */
export const createPartyMemberEmbed = (
  partyMembers: PartyMember[],
  sessionName: string,
  sessionStatus?: SessionStatus
): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setColor(getStatusColor(sessionStatus))
    .setTitle(`🎲 ${sessionName}`)
    .setTimestamp();

  if (partyMembers.length === 0) {
    return embed;
  }

  const membersByRole: Record<RoleType, PartyMember[]> = {} as Record<
    RoleType,
    PartyMember[]
  >;

  for (const member of partyMembers) {
    const roleType = member.role;
    if (!membersByRole[roleType]) {
      membersByRole[roleType] = [];
    }
    membersByRole[roleType].push(member);
  }

  for (const [roleType, members] of Object.entries(membersByRole) as [
    RoleType,
    PartyMember[],
  ][]) {
    const memberLinks = members.map((member) => `<@${member.userId}>`);
    const displayName = roleType
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    embed.addFields({
      name: `${getRoleEmoji(roleType)} ${displayName}`,
      value: memberLinks.join('\n'),
      inline: true,
    });
  }

  return embed;
};

/**
 * Send a new session announcement message with embed and image
 */
export const sendNewSessionMessage = async (
  session: Session,
  channel: TextChannel,
  partyMembers: PartyMember[] = []
) => {
  logger.info('Sending new session message', {
    sessionId: session.id,
    channelId: channel.id,
  });

  try {
    logger.debug('Creating session image for session message', {
      sessionId: session.id,
    });

    // If session.id is empty (new session), convert partyMembers directly
    // Otherwise fetch from database for existing sessions
    const party = session.id
      ? await getPartyInfoForImg(session.id)
      : await convertPartyToImgInfo(partyMembers, channel.guildId);

    const imageBuffer = await createSessionImage(session, party);

    logger.debug('Session image created in memory', {
      sizeBytes: imageBuffer.length,
    });

    const attachment = getImgAttachmentBuilderFromBuffer(
      imageBuffer,
      BotAttachmentFileNames.CurrentSession
    );

    const embed = createPartyMemberEmbed(
      partyMembers,
      session.name,
      session.status
    );

    embed.setDescription(
      BotDialogs.sessions.scheduled(
        session.date,
        session.timezone ?? 'America/Los_Angeles'
      )
    );

    logger.info('Sending session message with embed/image/buttons', {
      channelId: channel.id,
    });
    const sentMessage = await safeChannelSend(channel, {
      embeds: [embed],
      files: [attachment],
      components: getRoleButtonsForSession(session.status),
    });

    logger.info('Session message sent', {
      messageId: sentMessage.id,
      channelId: channel.id,
    });
    return sentMessage.id;
  } catch (error) {
    logger.error(
      'Error creating session image, falling back to embed-only message',
      {
        sessionId: session.id,
        error,
      }
    );

    try {
      logger.info('Sending fallback session message without image', {
        channelId: channel.id,
      });
      const embed = createPartyMemberEmbed(
        partyMembers,
        session.name,
        session.status
      );
      embed.setDescription(
        BotDialogs.sessions.scheduled(
          session.date,
          session.timezone ?? 'America/Los_Angeles'
        )
      );

      const sentMessage = await safeChannelSend(channel, {
        embeds: [embed],
        components: getRoleButtonsForSession(session.status),
      });

      logger.info('Fallback session message sent', {
        messageId: sentMessage.id,
      });
      return sentMessage.id;
    } catch (fallbackError) {
      logger.error('Failed to send fallback session message', {
        error: fallbackError,
      });
      throw fallbackError;
    }
  }
};

/**
 * Get color based on session status
 */
const getStatusColor = (status?: SessionStatus): number => {
  const colorMap: Record<string, number> = {
    SCHEDULED: 0x00ff00, // Green
    FULL: 0xffd700, // Gold
    ACTIVE: 0x0080ff, // Blue
    COMPLETED: 0xff0000, // Red
    CANCELED: 0xff0000, // Red
  };
  return colorMap[status || 'SCHEDULED'] || 0x5865f2;
};

/**
 * Get emoji for role type
 */
const getRoleEmoji = (role: RoleType): string => {
  const emojiMap: Record<RoleType, string> = {
    [RoleType.GAME_MASTER]: '👑',
    [RoleType.TANK]: '🛡️',
    [RoleType.SUPPORT]: '💚',
    [RoleType.RANGE_DPS]: '🏹',
    [RoleType.MELEE_DPS]: '⚔️',
    [RoleType.FACE]: '🎭',
    [RoleType.CONTROL]: '🧙',
  };
  return emojiMap[role] || '🎲';
};
