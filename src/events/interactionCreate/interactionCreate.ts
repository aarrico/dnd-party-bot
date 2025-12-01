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
  MessageFlags,
} from 'discord.js';
import { client } from '#app/index.js';
import { Event } from '#shared/discord/Event.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { sendMessageReplyDisappearingMessage } from '#shared/discord/messages.js';
import {
  BotDialogs,
  getAddPartyMemberMsg,
} from '#shared/messages/botDialogStrings.js';
import { processRoleSelection } from '#modules/session/controller/session.controller.js';
import { PartyMember, RoleSelectionStatus } from '#modules/party/domain/party.types.js';
import { getRoleByString } from '#modules/role/domain/roleManager.js';
import { getSessionById } from '#modules/session/repository/session.repository.js';
import { updateUserTimezone } from '#modules/user/repository/user.repository.js';
import { buildRegionSelectMenu, buildTimezoneSelectMenu, TIMEZONE_REGIONS } from '#shared/datetime/timezoneUtils.js';

const partyMemberJoined = async (
  userId: string,
  username: string,
  role: string,
  channelId: string
): Promise<{ message: string; status: RoleSelectionStatus }> => {
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

  // Only grant channel permissions if the user was successfully added to the party
  if (roleSelectionStatus === RoleSelectionStatus.ADDED_TO_PARTY) {
    const channel = await client.channels.fetch(channelId);
    if (channel && channel.type === ChannelType.GuildText) {
      await channel.permissionOverwrites.edit(userId, {
        ViewChannel: true,
        SendMessages: true
      });
    }
  }

  return {
    message: getAddPartyMemberMsg(roleSelectionStatus, newPartyMember),
    status: roleSelectionStatus
  };
};

const processCommand = async (
  interaction: ChatInputCommandInteraction<CacheType>
): Promise<void> => {
  // If GUILD_ID is set, only process commands from that guild
  if (process.env.GUILD_ID && interaction.guildId !== process.env.GUILD_ID) {
    console.log(`Ignoring command from guild ${interaction.guildId} (only processing ${process.env.GUILD_ID})`);
    return;
  }

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
    // Create region select menu (first step)
    const regionSelect = buildRegionSelectMenu('change-region-select');
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(regionSelect);

    await interaction.reply({
      content: '🌍 Please select your region first:',
      components: [row],
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  const session = await getSessionById(interaction.channelId);
  if (!session) {
    throw new Error('something went wrong getting the session from the db');
  }

  if (!interaction.channel || interaction.channel.type !== ChannelType.GuildText) {
    throw new Error('something went wrong getting the channel from discord');
  }

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

  await sendMessageReplyDisappearingMessage(interaction, result.message);

  // Only regenerate the session message if the party actually changed
  const partyChangedStatuses = [
    RoleSelectionStatus.ADDED_TO_PARTY,
    RoleSelectionStatus.REMOVED_FROM_PARTY,
    RoleSelectionStatus.ROLE_CHANGED,
  ];

  if (partyChangedStatuses.includes(result.status)) {
    try {
      const { regenerateSessionMessage } = await import('#modules/session/controller/session.controller.js');
      await regenerateSessionMessage(session.id, interaction.guildId ?? '');
    } catch (error) {
      console.error('Failed to update session message:', error);
    }
  }
};

const processStringSelectMenu = async (interaction: StringSelectMenuInteraction<CacheType>) => {
  const { customId, values, user } = interaction;

  // Handle region selection (step 1) - show timezone options for that region
  if (customId === 'onboarding-region-select' || customId === 'change-region-select') {
    const selectedRegion = values[0];
    const region = TIMEZONE_REGIONS.find((r) => r.value === selectedRegion);
    const timezoneSelectId = customId === 'onboarding-region-select' ? 'onboarding-timezone-select' : 'change-timezone-select';

    const timezoneSelect = buildTimezoneSelectMenu(timezoneSelectId, selectedRegion);
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(timezoneSelect);

    await interaction.reply({
      content: `🕐 Select your timezone in ${region?.emoji} ${region?.name}:`,
      components: [row],
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  // Handle timezone selection (step 2) - save the timezone
  if (customId === 'onboarding-timezone-select' || customId === 'change-timezone-select') {
    const selectedTimezone = values[0];

    await updateUserTimezone(user.id, selectedTimezone);

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
