import {
  Client,
  ClientEvents,
  ClientOptions,
  Collection,
  GatewayIntentBits,
  REST,
  Routes,
} from 'discord.js';
import { Event } from './Event.js';
import { DiscordCommand } from '../models/Command.js';
import path from 'path';
import { getAllFiles, getAllFolders } from '../utils/getAllFiles.js';
import * as fs from 'node:fs';
import { URL } from 'node:url';
import { inspect } from 'node:util';
import { syncGuildsFromDiscord } from '../db/guild.js';

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
        GatewayIntentBits.MessageContent,
      ] as const,
    };
    super(options);
  }

  start = async () => {
    await this.loadCommands();
    await this.registerCommands();
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

  importFile = async (filePath: string) => (await import(filePath))?.default;

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

  registerCommands = async () => {
    if (this.commands.size === 0) {
      console.error('No commands to register!');
      return;
    }

    const rest = new REST().setToken(process.env.DISCORD_TOKEN as string);
    try {      
      const res: any = await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID as string,
          process.env.GUILD_ID as string
        ),
          { body: this.commandData }
      );

      console.log(`Successfully reloaded ${res.length} application (/) commands.`);
    } catch (error) {
      console.error('failed registering commands to guild:', inspect(error, { depth: null, colors: true }));
    }
  };
}
