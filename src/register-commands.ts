import { ApplicationCommandOptionType, REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'hey',
    description: 'Replies with hey!',
  },
  {
    name: 'ping',
    description: 'Replies with pong!',
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
            value: 1,
          },
          {
            name: 'two',
            value: 2,
          },
          {
            name: 'three',
            value: 3,
          },
        ],
        required: true,
      },
      {
        name: 'second-number',
        description: 'The second number',
        type: ApplicationCommandOptionType.Number,
        required: true,
      },
    ],
  },
  {
    name: 'embed',
    description: 'creates an embed',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN as string);

(async () => {
  try {
    if (process.env.GUILD_ID) {
      // Register to specific guild (instant, for development)
      console.log(`Registering slash commands to guild ${process.env.GUILD_ID}...`);
      await rest.put(
        Routes.applicationGuildCommands(
          process.env.DISCORD_CLIENT_ID as string,
          process.env.GUILD_ID as string
        ),
        { body: commands }
      );
      console.log('Slash commands registered to guild successfully!');
    } else {
      // Register globally (takes up to 1 hour to propagate)
      console.log('Registering slash commands globally...');
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_CLIENT_ID as string),
        { body: commands }
      );
      console.log('Slash commands registered globally successfully! (May take up to 1 hour to appear)');
    }
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
})();
