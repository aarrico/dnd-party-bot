import { Client } from "discord.js";
import * as path from "path";
import { getAllFiles, getAllFolders } from "../utils/getAllFiles";

export default function eventHandler(client: Client) {
  //get all folders in events folder
  const eventFolders = getAllFolders(path.join(__dirname, "..", "events"));

  for (const eventFolder of eventFolders) {
    //in each event folder, get all files within current folder
    const eventFiles = getAllFiles(eventFolder);

    //sort so numbered files run first.
    eventFiles.sort((a, b) => (a > b ? 1 : -1));

    //get event file name while removing rest of path
    const eventName = eventFolder.replace(/\\/g, "/").split("/").pop();

    //get event functions within each file while passing in client and argument
    client.on(eventName as string, async (arg) => {
      for (const eventFile of eventFiles) {
        const eventFunction = await import(eventFile);
        console.log(eventFunction);
        await eventFunction(client, arg);
      }
    });
  }
}
