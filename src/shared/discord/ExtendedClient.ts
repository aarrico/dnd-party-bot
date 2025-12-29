import {
  Client,
  ClientEvents,
  ClientOptions,
  Collection,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  Events,
  SlashCommandBuilder,
} from 'discord.js';
import { Event } from './Event.js';
import { DiscordCommand } from '#shared/types/discord.js';
import path from 'path';
import { getAllFiles, getAllFolders } from '#shared/files/getAllFiles.js';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { inspect } from 'node:util';
import { createScopedLogger } from '#shared/logging/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const findProjectRoot = (startPath: string): string => {
  let currentPath = startPath;
  while (currentPath !== path.parse(currentPath).root) {
    if (fs.existsSync(path.join(currentPath, 'package.json'))) {
      return currentPath;
    }
    currentPath = path.dirname(currentPath);
  }
  throw new Error('Could not find project root (package.json not found)');
};

const PROJECT_ROOT = findProjectRoot(__dirname);

// Detect if running from dist or src
const isCompiledCode = __dirname.includes('/dist/');
const SRC_DIR = isCompiledCode
  ? path.join(PROJECT_ROOT, 'dist', 'src')
  : path.join(PROJECT_ROOT, 'src');

export class ExtendedClient extends Client {
  commands: Collection<string, DiscordCommand> = new Collection();
  commandData: ReturnType<SlashCommandBuilder['toJSON']>[] = [];
  private readonly logger = createScopedLogger('DiscordClient');

  constructor() {
    const options: ClientOptions = {
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ] as const,
      partials: [
        Partials.Channel, // Required for DM channels
      ],
    };
    super(options);

    this.setupErrorHandlers();
  }

  /**
   * Set up error handlers for the Discord client
   */
  private setupErrorHandlers(): void {
    // Handle WebSocket errors
    this.on(Events.Error, (error) => {
      this.logger.error('Discord client error', { error });
    });

    // Handle WebSocket warnings
    this.on(Events.Warn, (warning) => {
      this.logger.warn('Discord client warning', { warning });
    });

    // Handle rate limit events
    this.on(Events.Debug, (info) => {
      // Only log rate limit related debug info
      if (info.includes('429') || info.toLowerCase().includes('rate limit')) {
        this.logger.warn('Rate limit debug', { info });
      }
    });

    // Handle disconnect events
    this.on(Events.ShardDisconnect, (event, shardId) => {
      this.logger.warn('Shard disconnected', {
        shardId,
        code: event.code,
        reason: event.reason,
      });
    });

    // Handle reconnect events
    this.on(Events.ShardReconnecting, (shardId) => {
      this.logger.info('Shard reconnecting', { shardId });
    });

    // Handle resume events
    this.on(Events.ShardResume, (shardId, replayedEvents) => {
      this.logger.info('Shard resumed', { shardId, replayedEvents });
    });

    // Handle shard ready events
    this.on(Events.ShardReady, (shardId) => {
      this.logger.info('Shard ready', { shardId });
    });

    // Handle process-level errors
    process.on('unhandledRejection', (error: Error) => {
      this.logger.error('Unhandled promise rejection', { error });

      // Check if it's a socket error
      if (error.message && error.message.includes('other side closed')) {
        this.logger.warn('Socket closed error detected - Discord.js will automatically retry');
      }
    });

    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught exception', { error });

      // For critical errors, we might want to restart
      // but for socket errors, just log and continue
      if (error.message && error.message.includes('other side closed')) {
        this.logger.warn('Socket closed exception detected - continuing operation');
      } else {
        this.logger.error('Critical error - consider restarting the application');
        // Optionally exit and let process manager restart
        // process.exit(1);
      }
    });
  }

  start = async () => {
    await this.loadCommands();

    // Register commands globally or to specific guild
    if (process.env.GUILD_ID) {
      // Development mode: register to specific guild for instant updates
      this.logger.info('GUILD_ID found - registering commands to specific guild for development');
      await this.registerCommandsToGuild(process.env.GUILD_ID);
    } else {
      // Production mode: register globally (takes up to 1 hour to propagate)
      await this.registerCommands();
    }

    await this.getEvents(getAllFolders(path.join(SRC_DIR, 'events')));

    this.logger.info('Bot startup complete', {
      guildCount: this.guilds.cache.size,
      userCount: this.users.cache.size,
    });
  };

  importFile = async <T = unknown>(filePath: string): Promise<T> => {
    const module = await import(filePath) as { default?: T };
    return module?.default as T;
  };

  loadCommands = async () => {
    const foldersPath = path.join(SRC_DIR, 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await this.importFile<DiscordCommand>(filePath);
        if ('data' in command && 'execute' in command) {
          this.commands.set(command.data.name, command);
          this.commandData.push(command.data.toJSON());
        } else {
          this.logger.warn('Command missing required properties', { filePath });
        }
      }
    }
  };

  getEvents = async (eventFolders: string[]) => {
    const eventFiles = eventFolders.flatMap((folderPath) =>
      getAllFiles(folderPath)
    );
    const events =
      await this.getItemsFromFiles<Event<keyof ClientEvents>>(eventFiles);

    this.logger.info('Events discovered', { count: events.length });

    events.forEach((event) => {
      this.on(event.name, (...args) => {
        void event.execute(...args);
      });
    });
  };

  getItemsFromFiles = async <T>(files: string[]): Promise<T[]> => {
    try {
      const promises = files.map(
        async (file) => (await this.importFile(file)) as T
      );
      return Promise.all(promises);
    } catch (error) {
      this.logger.error('Error loading modules from files', {
        error: inspect(error, { depth: null, colors: true }),
      });
      process.exit(1);
    }
  };

  /**
   * Register commands globally (takes up to 1 hour to propagate)
   */
  registerCommands = async () => {
    if (this.commands.size === 0) {
      this.logger.error('No commands to register!');
      return;
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
    try {
      this.logger.info('Registering commands globally...');
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID as string),
        { body: this.commandData }
      );

      this.logger.info('Successfully registered commands globally', {
        count: this.commandData.length,
      });
    } catch (error) {
      this.logger.error('Failed registering commands globally', {
        error: inspect(error, { depth: null, colors: true }),
      });
    }
  };

  /**
   * Register commands to a specific guild (instant, useful for testing or new guild joins)
   */
  registerCommandsToGuild = async (guildId: string) => {
    if (this.commands.size === 0) {
      this.logger.error('No commands to register!');
      return;
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
    try {
      this.logger.info('Registering commands to guild', { guildId });
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID as string,
          guildId
        ),
        { body: this.commandData }
      );

      this.logger.info('Successfully registered commands to guild', {
        guildId,
        count: this.commandData.length,
      });
    } catch (error) {
      this.logger.error('Failed registering commands to guild', {
        guildId,
        error: inspect(error, { depth: null, colors: true }),
      });
    }
  };
}
