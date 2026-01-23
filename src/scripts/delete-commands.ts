import { REST, Routes } from 'discord.js';
import 'dotenv/config';
const clientId = process.env.DISCORD_CLIENT_ID as string;
// const guildId = process.env.DISCORD_GUILD_ID as string;
const token = process.env.DISCORD_TOKEN as string;
const rest = new REST().setToken(token);

const guilds = ['373299347531497478', '1433807974748389469', '1314333174007992503'];
//for guild-based commands
for (const guildId of guilds) {
rest
  .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
  .then(() => console.log('Successfully deleted all guild commands.'))
  .catch(console.error);
}

// for global commands
rest
  .put(Routes.applicationCommands(clientId), { body: [] })
  .then(() => console.log('Successfully deleted all application commands.'))
  .catch(console.error);