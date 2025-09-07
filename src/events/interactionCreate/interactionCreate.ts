import {
  ButtonInteraction,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Events,
} from 'discord.js';
import { client } from '../../index.js';
import { Event } from '../../structures/Event.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { sendMessageReplyDisappearingMessage } from '../../discord/message.js';
import { createSessionImage } from '../../utils/sessionImage.js';
import { getPNGAttachmentBuilder } from '../../utils/attachmentBuilders.js';
import {
  BotAttachmentFileNames,
  BotDialogs,
  BotPaths,
  getAddPartyMemberMsg,
} from '../../utils/botDialogStrings.js';
import { processRoleSelection } from '../../controllers/session.js';
import { PartyMember } from '../../models/party';
import { getRoleByString } from '../../models/role.js';

const partyMemberJoined = async (
  userId: string,
  username: string,
  role: string,
  channelId: string
): Promise<string> => {
  const roleType = getRoleByString(role);
  const newPartyMember: PartyMember = {
    userId,
    username,
    channelId,
    role: roleType.id,
  };

  const roleSelectionStatus = await processRoleSelection(
    newPartyMember,
    channelId
  );

  return getAddPartyMemberMsg(roleSelectionStatus, newPartyMember);
};

const processCommand = async (
  interaction: ChatInputCommandInteraction<CacheType>
): Promise<void> => {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    await interaction.reply(BotDialogs.interactionCreateNonexistentCommand);
    return;
  }
  await command.execute(interaction as ExtendedInteraction);
};

const processButton = async (
  interaction: ButtonInteraction<CacheType>
): Promise<void> => {
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error('something went wrong getting the channel from discord');
  }

  const message = channel.messages.cache.get(interaction.message.id);
  if (!message) {
    throw new Error('something went wrong getting the message from discord');
  }

  const result = await partyMemberJoined(
    interaction.user.id,
    interaction.user.displayName,
    interaction.customId,
    interaction.channelId
  );

  await sendMessageReplyDisappearingMessage(interaction, result);
  await createSessionImage(interaction.message.id);

  const attachment = getPNGAttachmentBuilder(
    `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
    BotAttachmentFileNames.CurrentSession
  );

  await message.edit({
    content: BotDialogs.interactionCreateNewSessionAnnouncement,
    files: [attachment],
  });
};

export default new Event(Events.InteractionCreate, async (interaction) => {
  if (interaction.isCommand() && interaction.isChatInputCommand()) {
    await processCommand(interaction);
  } else if (interaction.isButton()) {
    await processButton(interaction);
  }
});
