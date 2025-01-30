import { ApplicationCommandDataResolvable } from 'discord.js';

export interface RegisterCommandOptions {
  guildid?: string;
  commands: ApplicationCommandDataResolvable[];
}
