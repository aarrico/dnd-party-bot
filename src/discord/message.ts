import { AttachmentBuilder, ButtonInteraction, ChannelType, MessageFlags, MessagePayload, TextChannel, ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';
import { client, roleButtons } from '@app/index.js';
import { ExtendedInteraction } from '@models/Command.js';
import { SessionStatus, RoleType } from '@prisma/client';

import { Session } from '@modules/session/domain/session.types.js';
import { BotAttachmentFileNames, BotDialogs, BotPaths } from '@shared/messages/botDialogStrings.js';
import { getImgAttachmentBuilder } from '@shared/files/attachmentBuilders.js';
import { createSessionImage } from '@shared/messages/sessionImage.js';
import { PartyMember } from '@modules/party/domain/party.types.js';
import {
  safeGuildFetch,
  safeGuildMembersFetch,
  safeChannelSend,
  safeUserSend,
} from '@shared/discord/discordErrorHandler.js';

/**
 * Get role buttons for session based on status
 * Only sessions with SCHEDULED status allow role selection
 */
export const getRoleButtonsForSession = (sessionStatus?: SessionStatus | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'): ActionRowBuilder<ButtonBuilder>[] => {
  return sessionStatus === SessionStatus.SCHEDULED ? roleButtons : [];
};

export const sendNewSessionMessage = async (
  session: Session,
  channel: TextChannel,
  partyMembers: PartyMember[] = []
) => {
  console.log(`Sending new session message for session: ${session.id}`);

  try {
    console.log(`Creating session image...`);
    const { getPartyInfoForImg } = await import('@modules/session/controller/session.controller.js');
    const party = await getPartyInfoForImg(session.id);
    await createSessionImage(session, party);

    const imagePath = `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`;
    console.log(`Attempting to attach image from: ${imagePath}`);

    // Check if the file exists before trying to attach it
    const fs = await import('fs');
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

export const sendChannelDisappearingMessage = async (
  channel: TextChannel,
  messageContentPayload: MessagePayload,
  duration = 10
) => {
  if (!channel || channel.type !== ChannelType.GuildText) return;

  const msg = await channel.send(messageContentPayload);
  if (duration === -1) {
    return;
  }

  setTimeout(() => {
    void msg.delete();
  }, 1000 * duration);
};

export const sendEphemeralReply = async (
  messageContent: string,
  interaction: ExtendedInteraction,
  files?: AttachmentBuilder[]
) => {
  try {
    if (interaction.replied || interaction.deferred) {
      // If already replied or deferred, use followUp
      return await interaction.followUp({
        content: messageContent,
        files: files ? [...files] : undefined,
        flags: MessageFlags.Ephemeral
      });
    } else {
      // If not replied yet, use reply
      return await interaction.reply({
        content: messageContent,
        files: files ? [...files] : undefined,
        flags: MessageFlags.Ephemeral
      });
    }
  } catch (error) {
    console.error('Error in sendEphemeralReply:', error);
    // If all else fails, try editReply
    try {
      return await interaction.editReply({
        content: messageContent,
        files: files ? [...files] : undefined
      });
    } catch (editError) {
      console.error('Error in editReply fallback:', editError);
      throw editError;
    }
  }
};

export const sendMessageReplyDisappearingMessage = async (
  interaction: ButtonInteraction,
  content: string,
  duration = 10
) => {
  const msg = await interaction.reply({
    content,
    flags: MessageFlags.Ephemeral
  });

  if (duration === -1) {
    return;
  }

  setTimeout(() => {
    void msg.delete();
  }, 1000 * duration);
};

export const notifyGuild = async (
  guildId: string,
  messageFormatter: (userId: string) => Promise<string>
) => {
  const guild = await safeGuildFetch(client, guildId);
  if (!guild) {
    throw new Error(`Guild with ID ${guildId} not found`);
  }
  const members = await safeGuildMembersFetch(guild);
  const users = Array.from(members.values())
    .map(member => { if (!member.user.bot) return member.user; })
    .filter(user => user !== undefined);

  await Promise.allSettled(users.map(async user => {
    try {
      const formattedMessage = await messageFormatter(user.id);
      return await safeUserSend(user, {
        content: formattedMessage,
      });
    } catch (error) {
      console.warn(`Failed to send DM to user ${user.id}:`, error);
      return null;
    }
  }));
};

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