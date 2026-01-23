import { SlashCommandBuilder } from 'discord.js';
import { BotCommandOptionInfo } from '#shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { endSession } from '#modules/session/controller/session.controller.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { getActiveSessionInChannel, isUserGameMaster } from '#modules/session/repository/session.repository.js';
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

    const channelId = interaction.channelId;

    const session = await getActiveSessionInChannel(channelId);
    if (!session) {
      await sendEphemeralReply(
        '❌ No active session found in this channel.',
        interaction
      );
      return;
    }

    // Permission check: user must be Admin OR the Game Master of the session
    const member = interaction.member;
    const isAdmin = member.permissions.has('Administrator');
    const isGameMaster = await isUserGameMaster(
      interaction.user.id,
      session.id
    );

    if (!isAdmin && !isGameMaster) {
      logger.info('User denied permission to end session', {
        userId: interaction.user.id,
        sessionId: session.id,
        isAdmin,
        isGameMaster,
      });
      await sendEphemeralReply(
        '❌ You must be the Game Master of this session or a server Administrator to end it.',
        interaction
      );
      return;
    }

    await interaction.deferReply({ ephemeral: true });

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
