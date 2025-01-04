import { Event } from '../../structures/Event';
import { Events } from 'discord.js';

export default new Event(Events.ClientReady, () => {
  console.log('Bot is online!');
});
