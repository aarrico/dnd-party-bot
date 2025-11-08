import {
  Events,
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { Event } from '@structures/Event.js';

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
      const changeTimezoneButton = new ButtonBuilder()
        .setCustomId('change-timezone-button')
        .setLabel('Change Timezone')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(changeTimezoneButton);

      await message.reply({
        content: '🕐 Click the button below to change your timezone:',
        components: [row],
      });

      console.log(`[DM Handler] Sent timezone button to ${message.author.username}`);
    }
  }
};

export default new Event(Events.MessageCreate, handleDMMessage);
