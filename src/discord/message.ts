import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessagePayload,
  TextChannel,
} from 'discord.js';
import { getPNGAttachmentBuilder } from '../utils/attachmentBuilders';
import { BotAttachmentFileNames, BotPaths } from '../utils/botDialogStrings';
import { ExtendedClient } from '../structures/ExtendedClient';
import { roles } from '../index';
import { Role } from '@prisma/client';

const createActionRowOfButtons = (roles: Role[]) => {
  const row = new ActionRowBuilder<ButtonBuilder>();
  roles.forEach((role) => {
    row.components.push(
      new ButtonBuilder()
        .setCustomId(role.id)
        .setLabel(role.name)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(`<:${role.name}:${role.emojiId}`)
    );
  });
  return row;
};

const rolesRow1 = createActionRowOfButtons(roles.slice(0, 3));
const rolesRow2 = createActionRowOfButtons(roles.slice(3));

export const createSessionMessage = async (
  client: ExtendedClient,
  channel_id: string
) => {
  try {
    const channel = client.channels.cache.get(channel_id);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error(`Couldn't find text channel ${channel_id}`);
    }

    const attachment = getPNGAttachmentBuilder(
      `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
      BotAttachmentFileNames.CurrentSession
    );

    const sentMessage = await channel.send({
      content: 'Hello everyone, we have a new session for people to join!',
      files: [attachment],
      components: [rolesRow1, rolesRow2],
    });

    return sentMessage.id;
  } catch (error) {
    return `error caught: ${error}`;
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

  setTimeout(async () => {
    await msg.delete();
  }, 1000 * duration);
};
