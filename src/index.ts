import "dotenv/config";
import { ExtendedClient } from "./structures/ExtendedClient";

export const client = new ExtendedClient();

export let sessionStack = {
  sessions: [{}],
};

// client.on("ready", (c) => {
//   let sessionStack = {
//     sessions: [{}],
//   };

//   console.log(sessionStack);
// });

// eventHandler(client);

client.start();
