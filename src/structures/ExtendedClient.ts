import {
    Client,
    ClientEvents,
    Collection,
    IntentsBitField,
    REST,
    Routes,
} from "discord.js";
import {Event} from "./Event";
import {CommandType} from "../typings/Command";
import path from "path";
import {getAllFolders, getAllFiles} from "../utils/getAllFiles";

export class ExtendedClient extends Client {
    commands: Collection<string, CommandType> = new Collection();

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

    start = async () => {
        await this.getCommands(getAllFolders(path.join(__dirname, "..", "commands")));
        await this.registerCommands();
        await this.getEvents(getAllFolders(path.join(__dirname, "..", "events")));
    };

    importFile = async (filePath: string) => (await import(filePath))?.default.default;

    getCommands = async (commandFolders: string[]) => {
        const files = commandFolders.flatMap((folderPath) => getAllFiles(folderPath));
        const commands = await this.getItemsFromFiles<CommandType>(files);
        console.log(`${commands.length} commands found`);

        commands.forEach((command) => {
            if (command && command.name) {
                this.commands.set(command.name, command);
            }
        });
    };

    getEvents = async (eventFolders: string[]) => {
        const eventFiles = eventFolders.flatMap((folderPath) => getAllFiles(folderPath));
        const events = await this.getItemsFromFiles<Event<keyof ClientEvents>>(eventFiles);

        console.log(`${events.length} events found`);

        events.forEach((event) => {
            this.on(event.name, event.execute);
        });
    }

    getItemsFromFiles = async <T>(files: string[]): Promise<T[]> => {
        try {
            const promises = files.map(async (file) => await this.importFile(file) as T);
            return Promise.all(promises);
        } catch (error) {
            console.error(`Error loading modules from files:`, error);
            process.exit(1);
        }
    }

    registerCommands = async () => {
        if (this.commands.size === 0) {
            console.error('No commands to register!');
            return;
        }

        const rest = new REST().setToken(process.env.TOKEN as string);
        try {
            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.CLIENT_ID as string,
                    process.env.GUILD_ID as string
                ),
                {body: this.commands.toJSON()}
            );
        } catch (error) {
            console.error('failed registering commands to guild:', error);
        }
    };
}
