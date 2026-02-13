import { SlashCommandBuilder } from 'discord.js';
import { BotCommandOptionInfo } from '#shared/messages/botDialogStrings.js';
import { SessionStatus } from '#modules/session/domain/session.types.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { updateSession } from '#modules/session/repository/session.repository.js';
import { regenerateSessionMessage } from '#modules/session/controller/session.controller.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('SetSessionStatusCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('set-session-status')
    .setDescription('Set the status of an session (for testing purposes)')
    .addStringOption((id) =>
      id
        .setName(BotCommandOptionInfo.Session_Id_Name)
        .setDescription(BotCommandOptionInfo.Session_Id_Description)
        .setRequired(true)
    )
    .addStringOption((status) =>
      status
        .setName('status')
        .setDescription('The new status for the session')
        .setRequired(true)
        .addChoices(
          { name: 'Scheduled', value: 'SCHEDULED' },
          { name: 'Full', value: 'FULL' },
          { name: 'Active', value: 'ACTIVE' },
          { name: 'Completed', value: 'COMPLETED' },
          { name: 'Canceled', value: 'CANCELED' }
        )
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      if (!interaction.member.permissions.has('Administrator')) {
        await sendEphemeralReply(
          'Only Admins can run this command!',
          interaction
        );
        return;
      }

      const sessionId = interaction.options.getString(
        BotCommandOptionInfo.Session_Id_Name,
        true
      );
      const newStatus = interaction.options.getString(
        'status',
        true
      ) as SessionStatus;

      await interaction.deferReply();

      // Update the session status
      await updateSession(sessionId, { status: newStatus });

      // Regenerate the session message (image + embed) with the new status
      await regenerateSessionMessage(sessionId);

      const statusEmojis = {
        SCHEDULED: '🟢',
        FULL: '🟡',
        ACTIVE: '🔵',
        COMPLETED: '🔴',
        CANCELED: '🔴',
      };

      await sendEphemeralReply(
        `${statusEmojis[newStatus]} Session status updated to **${newStatus}**!`,
        interaction
      );
    } catch (error) {
      logger.error('Error setting session status', { error });
      await sendEphemeralReply(
        'An error occurred while updating the session status.',
        interaction
      );
    }
  },
};
