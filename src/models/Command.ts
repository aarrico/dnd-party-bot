import {
  AutocompleteInteraction,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  PermissionResolvable,
  SlashCommandBuilder,
} from 'discord.js';
import { ExtendedClient } from '../structures/ExtendedClient.js';

export interface ExtendedInteraction extends ChatInputCommandInteraction {
  member: GuildMember;
}

interface RunOptions {
  client: ExtendedClient;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
  userPermissions?: PermissionResolvable[];
  cooldown: number;
  callBack: RunFunction;
} & ChatInputApplicationCommandData;

// New interface that matches the actual command structure
export interface DiscordCommand {
  data: SlashCommandBuilder;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
  execute: (interaction: ExtendedInteraction) => Promise<void>;
}
