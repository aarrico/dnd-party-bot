export default async function getApplicationCommands(
  client: any,
  guildId: any
) {
  let applicationCommands;
  if (guildId) {
    const guild = await client.guilds.fetch(guildId);
    applicationCommands = guild.commands;
  } else {
    applicationCommands = await client.application.commands;
  }

  await applicationCommands.fetch();
  return applicationCommands;
}
