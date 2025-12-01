import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { sendTimezoneOnboardingDM } from '#shared/datetime/timezoneUtils.js';

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

      console.log(`[send-onboarding] Sending onboarding to ${nonBotMembers.size} members in ${guild.name}`);

      let sent = 0;
      let failed = 0;

      for (const [, member] of nonBotMembers) {
        try {
          await sendTimezoneOnboardingDM(member.user);
          sent++;
        } catch (error) {
          console.error(`[send-onboarding] Failed to send to ${member.user.username}:`, error);
          failed++;
        }
      }

      const message = `✅ Onboarding complete!\n• Sent: ${sent} DMs\n• Failed: ${failed}`;
      console.log(`[send-onboarding] ${message}`);
      await interaction.editReply(message);
    } catch (error) {
      console.error('[send-onboarding] Failed:', error);
      await interaction.editReply('❌ Failed to send onboarding. Check logs for details.');
    }
  },
};
