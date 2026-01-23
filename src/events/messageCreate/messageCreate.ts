import {
  Events,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { Event } from '#shared/discord/Event.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('MessageCreateEvent');

const handleDMMessage = async (message: Message) => {
  // Ignore messages from bots (including our own)
  if (message.author.bot) {
    return;
  }

  // Only respond to DM messages
  if (!message.guild) {
    const content = message.content.toLowerCase().trim();

    // Respond to timezone-related keywords
    if (content.includes('timezone') || content === 'tz' || content === 'help') {
      try {
        const changeTimezoneButton = new ButtonBuilder()
          .setCustomId('change-timezone-button')
          .setLabel('Change Timezone')
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(changeTimezoneButton);

        await message.reply({
          content: '🕐 Click the button below to change your timezone:',
          components: [row],
        });

        logger.info('Sent timezone change button via DM', {
          userId: message.author.id,
          username: message.author.username,
        });
      } catch (error) {
        logger.error('Failed to send timezone button in DM', {
          userId: message.author.id,
          error,
        });
      }
    }
  }
};

export default new Event(Events.MessageCreate, handleDMMessage);
