import {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  TextChannel
} from 'discord.js';
import { SessionStatus, RoleType } from '@prisma/client';
import { Session, PartyMemberImgInfo } from '@modules/session/domain/session.types.js';
import { PartyMember } from '@modules/party/domain/party.types.js';
import { BotAttachmentFileNames, BotDialogs, BotPaths } from '@shared/messages/botDialogStrings.js';
import { getImgAttachmentBuilder } from '@shared/files/attachmentBuilders.js';
import { createSessionImage } from '@shared/messages/sessionImage.js';
import { safeChannelSend } from '@shared/discord/discordErrorHandler.js';
import { roleButtons } from '@app/index.js';
import fs from 'fs';

/**
 * Get role buttons for session based on status
 * Only sessions with SCHEDULED status allow role selection
 */
export const getRoleButtonsForSession = (
  sessionStatus?: SessionStatus | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
): ActionRowBuilder<ButtonBuilder>[] => {
  return sessionStatus === SessionStatus.SCHEDULED ? roleButtons : [];
};

/**
 * Create an embed showing party members by role
 */
export const createPartyMemberEmbed = (
  partyMembers: PartyMember[],
  guildId: string,
  sessionName: string,
  sessionStatus?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'
): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setColor(getStatusColor(sessionStatus))
    .setTitle(`🎲 ${sessionName}`)
    .setTimestamp();

  if (partyMembers.length === 0) {
    return embed;
  }

  const membersByRole: Record<RoleType, PartyMember[]> = {} as Record<RoleType, PartyMember[]>;

  for (const member of partyMembers) {
    const roleType = member.role;
    if (!membersByRole[roleType]) {
      membersByRole[roleType] = [];
    }
    membersByRole[roleType].push(member);
  }

  for (const [roleType, members] of Object.entries(membersByRole) as [RoleType, PartyMember[]][]) {
    // Create mention links for all members in this role
    const memberLinks = members.map(member => `<@${member.userId}>`);

    // Convert enum to display name
    const displayName = roleType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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
  console.log(`Sending new session message for session: ${session.id}`);

  try {
    console.log(`Creating session image...`);
    // Dynamic import to avoid circular dependencies
    const sessionController = await import('@modules/session/controller/session.controller.js');
    const party = await sessionController.getPartyInfoForImg(session.id);
    await createSessionImage(session, party);

    const imagePath = `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`;
    console.log(`Attempting to attach image from: ${imagePath}`);

    // Check if the file exists before trying to attach it
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at: ${imagePath}`);
    }

    const stats = fs.statSync(imagePath);
    console.log(`Image file found. Size: ${stats.size} bytes`);

    const attachment = getImgAttachmentBuilder(
      imagePath,
      BotAttachmentFileNames.CurrentSession
    );

    const embed = createPartyMemberEmbed(partyMembers, channel.guildId, session.name, session.status);

    embed.setDescription(BotDialogs.sessions.scheduled(session.date, session.timezone ?? 'America/Los_Angeles'));

    console.log(`Sending message with embed, image, and buttons to channel: ${channel.id}`);
    const sentMessage = await safeChannelSend(channel, {
      embeds: [embed],
      files: [attachment],
      components: getRoleButtonsForSession(session.status),
    });

    console.log(`Message sent successfully with ID: ${sentMessage.id}`);
    return sentMessage.id;
  } catch (error) {
    console.error(`Error creating session image, falling back to message without image:`, error);

    try {
      console.log(`Sending fallback message without image to channel: ${channel.id}`);
      const embed = createPartyMemberEmbed(partyMembers, channel.guildId, session.name, session.status);
      embed.setDescription(BotDialogs.sessions.scheduled(session.date, session.timezone ?? 'America/Los_Angeles'));

      const sentMessage = await safeChannelSend(channel, {
        embeds: [embed],
        components: getRoleButtonsForSession(session.status),
      });

      console.log(`Fallback message sent successfully with ID: ${sentMessage.id}`);
      return sentMessage.id;
    } catch (fallbackError) {
      console.error(`Failed to send fallback message:`, fallbackError);
      throw fallbackError;
    }
  }
};

/**
 * Get color based on session status
 */
const getStatusColor = (status?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'): number => {
  const colorMap: Record<string, number> = {
    'SCHEDULED': 0x00FF00, // Green
    'ACTIVE': 0xFFD700,    // Gold
    'COMPLETED': 0x0080FF, // Blue
    'CANCELED': 0xFF0000,  // Red
  };
  return colorMap[status || 'SCHEDULED'] || 0x5865F2;
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
