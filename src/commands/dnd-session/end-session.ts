import { SlashCommandBuilder } from 'discord.js';
import { BotCommandOptionInfo } from '#shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { endSession } from '#modules/session/controller/session.controller.js';
import { getActiveSessionInChannel } from '#modules/session/repository/session.repository.js';
import { canManageSession } from '#shared/discord/permissions.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('EndSessionCommand');

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandOptionInfo.EndSession_Name)
    .setDescription(BotCommandOptionInfo.EndSession_Description),
  async execute(interaction: ExtendedInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      throw new Error('Command must be run in a server!');
    }

    await interaction.deferReply({ ephemeral: true });

    const channelId = interaction.channelId;

    const session = await getActiveSessionInChannel(channelId);
    if (!session) {
      await interaction.editReply('❌ No active session found in this channel.');
      return;
    }

    const { allowed, isAdmin, isGameMaster } = await canManageSession(
      interaction.member,
      session.id
    );

    if (!allowed) {
      await interaction.editReply(
        '❌ You must be the Game Master of this session or a server Administrator to end it.'
      );
      return;
    }

    try {
      await endSession(session.id);
      logger.info('Session ended by user', {
        sessionId: session.id,
        userId: interaction.user.id,
        isAdmin,
        isGameMaster,
      });
      await interaction.editReply(`✅ Session **${session.name}** has been marked as completed!`);
    } catch (error) {
      logger.error('Error ending session', { sessionId: session.id, error });
      await interaction.editReply('❌ An error occurred while ending the session.');
    }
  },
};
