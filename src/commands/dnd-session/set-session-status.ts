import { SlashCommandBuilder } from 'discord.js';
import { BotCommandOptionInfo } from '../../utils/botDialogStrings.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { updateSession } from '../../db/session.js';
import { sendEphemeralReply } from '../../discord/message.js';
import { createSessionImage } from '../../utils/sessionImage.js';

export default {
  data: new SlashCommandBuilder()
    .setName('set-session-status')
    .setDescription('Set the status of an session (for testing purposes)')
    .addStringOption((id) =>
      id
        .setName(BotCommandOptionInfo.SessionId_Name)
        .setDescription(BotCommandOptionInfo.SessionId_Description)
        .setRequired(true)
    )
    .addStringOption((status) =>
      status
        .setName('status')
        .setDescription('The new status for the session')
        .setRequired(true)
        .addChoices(
          { name: 'Scheduled', value: 'SCHEDULED' },
          { name: 'Active', value: 'ACTIVE' },
          { name: 'Completed', value: 'COMPLETED' },
          { name: 'Canceled', value: 'CANCELED' }
        )
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      if (!interaction.member.permissions.has('Administrator')) {
        await sendEphemeralReply('Only Admins can run this command!', interaction);
        return;
      }

      const sessionId = interaction.options.getString(BotCommandOptionInfo.SessionId_Name, true);
      const newStatus = interaction.options.getString('status', true) as 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';

      await interaction.deferReply();

      // Update the session status
      await updateSession(sessionId, { status: newStatus });

      // Get session and party data for image generation
      const { getSessionById } = await import('../../db/session.js');
      const { getPartyInfoForImg } = await import('../../controllers/session.js');
      const session = await getSessionById(sessionId);
      const party = await getPartyInfoForImg(sessionId);

      if (!session) {
        throw new Error('Session not found');
      }

      const sessionData = {
        id: session.id,
        name: session.name,
        date: session.date,
        campaignId: session.campaignId,
        partyMessageId: session.partyMessageId ?? '',
        eventId: session.eventId,
        status: newStatus,
        timezone: session.timezone ?? 'America/Los_Angeles',
      };

      // Regenerate the session image with the new status border
      await createSessionImage(sessionData, party);

      const statusEmojis = {
        SCHEDULED: '🟢',
        ACTIVE: '🟡',
        COMPLETED: '🔵',
        CANCELED: '🔴'
      };

      await sendEphemeralReply(
        `${statusEmojis[newStatus]} Session status updated to **${newStatus}** and image regenerated with new border color!`,
        interaction
      );
    } catch (error) {
      console.error('Error setting session status:', error);
      await sendEphemeralReply(
        'An error occurred while updating the session status.',
        interaction
      );
    }
  },
};