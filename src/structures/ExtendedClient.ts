import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  Collection,
  IntentsBitField,
  REST,
  Routes,
} from "discord.js";
import { RegisterCommandOptions } from "../typings/client";
import { Event } from "./Event";
import { CommandType } from "../typings/Command";
import path from "path";
import { getAllFolders, getAllFiles } from "../utils/getAllFiles";

export class ExtendedClient extends Client {
  commands: Collection<string, CommandType> = new Collection();
  events: Collection<string, Event<keyof ClientEvents>> = new Collection();

  constructor() {
    super({
      intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
      ],
    });
  }

  async start() {
    this.login(process.env.TOKEN);
    await this.registerModules();
  }

  async importFile(filePath: string) {
    return (await import(filePath))?.default.default;
  }

  //registers commands and events
  async registerModules() {
    const commandFolders: string[] = await getAllFolders(
      path.join(__dirname, "..", "commands")
    );

    await this.getCommands(commandFolders);

    const eventFolders: string[] = await getAllFolders(
      path.join(__dirname, "..", "events")
    );

    await this.getEvents(eventFolders);
  }

  async getCommands(commandFolders: string[]) {
    const slashCommands: ApplicationCommandDataResolvable[] = [];

    let commandFilesArray: string[] = [];
    commandFolders?.forEach((folderPath) => {
      const commandFiles: string[] = getAllFiles(folderPath);
      commandFilesArray = [...commandFilesArray, ...commandFiles];
    });

    const commandsArray = await this.getCommandsFromFiles(commandFilesArray);

    commandsArray.forEach((command) => {
      if (!command || !command.name) return;
      this.commands.set(command.name, command);
      slashCommands.push(command);
    });

    this.registerCommands({
      commands: slashCommands,
      guildid: process.env.GUILD_ID,
    });
  }

  async getCommandsFromFiles(commandFiles: string[]) {
    let array: CommandType[] = [];

    for (let commandFile of commandFiles) {
      const commandPromise = await this.getCommandFromFile(commandFile);
      array.push(commandPromise);
    }

    return array;
  }

  getCommandFromFile(filePath: string) {
    return this.importFile(filePath) as Promise<CommandType>;
  }

  async registerCommands(options: RegisterCommandOptions) {
    if (options?.guildid) {
      // const guild = await this.guilds?.fetch(options.guildid);
      // const commands = guild.commands.set(options.commands);

      // Construct and prepare an instance of the REST module
      const rest = new REST().setToken(process.env.TOKEN as string);
      try {
        await rest.put(
          Routes.applicationGuildCommands(
            process.env.CLIENT_ID as string,
            process.env.GUILD_ID as string
          ),
          { body: options?.commands }
        );
      } catch (error) {
        console.error(error);
      }

      // await guild?.commands?.set(options?.commands);
      // this.guilds.cache.get(options.guildid)?.commands?.set(options.commands);
    } else {
      this.application?.commands?.set(options?.commands);
    }
  }

  async getEvents(eventFolders: string[]) {
    let eventFilesArray: string[] = [];

    eventFolders?.forEach((folderPath) => {
      const eventFiles: string[] = getAllFiles(folderPath);
      eventFilesArray = [...eventFilesArray, ...eventFiles];
    });

    const eventsArray = await this.getEventsFromFiles(eventFilesArray);

    eventsArray.forEach((event) => {
      // this.events.set(event.name, event);
      this.on(event.name, event.execute);
    });
  }

  async getEventsFromFiles(eventFiles: string[]) {
    let array: Event<keyof ClientEvents>[] = [];

    for (let eventFile of eventFiles) {
      const eventPromise = await this.getEventFromFile(eventFile);
      array.push(eventPromise);
    }

    return array;
  }

  getEventFromFile(filePath: string) {
    return this.importFile(filePath) as Promise<Event<keyof ClientEvents>>;
  }
}
