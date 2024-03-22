module.exports = {
    name: 'hey',
    description: 'Responds with hello!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    // options: [],
    //deleted: Boolean,
    callBack: (client, interaction) => {
        interaction.reply(`Hello ${interaction.user.username}`);
    }
};