import {
  ActionRow,
  ButtonComponent,
  ButtonInteraction,
  CacheType,
  ChannelType,
  CommandInteraction,
  CommandInteractionOptionResolver,
  ComponentType,
  MessageActionRowComponent,
} from 'discord.js';
import { client } from '../..';
import { Event } from '../../structures/Event';
import { ExtendedInteraction } from '../../typings/Command';
import { sendMessageReplyDisappearingMessage } from '../../discord/message';
import { createSessionImage } from '../../utils/sessionImage';
import { getPNGAttachmentBuilder } from '../../utils/attachmentBuilders';
import {
  BotAttachmentFileNames,
  BotDialogs,
  BotPaths,
  getAddPartyMemberMsg,
} from '../../utils/botDialogStrings';
import { processRoleSelection } from '../../controllers/session';
import { User } from '@prisma/client';

const partyMemberJoined = async (
  user: User,
  role: string,
  channelId: string
): Promise<string> => {
  const newPartyMember = {
    user,
    role,
  };

  const roleSelectionStatus = await processRoleSelection(
    newPartyMember,
    channelId
  );

  return getAddPartyMemberMsg(roleSelectionStatus, newPartyMember);
};

const getClickedRole = (
  components: ActionRow<MessageActionRowComponent>[],
  buttonId: string
): ButtonComponent => {
  for (const component of components) {
    for (const sub of component.components) {
      if (
        sub.type === ComponentType.Button &&
        sub.customId === buttonId &&
        sub.label
      ) {
        return sub;
      }
    }
  }

  throw new Error('something went wrong getting the button from discord');
};

const processCommand = async (interaction: CommandInteraction<CacheType>) => {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return await interaction.reply(
      BotDialogs.InteractionCreate_NonexistentCommand
    );
  }
  command.callBack({
    args: interaction.options as CommandInteractionOptionResolver,
    client,
    interaction: interaction as ExtendedInteraction,
  });
};

const processButton = async (interaction: ButtonInteraction<CacheType>) => {
  const channel = interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error('something went wrong getting the channel from discord');
  }

  const message = channel.messages.cache.get(interaction.message.id);
  if (!message) {
    throw new Error('something went wrong getting the message from discord');
  }

  const buttonClicked = getClickedRole(
    interaction.message.components,
    interaction.customId
  );

  const result = await partyMemberJoined(
    {
      id: interaction.user.id,
      username: interaction.user.displayName,
    },
    buttonClicked.label || '',
    interaction.channelId
  );

  await sendMessageReplyDisappearingMessage(interaction, result);
  await createSessionImage(interaction.message.id);

  const attachment = getPNGAttachmentBuilder(
    `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
    BotAttachmentFileNames.CurrentSession
  );

  await message.edit({
    content: BotDialogs.InteractionCreate_HereIsANewSessionMessage,
    files: [attachment],
  });
};

export default new Event('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    await processCommand(interaction);
  } else if (interaction.isButton()) {
    await processButton(interaction);
  }
});
