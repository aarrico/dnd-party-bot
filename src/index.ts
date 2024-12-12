import "dotenv/config";
import 'source-map-support/register.js';
import { ExtendedClient } from "./structures/ExtendedClient";

export const client = new ExtendedClient();

client.login(process.env.TOKEN);
client.start();
