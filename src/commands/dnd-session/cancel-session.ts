import { SlashCommandBuilder, AutocompleteInteraction } from 'discord.js';
import {
  BotCommandOptionInfo,
  BotDialogs,
} from '#shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { cancelSession } from '#modules/session/controller/session.controller.js';
import { sanitizeUserInput } from '#shared/validation/sanitizeUserInput.js';
import { getSessionById } from '#modules/session/repository/session.repository.js';
import { canManageSession } from '#shared/discord/permissions.js';
import { handleActiveSessionAutocomplete } from '#modules/session/presentation/sessionMessages.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('CancelSessionCommand');

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
    const focusedOption = interaction.options.getFocused(true);
    if (
      focusedOption.name ===
      String(BotCommandOptionInfo.CancelSession_ChannelName)
    ) {
      await handleActiveSessionAutocomplete(interaction);
    }
  },
  async execute(interaction: ExtendedInteraction) {
    const campaign = interaction.guild;
    if (!campaign) {
      throw new Error('Command must be run in a server!');
    }

    await interaction.deferReply({ ephemeral: true });

    const sessionId = interaction.options.getString(
      BotCommandOptionInfo.CancelSession_ChannelName,
      true
    );

    let session;
    try {
      session = await getSessionById(sessionId, true);
    } catch {
      await interaction.editReply(BotDialogs.continueSessionNotFound);
      return;
    }

    const { allowed, isAdmin, isGameMaster } = await canManageSession(
      interaction.member,
      sessionId
    );

    if (!allowed) {
      await interaction.editReply(
        '❌ You must be the Game Master of this session or a server Administrator to cancel it.'
      );
      return;
    }

    const rawReason = interaction.options.getString(
      BotCommandOptionInfo.CancelSession_ReasonName,
      true
    );
    const reason =
      sanitizeUserInput(rawReason, { maxLength: 512 }) || 'No reason provided.';

    try {
      await cancelSession(sessionId, reason);
      logger.info('Session canceled by user', {
        sessionId,
        sessionName: session.name,
        userId: interaction.user.id,
        isAdmin,
        isGameMaster,
        reason,
      });
      await interaction.editReply(
        `✅ Session **${session.name}** has been canceled.`
      );
    } catch (error) {
      logger.error('Error canceling session', { sessionId, error });
      await interaction.editReply(
        '❌ An error occurred while canceling the session.'
      );
    }
  },
};
