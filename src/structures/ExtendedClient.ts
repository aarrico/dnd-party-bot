import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  Collection,
  IntentsBitField,
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
    await this.registerModules();
    this.login(process.env.TOKEN);
    // this.events.forEach((event) => {
    //   this.on(event.name, event.execute());
    // });
  }

  async importFile(filePath: string) {
    return (await import(filePath))?.default.default;
  }

  async registerCommands(options: RegisterCommandOptions) {
    if (options.guildid) {
      this.guilds.cache.get(options.guildid)?.commands.set(options.commands);
      console.log(`Resgistering commands to Guild: ${options.guildid}.`);
    } else {
      this.application?.commands?.set(options?.commands);
    }
  }

  //registers commands and events
  async registerModules() {
    const commandFolders: string[] = await getAllFolders(
      path.join(__dirname, "..", "commands")
    );

    // console.log(path.join(__dirname, "..", "commands"));

    // commandFolders.forEach(async (folderPath) => {
    //   const commandFiles: string[] = await getAllFiles(folderPath);

    //   commandFiles.forEach(async (filePath) => {
    //     const command: CommandType = await this.importFile(`${filePath}`);
    //     if (!command.name) return;
    //     this.commands.set(command.name, command);
    //     slashCommands.push(command);
    //   });
    // });

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

    this.registerCommands({ commands: slashCommands });
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
