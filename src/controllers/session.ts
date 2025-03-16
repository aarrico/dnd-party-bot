import { TextChannel } from 'discord.js';
import { getActiveCampaign } from '../db/campaign';
import {
  createSession,
  deleteSessionById,
  getParty,
  getSession,
  getSessionById,
  getSessions,
  updateSession,
} from '../db/session';
import {
  createChannel,
  deleteChannel,
  renameChannel,
} from '../discord/channel';
import { createSessionMessage, sendEphemeralReply } from '../discord/message';
import { client } from '../index';
import { ExtendedInteraction } from '../typings/Command';
import { AvatarOptions, PartyMemberImgInfo } from '../typings/discord';
import { PartyMember, RoleSelectionStatus } from '../typings/party';
import { ListSessionsOptions, ListSessionsResult } from '../typings/session';
import { getPNGAttachmentBuilder } from '../utils/attachmentBuilders';
import {
  BotAttachmentFileNames,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from '../utils/botDialogStrings';
import DateChecker from '../utils/dateChecker';
import { createSessionImage } from '../utils/sessionImage';
import { addUserToParty, updatePartyMemberRole } from '../db/user';
import { deletePartyMember } from '../db/partyMember';

export const initSession = async (
  guildId: string,
  sessionName: string,
  date: Date,
  username: string,
  userId: string
): Promise<string> => {
  const activeCampaign = await getActiveCampaign(guildId);

  const newSessionId = await createChannel(
    guildId,
    activeCampaign.id,
    sessionName
  );

  const newSession = {
    id: newSessionId,
    name: sessionName,
    date: date,
    campaignId: activeCampaign.id,
  };

  // const userData = {
  //   username,
  //   id: userId,
  //   sessionId: newSessionId,
  // };

  await createSessionMessage(client, newSession);

  // do some db wizardry
  await createSession(newSession, userId);
  await createSessionImage(newSessionId);

  return BotDialogs.createSessionDMSessionTime(
    activeCampaign.name,
    sessionName,
    date
  );
};

export const cancelSession = async (sessionId: string, reason: string) => {
  const session = await getSession(sessionId);

  for (const partyMember of session.partyMembers) {
    const user = await client.users.fetch(partyMember.channelId);
    await user.send({
      content: `🚨 Notice: ${session.name} on ${session.date} has been canceled!\n${reason}`,
    });
  }

  await deleteChannel(session.id, reason);
  await deleteSessionById(sessionId);
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

    if (newProposedDate) {
      if (session.date.getDate() !== newProposedDate.getDate()) {
        session.date = newProposedDate;
      }
    }

    if (newSessionName && newSessionName !== session.name) {
      await renameChannel(session.id, newSessionName);
      session.name = newSessionName;
    }

    await updateSession(sessionId, session);

    await sendEphemeralReply(
      BotDialogs.sessions.updated(session.name),
      interaction
    );

    await createSessionImage(sessionId);

    const attachment = getPNGAttachmentBuilder(
      `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
      BotAttachmentFileNames.CurrentSession
    );

    const channel = await client.channels.fetch(sessionId);
    if (channel && channel.isTextBased()) {
      const messages = await channel.messages.fetchPinned();
      const message = messages.at(0);
      message?.edit({
        content: BotDialogs.interactionCreateNewSessionAnnouncement,
        files: [attachment],
      });
    }
  } catch (error) {
    await sendEphemeralReply(`There was an error: ${error}`, interaction);
  }
};

export const processRoleSelection = async (
  newPartyMember: PartyMember,
  sessionId: string
): Promise<RoleSelectionStatus> => {
  const { date, partyMembers: party } = await getSession(sessionId);

  if (date < new Date()) {
    return RoleSelectionStatus.EXPIRED;
  }

  if (party.length >= 6) {
    return RoleSelectionStatus.PARTY_FULL;
  }

  const existingMember = party.find(
    (member) => member.userId === newPartyMember.userId
  );
  if (!existingMember) {
    await addUserToParty(newPartyMember.userId, sessionId, newPartyMember.role);
    return RoleSelectionStatus.ADDED_TO_PARTY;
  }

  if (newPartyMember.role === 'game-master') {
    return RoleSelectionStatus.INVALID;
  }

  if (newPartyMember.role === existingMember.role) {
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
  channelId: string
): Promise<PartyMemberImgInfo[]> => {
  const channel = await client.channels.fetch(channelId);
  if (!channel || !(channel instanceof TextChannel)) {
    throw new Error('cannot find channel for session');
  }

  const party = await getParty(channelId);
  const avatarOptions: AvatarOptions = {
    extension: 'png',
    forceStatic: true,
  };

  return channel.members.map((member) => {
    const matchingUser = party.find((pm) => pm.userId === member.id);
    if (!matchingUser) {
      throw new Error('cannot find user for session');
    }

    return {
      userId: member.id,
      username: member.displayName,
      userAvatarURL: member.displayAvatarURL(avatarOptions),
      role: matchingUser.role,
    };
  });
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
