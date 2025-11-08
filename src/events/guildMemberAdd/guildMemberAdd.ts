import { Events } from 'discord.js';
import { Event } from '@shared/discord/Event.js';
import { newGuildMember } from '@modules/user/controller/user.controller.js';

export default new Event(Events.GuildMemberAdd, newGuildMember);
