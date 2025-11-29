import { SlashCommandBuilder } from 'discord.js';
import { ExtendedInteraction } from '#shared/types/discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('bans a member from server!'),
  async execute(interaction: ExtendedInteraction) {
    await interaction.followUp(`ban..`);
  },
};
