import {
  addUserToParty,
  createSession,
  deletePartyMember,
  getParty,
  getSession,
  updatePartyMemberRole,
} from '../db/session';
import { client } from '../index';
import { TextChannel } from 'discord.js';
import { PartyMember, RoleSelectionStatus } from '../models/party';
import { AvatarOptions, PartyMemberImgInfo } from '../models/discord';
import { getActiveCampaign } from '../db/campaign';
import { BotCommandOptionInfo, BotDialogs } from '../utils/botDialogStrings';
import DateChecker from '../utils/dateChecker';
import { createSessionMessage, sendEphemeralReply } from '../discord/message';
import { createChannel } from '../discord/channel';
import { createSessionImage } from '../utils/sessionImage';
import { ExtendedInteraction } from '../typings/Command';

export const initSession = async (interaction: ExtendedInteraction) => {
  const guild = interaction.guild;
  if (!guild) {
    throw new Error('Command must be run in a server!');
  }

  const activeCampaign = await getActiveCampaign(guild.id);

  const sessionName = interaction.options.get(
    BotCommandOptionInfo.CreateSession_SessionName
  )?.value as string;

  if (!sessionName) {
    await interaction.reply(BotDialogs.CreateSessionInvalidSessionName);
  }

  const date = DateChecker(interaction);
  if (!date) {
    await sendEphemeralReply(
      BotDialogs.CreateSessionInvalidDateEntered,
      interaction
    );
    return;
  }

  const newSessionId = await createChannel(
    guild.id,
    activeCampaign.id,
    sessionName
  );

  const newSession = {
    id: newSessionId,
    name: sessionName,
    date: date,
    campaignId: activeCampaign.id,
  };

  const userData = {
    username: interaction.user.displayName,
    id: interaction.user.id,
    sessionId: newSessionId,
  };

  await createSessionMessage(client, newSession);

  // do some db wizardry
  await createSession(newSession, userData.id);
  await createSessionImage(newSessionId);

  const message = `${
    BotDialogs.CreateSessionDMSessionTime
  }${date.toLocaleString()}`;

  const user = client.users.cache.get(interaction.user.id);
  user?.send(message);

  //send to DMs
  await sendEphemeralReply(BotDialogs.CreateSessionOneMoment, interaction);
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
    (member) => member.user.id === newPartyMember.user.id
  );
  if (!existingMember) {
    await addUserToParty(
      newPartyMember.user.id,
      sessionId,
      newPartyMember.role
    );
    return RoleSelectionStatus.ADDED_TO_PARTY;
  }

  if (newPartyMember.role === 'game-master') {
    return RoleSelectionStatus.INVALID;
  }

  if (newPartyMember.role === existingMember.role) {
    await deletePartyMember(existingMember.user.id, sessionId);
    return RoleSelectionStatus.REMOVED_FROM_PARTY;
  }

  await updatePartyMemberRole(
    newPartyMember.user.id,
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
    const matchingUser = party.find((pm) => pm.user.id === member.id);
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
