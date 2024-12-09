import "dotenv/config";
import { ExtendedClient } from "./structures/ExtendedClient";
import {Client, Collection, Events, GatewayIntentBits} from "discord.js";

export const client = new ExtendedClient();

client.once(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user?.tag}`);
});

client.login(process.env.TOKEN);

client.start();
