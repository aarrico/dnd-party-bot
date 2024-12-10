import "dotenv/config";
import { ExtendedClient } from "./structures/ExtendedClient";

export const client = new ExtendedClient();

client.login(process.env.TOKEN);
client.start();
