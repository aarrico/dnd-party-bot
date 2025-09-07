import { SlashCommandBuilder } from 'discord.js';
import {
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
} from '../../utils/botDialogStrings.js';
import { monthOptionChoicesArray } from '../../utils/genericInformation.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { initSession } from '../../controllers/session.js';
import DateChecker from '../../utils/dateChecker';
import { sendEphemeralReply } from '../../discord/message';
import { client } from '../../index';
import { getAllCampaigns } from '../../db/campaign.js';
import { inspect } from 'util';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandInfo.CreateSessionName)
    .setDescription(BotCommandInfo.CreateSessionDescription)
    .addStringOption((campaignOption) =>
      campaignOption
        .setName('campaign-option')
        .setDescription('Choose to use active campaign, create new campaign, or select existing campaign')
        .setRequired(true)
        .addChoices(
          { name: 'Use Active Campaign', value: 'active' },
          { name: 'Create New Campaign', value: 'new' },
          { name: 'Select Existing Campaign', value: 'existing' }
        )
    )

    .addStringOption((name) =>
      name
        .setName(BotCommandOptionInfo.CreateSession_SessionName)
        .setDescription(
          BotCommandOptionInfo.CreateSession_SessionName_Description
        )
        .setRequired(true)
    )
    .addIntegerOption((month) =>
      month
        .setName(BotCommandOptionInfo.CreateSession_MonthName)
        .setDescription(BotCommandOptionInfo.CreateSession_MonthDescription)
        .setChoices(monthOptionChoicesArray)
        .setRequired(true)
    )
    .addIntegerOption((day) =>
      day
        .setName(BotCommandOptionInfo.CreateSession_DayName)
        .setDescription(BotCommandOptionInfo.CreateSession_DayDescription)
        .setRequired(true)
    )
    .addIntegerOption((year) =>
      year
        .setName(BotCommandOptionInfo.CreateSession_YearName)
        .setDescription(BotCommandOptionInfo.CreateSession_YearDescription)
        .setRequired(true)
    )
    .addStringOption((time) =>
      time
        .setName(BotCommandOptionInfo.CreateSession_TimeName)
        .setDescription(BotCommandOptionInfo.CreateSession_TimeDescription)
        .setRequired(true)
  )
  .addStringOption((newCampaignName) =>
    newCampaignName
      .setName('new-campaign-name')
      .setDescription('Name for the new campaign (required if creating new campaign)')
      .setRequired(false)
  )
    .addStringOption((existingCampaignId) =>
      existingCampaignId
        .setName('existing-campaign-id')
        .setDescription('ID of existing campaign (required if selecting existing campaign)')
        .setRequired(false)
    ),
  async execute(interaction: ExtendedInteraction) {
    try {
      const guild = interaction.guild;
      if (!guild) {
        throw new Error('Command must be run in a server!');
      }

      const campaignOption = interaction.options.getString('campaign-option', true);
      const newCampaignName = interaction.options.getString('new-campaign-name');
      const existingCampaignId = interaction.options.getString('existing-campaign-id');
      const sessionName = interaction.options.getString(BotCommandOptionInfo.CreateSession_SessionName, true);

      if (!sessionName) {
        await sendEphemeralReply(BotDialogs.createSessionInvalidSessionName, interaction);
        return;
      }

      // Validate campaign options
      if (campaignOption === 'new' && !newCampaignName) {
        await sendEphemeralReply(
          'You must provide a campaign name when creating a new campaign.',
          interaction
        );
        return;
      }

      if (campaignOption === 'existing' && !existingCampaignId) {
        await sendEphemeralReply(
          'You must provide a campaign ID when selecting an existing campaign.',
          interaction
        );
        return;
      }

      const date = DateChecker(interaction);
      if (!date) {
        await sendEphemeralReply(
          BotDialogs.createSessionInvalidDateEntered,
          interaction
        );
        return;
      }

      await sendEphemeralReply(BotDialogs.createSessionOneMoment, interaction);

      // Determine which campaign to use
      let finalCampaignOption = campaignOption;
      if (campaignOption === 'existing' && existingCampaignId) {
        finalCampaignOption = existingCampaignId;
      }

      const message = await initSession(
        guild.id,
        sessionName,
        date,
        interaction.user.displayName,
        interaction.user.id,
        finalCampaignOption,
        newCampaignName || undefined
      );

      const user = client.users.cache.get(interaction.user.id);
      await user?.send(message);
    } catch (error) {
      await sendEphemeralReply('There was an error', interaction);
      console.error(`Error creating session:`, inspect(error, { depth: null, colors: true }))
    }
  },
};
