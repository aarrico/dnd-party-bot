import {
  ApplicationCommandDataResolvable,
  AutocompleteInteraction,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  PermissionResolvable,
  SlashCommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '@shared/discord/ExtendedClient.js';

/**
 * Extended interaction type that ensures a guild member is present
 */
export interface ExtendedInteraction extends ChatInputCommandInteraction {
  member: GuildMember;
}

/**
 * Options passed to a command's run function
 */
export interface RunOptions {
  client: ExtendedClient;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
}

/**
 * Function signature for command execution
 */
export type RunFunction = (options: RunOptions) => Promise<void> | void;

/**
 * Legacy command type structure
 */
export type CommandType = {
  userPermissions?: PermissionResolvable[];
  cooldown: number;
  callBack: RunFunction;
} & ChatInputApplicationCommandData;

/**
 * Modern Discord slash command structure
 */
export interface DiscordCommand {
  data: SlashCommandBuilder;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  execute: (interaction: ExtendedInteraction) => Promise<void>;
}

/**
 * Options for registering Discord commands
 */
export interface RegisterCommandOptions {
  guildid?: string;
  commands: ApplicationCommandDataResolvable[];
}
