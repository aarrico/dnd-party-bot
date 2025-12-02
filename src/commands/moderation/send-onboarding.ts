import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { sendTimezoneOnboardingDM } from '#shared/datetime/timezoneUtils.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('SendOnboardingCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('send-onboarding')
    .setDescription('Sends timezone onboarding DM to all guild members')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction: ExtendedInteraction) {
    const guild = interaction.guild;
    if (!guild) {
      await sendEphemeralReply('This command must be run in a server!', interaction);
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      // Fetch all members
      const members = await guild.members.fetch();
      const nonBotMembers = members.filter((m) => !m.user.bot);

      logger.info('Sending onboarding DMs', {
        guildId: guild.id,
        guildName: guild.name,
        memberCount: nonBotMembers.size,
      });

      let sent = 0;
      let failed = 0;

      for (const [, member] of nonBotMembers) {
        try {
          await sendTimezoneOnboardingDM(member.user);
          sent++;
        } catch (error) {
          logger.error('Failed to send onboarding DM', {
            guildId: guild.id,
            userId: member.user.id,
            username: member.user.username,
            error,
          });
          failed++;
        }
      }

      const message = `✅ Onboarding complete!\n• Sent: ${sent} DMs\n• Failed: ${failed}`;
      logger.info('Onboarding command summary', { guildId: guild.id, sent, failed });
      await interaction.editReply(message);
    } catch (error) {
      logger.error('Onboarding command failed', { error });
      await interaction.editReply('❌ Failed to send onboarding. Check logs for details.');
    }
  },
};
