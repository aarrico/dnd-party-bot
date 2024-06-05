import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command } from "../../structures/Command";
export default new Command({
  name: "ban",
  description: "bans a member from server!",
  // devOnly: Boolean,
  // testOnly: Boolean,
  cooldown: 0,
  // permissionsRequired: [PermissionFlagsBits.Administrator],
  // botPermissions: [PermissionFlagsBits.Administrator],
  callBack: ({ client, interaction }) => {
    interaction.followUp(`ban..`);
  },
});
