import {
  AutocompleteInteraction,
  ButtonInteraction,
  CacheType,
  ChannelType,
  ChatInputCommandInteraction,
  Events,
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} from 'discord.js';
import { client } from '../../index.js';
import { Event } from '../../structures/Event.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { sendMessageReplyDisappearingMessage, getRoleButtonsForSession } from '../../discord/message.js';
import { createSessionImage } from '../../utils/sessionImage.js';
import { getImgAttachmentBuilder } from '../../utils/attachmentBuilders.js';
import {
  BotAttachmentFileNames,
  BotDialogs,
  BotPaths,
  getAddPartyMemberMsg,
} from '../../utils/botDialogStrings.js';
import { processRoleSelection } from '../../controllers/session.js';
import { PartyMember } from '../../models/party';
import { getRoleByString } from '../../models/role.js';
import { getSessionById } from '../../db/session.js';
import { updateUserTimezone } from '../../db/user.js';
import { AMERICAN_TIMEZONES } from '../../utils/timezoneUtils.js';

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

  const channel = await client.channels.fetch(channelId);
  if (channel && channel.type === ChannelType.GuildText) {
    await channel.permissionOverwrites.edit(userId, {
      ViewChannel: true,
      SendMessages: true
    });
  }

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

const processAutocomplete = async (
  interaction: AutocompleteInteraction<CacheType>
): Promise<void> => {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    return;
  }

  // Check if the command has an autocomplete method
  if ('autocomplete' in command && command.autocomplete) {
    await command.autocomplete(interaction);
  }
};

const processButton = async (
  interaction: ButtonInteraction<CacheType>
): Promise<void> => {
  // Handle "Change Timezone" button in DMs
  if (interaction.customId === 'change-timezone-button') {
    // Create timezone select menu
    const timezoneSelect = new StringSelectMenuBuilder()
      .setCustomId('change-timezone-select')
      .setPlaceholder('Select your timezone')
      .addOptions(
        AMERICAN_TIMEZONES.map((tz) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(tz.name)
            .setDescription(tz.value)
            .setValue(tz.value)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(timezoneSelect);

    await interaction.reply({
      content: '🕐 Please select your new timezone:',
      components: [row],
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  // Handle session role selection buttons
  const session = await getSessionById(interaction.channelId);
  if (!session) {
    throw new Error('something went wrong getting the session from the db');
  }

  if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
    throw new Error('something went wrong getting the channel from discord');
  }

  // Fetch the message directly instead of relying on cache
  let message;
  try {
    message = await interaction.channel.messages.fetch(session.partyMessageId);
    console.log(`Fetched message ${message.content} successfully.`);
  } catch (error) {
    console.error(`Failed to fetch message ${session.partyMessageId}:`, error);
    throw new Error('Could not find the session message to update');
  }

  const result = await partyMemberJoined(
    interaction.user.id,
    interaction.user.displayName,
    interaction.customId,
    interaction.channelId
  );

  await sendMessageReplyDisappearingMessage(interaction, result);

  try {
    await createSessionImage(session.id);

    const attachment = getImgAttachmentBuilder(
      `${BotPaths.TempDir}/${BotAttachmentFileNames.CurrentSession}`,
      BotAttachmentFileNames.CurrentSession
    );

    await message.edit({
      content: BotDialogs.sessions.scheduled(session.name, session.date, (session.timezone ?? 'America/Los_Angeles') as string),
      files: [attachment],
      components: getRoleButtonsForSession(session.status),
    });
  } catch (error) {
    console.error('Failed to update session image:', error);
    // Still update the message even if image creation fails
    await message.edit({
      content: BotDialogs.sessions.scheduled(session.name, session.date, (session.timezone ?? 'America/Los_Angeles') as string),
      components: getRoleButtonsForSession(session.status),
    });
  }
};

const processStringSelectMenu = async (interaction: StringSelectMenuInteraction<CacheType>) => {
  const { customId, values, user } = interaction;

  if (customId === 'onboarding-timezone-select' || customId === 'change-timezone-select') {
    const selectedTimezone = values[0];

    // Update user's timezone in database
    await updateUserTimezone(user.id, selectedTimezone);

    // Create "Change Timezone" button
    const changeTimezoneButton = new ButtonBuilder()
      .setCustomId('change-timezone-button')
      .setLabel('Change Timezone')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(changeTimezoneButton);

    // Send confirmation message with button
    await interaction.reply({
      content: BotDialogs.onboarding.timezoneSet(selectedTimezone),
      components: [row],
      flags: MessageFlags.Ephemeral,
    });

    console.log(`[Onboarding] Set timezone for user ${user.username} (${user.id}) to ${selectedTimezone}`);
  }
};

export default new Event(Events.InteractionCreate, async (interaction) => {
  if (interaction.isCommand() && interaction.isChatInputCommand()) {
    await processCommand(interaction);
  } else if (interaction.isAutocomplete()) {
    await processAutocomplete(interaction);
  } else if (interaction.isButton()) {
    await processButton(interaction);
  } else if (interaction.isStringSelectMenu()) {
    await processStringSelectMenu(interaction);
  }
});
