import { Events } from 'discord.js';
import { Event } from '../../structures/Event.js';
import { newGuildMember } from '../../controllers/users.js';

export default new Event(Events.GuildMemberAdd, newGuildMember);
