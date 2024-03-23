require('dotenv').config();
const {ApplicationCommandOptionType} = require('discord.js');

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
        
        let month = interaction.options.get('month').value;
        let day = interaction.options.get('day').value;
        let year = interaction.options.get('year').value;
        if(month && day && year)
        {
            const monthMaxDayCounts = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

            if(month <= 12 && monthMaxDayCounts[month-1] < day)
            {
                if(month === 2 && (year % 4 === 0))
                {
                    if(day > 29)
                    {
                        interaction.reply('The date you entered is invalid.');
                        return;
                    }
                }
                else
                {
                    interaction.reply('The date you entered is invalid.');
                    return;
                }
            }
            

            const date = new Date(year, month, day);

            if(new Date(date).valueOf() < new Date().valueOf())
            {
                interaction.reply('The date you entered must be after todays date.');
                return;
            }

            interaction.reply(`${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`);
            return;
        }
        interaction.reply('The date you entered is invalid.');
    }
};