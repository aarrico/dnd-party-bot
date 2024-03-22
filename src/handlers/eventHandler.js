const path = require('path');
const getAllFiles = require("../utils/getAllFiles");

module.exports = (client) => {
    //get all folders in events folder
    const eventFolders = getAllFiles(path.join(__dirname, '..', 'events'), true);

    for(const eventFolder of eventFolders)
    {
        //in each event folder, get all files within current folder
        const eventFiles = getAllFiles(eventFolder);

        //sort so numbered files run first.
        eventFiles.sort((a,b) => a > b);

        //get event file name while removing rest of path
        const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();

        //get event functions within each file while passing in client and argument
        client.on(eventName, async (arg) => {
            for(const eventFile of eventFiles)
            {
                const eventFunction = require(eventFile);
                await eventFunction(client, arg);
            }
        })
    }
};