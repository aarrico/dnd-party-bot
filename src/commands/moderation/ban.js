const {ApplicationCommandOptionType, PermissionFlagsBits} = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'bans a member from server!',
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [{
        name: 'target-user',
        description: 'the user to ban',
        required: true,
        type: ApplicationCommandOptionType.Mentionable
    },
    {
        name: 'reason',
        description: 'the reason for banning',
        type: ApplicationCommandOptionType.String
    }],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],
    callBack: (client, interaction) => {
        interaction.reply(`ban..`);
    }
};