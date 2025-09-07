import { Event } from '../../structures/Event.js';
import { Events } from 'discord.js';

export default new Event(Events.ClientReady, () => {
  console.log('Bot is online!');
});
