import { Events, GuildMember } from 'discord.js';
import { Event } from '#shared/discord/Event.js';
import { newGuildMember } from '#modules/user/controller/user.controller.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('GuildMemberAddEvent');

export default new Event(Events.GuildMemberAdd, async (member: GuildMember) => {
  try {
    await newGuildMember(member);
  } catch (error) {
    logger.error('Failed to process new guild member', {
      userId: member.user.id,
      username: member.user.username,
      guildId: member.guild.id,
      error,
    });
  }
});
