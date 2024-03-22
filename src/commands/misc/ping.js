module.exports = {
    name: 'ping',
    description: 'Pong!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // options: [],
    //deleted: Boolean,
    callBack: (client, interaction) => {
        interaction.reply(`Pong! ${client.ws.ping}ms`);
    }
};