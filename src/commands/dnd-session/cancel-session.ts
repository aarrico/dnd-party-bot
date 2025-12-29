import { SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import { BotCommandOptionInfo, BotDialogs } from '#shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';
import { sanitizeUserInput } from '#shared/validation/sanitizeUserInput.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { getSessionById, getActiveSessionsForGuild } from '#modules/session/repository/session.repository.js';
import { formatSessionDateLong } from '#shared/datetime/dateUtils.js';

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
    if (focusedOption.name === String(BotCommandOptionInfo.CancelSession_ChannelName)) {
      const sessions = await getActiveSessionsForGuild(interaction.guild.id);

      const choices = sessions.map(session => ({
        name: `${session.name} (${session.campaignName}) - ${formatSessionDateLong(session.date, session.timezone)}`,
        value: session.id
      }));

      await interaction.respond(choices);
    }
  },
  async execute(interaction: ExtendedInteraction) {
    const campaign = interaction.guild;
    if (!campaign) {
      throw new Error('Command must be run in a server!');
    }

    const sessionId = interaction.options.getString(
      BotCommandOptionInfo.CancelSession_ChannelName,
      true
    );

    try {
      await getSessionById(sessionId, true);
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

    await cancelSession(sessionId, reason);

    await interaction.editReply('Session data has been deleted.');
  },
};
