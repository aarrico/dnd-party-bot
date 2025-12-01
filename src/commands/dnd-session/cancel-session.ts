import { SlashCommandBuilder, ChannelType, AutocompleteInteraction } from 'discord.js';
import { BotCommandOptionInfo, BotDialogs } from '#shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';
import { sanitizeUserInput } from '#shared/validation/sanitizeUserInput.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { getSessionById } from '#modules/session/repository/session.repository.js';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandOptionInfo.CancelSession_Name)
    .setDescription(BotCommandOptionInfo.CancelSession_Description)
    .addStringOption((channel) =>
      channel
        .setName(BotCommandOptionInfo.CancelSession_ChannelName)
        .setDescription(BotCommandOptionInfo.CancelSession_ChannelDescription)
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((reason) =>
      reason
        .setName(BotCommandOptionInfo.CancelSession_ReasonName)
        .setDescription(BotCommandOptionInfo.CancelSession_ReasonDescription)
        .setRequired(true)
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    if (!interaction.guild) return;

    const focusedOption = interaction.options.getFocused(true);
    if (focusedOption.name === BotCommandOptionInfo.CancelSession_ChannelName) {
      const channels = await interaction.guild.channels.fetch();
      const topLevelTextChannels = channels
        .filter(channel => 
          channel?.type === ChannelType.GuildText && 
          channel.parentId === null
        )
        .map(channel => ({
          name: channel!.name,
          value: channel!.id
        }))
        .slice(0, 25); // Discord limits to 25 choices

      await interaction.respond(topLevelTextChannels);
    }
  },
  async execute(interaction: ExtendedInteraction) {
    const campaign = interaction.guild;
    if (!campaign) {
      throw new Error('Command must be run in a server!');
    }

    const channelId = interaction.options.getString(
      BotCommandOptionInfo.CancelSession_ChannelName,
      true
    );

    const fullChannel = await campaign.channels.fetch(channelId);
    if (!fullChannel || fullChannel.type !== ChannelType.GuildText) {
      await sendEphemeralReply(
        BotDialogs.continueSessionInvalidChannel,
        interaction
      );
      return;
    }

    if (fullChannel.parentId !== null) {
      await sendEphemeralReply(
        BotDialogs.continueSessionChannelNotSession,
        interaction
      );
      return;
    }

    let existingSession;
    try {
      existingSession = await getSessionById(fullChannel.id, true);
    } catch {
      await sendEphemeralReply(
        BotDialogs.continueSessionNotFound,
        interaction
      );
      return;
    }

    const rawReason = interaction.options.getString(BotCommandOptionInfo.CancelSession_ReasonName, true);
    const reason = sanitizeUserInput(rawReason, { maxLength: 512 }) || 'No reason provided.';

    await interaction.deferReply({ ephemeral: true });

    await cancelSession(fullChannel.id, reason);

    await interaction.editReply('Session data has been deleted.');
  },
};
