require('dotenv').config();
const {REST, Routes, ApplicationCommandOptionType} = require('discord.js');

const commands = [
    {
        name: 'hey',
        description: 'Replies with hey!'
    },
    {
        name: 'ping',
        description: 'Replies with pong!'
    },
    {
        name: 'add',
        description: 'adds two numbers!',
        options: [
            {
                name: 'first-number',
                description: 'The first number',
                type: ApplicationCommandOptionType.Number,
                choices: [
                    {
                        name: 'one',
                        value: 1
                    },
                    {
                        name: 'two',
                        value: 2
                    },
                    {
                        name: 'three',
                        value: 3
                    }
                ],
                required: true
            },
            {
                name: 'second-number',
                description: 'The second number',
                type: ApplicationCommandOptionType.Number,
                required: true
            }
        ]
    },
    {
        name: 'embed',
        description: 'creates an embed'
    }
];

const rest = new REST({version: '10'}).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID, 
                process.env.GUILD_ID), 
                { body: commands});
        console.log('Slash commands registered successfully...');
    } catch (error) {
        console.log(`there was an error: ${error}`);
    }
})();