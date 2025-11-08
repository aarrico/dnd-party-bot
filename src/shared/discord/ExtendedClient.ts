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
} from 'discord.js';
import { Event } from './Event.js';
import { DiscordCommand } from '@shared/types/discord.js';
import path from 'path';
import { getAllFiles, getAllFolders } from '@shared/files/getAllFiles.js';
import * as fs from 'node:fs';
import { URL } from 'node:url';
import { inspect } from 'node:util';
import { syncGuildsFromDiscord } from '@modules/guild/repository/guild.repository.js';

const __dirname = new URL('../events', import.meta.url).pathname;

export class ExtendedClient extends Client {
  commands: Collection<string, DiscordCommand> = new Collection();
  commandData: any = [];

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

    // Set up error handlers for better resilience
    this.setupErrorHandlers();
  }

  /**
   * Set up error handlers for the Discord client
   */
  private setupErrorHandlers(): void {
    // Handle WebSocket errors
    this.on(Events.Error, (error) => {
      console.error('Discord client error:', error);
    });

    // Handle WebSocket warnings
    this.on(Events.Warn, (warning) => {
      console.warn('Discord client warning:', warning);
    });

    // Handle rate limit events
    this.on(Events.Debug, (info) => {
      // Only log rate limit related debug info
      if (info.includes('429') || info.toLowerCase().includes('rate limit')) {
        console.warn('Rate limit debug:', info);
      }
    });

    // Handle disconnect events
    this.on(Events.ShardDisconnect, (event, shardId) => {
      console.warn(`Shard ${shardId} disconnected (code: ${event.code}, reason: ${event.reason})`);
    });

    // Handle reconnect events
    this.on(Events.ShardReconnecting, (shardId) => {
      console.log(`Shard ${shardId} is reconnecting...`);
    });

    // Handle resume events
    this.on(Events.ShardResume, (shardId, replayedEvents) => {
      console.log(`Shard ${shardId} resumed successfully (replayed ${replayedEvents} events)`);
    });

    // Handle shard ready events
    this.on(Events.ShardReady, (shardId) => {
      console.log(`Shard ${shardId} is ready`);
    });

    // Handle process-level errors
    process.on('unhandledRejection', (error: Error) => {
      console.error('Unhandled promise rejection:', error);

      // Check if it's a socket error
      if (error.message && error.message.includes('other side closed')) {
        console.warn('Socket closed error detected - Discord.js will automatically retry');
      }
    });

    process.on('uncaughtException', (error: Error) => {
      console.error('Uncaught exception:', error);

      // For critical errors, we might want to restart
      // but for socket errors, just log and continue
      if (error.message && error.message.includes('other side closed')) {
        console.warn('Socket closed exception detected - continuing operation');
      } else {
        console.error('Critical error - consider restarting the application');
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
      console.log('GUILD_ID found - registering commands to specific guild for development');
      await this.registerCommandsToGuild(process.env.GUILD_ID);
    } else {
      // Production mode: register globally (takes up to 1 hour to propagate)
      await this.registerCommands();
    }

    await this.getEvents(getAllFolders(path.join(__dirname, '..', 'events')));

    try {
      console.log('Syncing guilds from Discord...');
      const discordGuilds = await this.guilds.fetch();
      const campaigns = discordGuilds.map(guild => ({
        id: guild.id,
        name: guild.name
      }));

      await syncGuildsFromDiscord(campaigns);
      console.log(`Successfully synced ${campaigns.length} guild(s) to database`);
    } catch (error) {
      console.error('Failed to sync guilds from Discord:', error);
    }
  };

  importFile = async <T = any>(filePath: string): Promise<T> => {
    const module = await import(filePath);
    return module?.default as T;
  };

  loadCommands = async () => {
    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
      const commandsPath = path.join(foldersPath, folder);
      const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await this.importFile(filePath);
        if ('data' in command && 'execute' in command) {
          this.commands.set(command.data.name, command);
          this.commandData.push(command.data.toJSON());
        } else {
          console.log(
            `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
          );
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

    console.log(`${events.length} events found`);

    events.forEach((event) => {
      this.on(event.name, event.execute);
    });
  };

  getItemsFromFiles = async <T>(files: string[]): Promise<T[]> => {
    try {
      const promises = files.map(
        async (file) => (await this.importFile(file)) as T
      );
      return Promise.all(promises);
    } catch (error) {
      console.error(`Error loading modules from files:`, inspect(error, { depth: null, colors: true }));
      process.exit(1);
    }
  };

  /**
   * Register commands globally (takes up to 1 hour to propagate)
   */
  registerCommands = async () => {
    if (this.commands.size === 0) {
      console.error('No commands to register!');
      return;
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
    try {
      console.log('Registering commands globally...');
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID as string),
        { body: this.commandData }
      );

      console.log(`Successfully registered ${this.commandData.length} application (/) commands globally.`);
    } catch (error) {
      console.error('Failed registering commands globally:', inspect(error, { depth: null, colors: true }));
    }
  };

  /**
   * Register commands to a specific guild (instant, useful for testing or new guild joins)
   */
  registerCommandsToGuild = async (guildId: string) => {
    if (this.commands.size === 0) {
      console.error('No commands to register!');
      return;
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
    try {
      console.log(`Registering commands to guild ${guildId}...`);
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID as string,
          guildId
        ),
        { body: this.commandData }
      );

      console.log(`Successfully registered ${this.commandData.length} commands to guild ${guildId}.`);
    } catch (error) {
      console.error(`Failed registering commands to guild ${guildId}:`, inspect(error, { depth: null, colors: true }));
    }
  };
}
