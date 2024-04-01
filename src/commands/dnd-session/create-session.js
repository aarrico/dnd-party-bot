require('dotenv').config();
const {ApplicationCommandOptionType} = require('discord.js');
const getDate = require('../../utils/dateChecker');
const createMessageBody = require('../../utils/create-session-message');

module.exports = {
    name: 'create-session',
    description: 'creates a session in the session stack.',
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: 'month',
            description: 'month of session',
            type: ApplicationCommandOptionType.Number,
            choices: [
                {
                    name: 'January',
                    value: 1
                },
                {
                    name: 'February',
                    value: 2
                },
                {
                    name: 'March',
                    value: 3
                },
                {
                    name: 'April',
                    value: 4
                },
                {
                    name: 'May',
                    value: 5
                },
                {
                    name: 'June',
                    value: 6
                },
                {
                    name: 'July',
                    value: 7
                },
                {
                    name: 'August',
                    value: 8
                },
                {
                    name: 'September',
                    value: 9
                },
                {
                    name: 'October',
                    value: 10
                },
                {
                    name: 'November',
                    value: 11
                },
                {
                    name: 'December',
                    value: 12
                }
            ],
            required: true
        },
        {
            name: 'day',
            description: 'Day of session',
            type: ApplicationCommandOptionType.Number,
            required: true
        },
        {
            name: 'year',
            description: 'year of session',
            type: ApplicationCommandOptionType.Number,
            required: true
        }
    ],
    //deleted: Boolean,
    callBack: (client, interaction) => {
        const date = getDate(interaction);
        if(date)
        {
            const message = `Hey there, I have your session scheduled for: ${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}`;

            //send to general
            const channel = client.channels.cache.get(process.env.SESSION_CHANNEL_ID);
            // channel.send(message);
            createMessageBody(client, process.env.SESSION_CHANNEL_ID);

            //send to DMs
            const user = client.users.cache.get(interaction.user.id);
            user.send(message);
            interaction.reply('One Moment while I create your session. You will recieve a message via Direct Message when complete!');
        }
        else
        {
            interaction.reply('The date you entered is invalid. This could be due to the following reasons:\n- You entered a date that doesnt exist.\n- You entered a day that has already passed.');
        }
    }
};