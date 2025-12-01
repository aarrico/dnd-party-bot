import { SlashCommandBuilder, AutocompleteInteraction, ChannelType } from 'discord.js';
import { monthOptionChoicesArray } from '#shared/constants/dateConstants.js';
import { BotCommandOptionInfo, BotDialogs } from '#shared/messages/botDialogStrings.js';
import { ExtendedInteraction } from '#shared/types/discord.js';
import { modifySession } from '#modules/session/controller/session.controller.js';
import { handleTimezoneAutocomplete } from '#shared/datetime/timezoneUtils.js';
import { getUserTimezone } from '#modules/user/repository/user.repository.js';
import { sendEphemeralReply } from '#shared/discord/messages.js';
import { getSessionById } from '#modules/session/repository/session.repository.js';

export default {
  data: new SlashCommandBuilder()
    .setName('modify-session')
    .setDescription(
      'Makes changes to an existing session. Also updates photos to reflect changes.'
    )
    .addStringOption((channel) =>
      channel
        .setName(BotCommandOptionInfo.ModifySession_ChannelName)
        .setDescription(BotCommandOptionInfo.ModifySession_ChannelDescription)
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((name) =>
      name
        .setName(BotCommandOptionInfo.Session_Name)
        .setDescription(
          BotCommandOptionInfo.Session_Name_Description
        )
        .setRequired(true)
    )
    .addIntegerOption((month) =>
      month
        .setName(BotCommandOptionInfo.Session_Month_Name)
        .setDescription(BotCommandOptionInfo.Session_Month_Description)
        .setChoices(monthOptionChoicesArray)
        .setRequired(true)
    )
    .addIntegerOption((day) =>
      day
        .setName(BotCommandOptionInfo.Session_Day_Name)
        .setDescription(BotCommandOptionInfo.Session_Day_Description)
        .setRequired(true)
    )
    .addIntegerOption((year) =>
      year
        .setName(BotCommandOptionInfo.Session_Year_Name)
        .setDescription(BotCommandOptionInfo.Session_Year_Description)
        .setRequired(true)
    )
    .addStringOption((time) =>
      time
        .setName(BotCommandOptionInfo.Session_Time_Name)
        .setDescription(BotCommandOptionInfo.Session_Time_Description)
        .setRequired(false)
    )
    .addStringOption((timezone) =>
      timezone
        .setName(BotCommandOptionInfo.CreateSession_TimezoneName)
        .setDescription(BotCommandOptionInfo.CreateSession_TimezoneDescription)
        .setRequired(false)
        .setAutocomplete(true)
    ),
  async autocomplete(interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === String(BotCommandOptionInfo.ModifySession_ChannelName)) {
      if (!interaction.guild) return;

      const channels = await interaction.guild.channels.fetch();
      const topLevelTextChannels = channels
        .filter(channel =>
          channel?.type === ChannelType.GuildText &&
          channel.parentId === null
        )
        .map(channel => ({
          name: channel!.name,
          value: channel!.id
        }))
        .slice(0, 25); // Discord limits to 25 choices

      await interaction.respond(topLevelTextChannels);
    } else if (focusedOption.name === String(BotCommandOptionInfo.CreateSession_TimezoneName)) {
      const userTimezone = await getUserTimezone(interaction.user.id);
      await handleTimezoneAutocomplete(interaction, userTimezone);
    }
  },
  async execute(interaction: ExtendedInteraction) {
    const campaign = interaction.guild;
    if (!campaign) {
      throw new Error('Command must be run in a server!');
    }

    const channelId = interaction.options.getString(
      BotCommandOptionInfo.ModifySession_ChannelName,
      true
    );

    const fullChannel = await campaign.channels.fetch(channelId);
    if (!fullChannel || fullChannel.type !== ChannelType.GuildText) {
      await sendEphemeralReply(
        BotDialogs.continueSessionInvalidChannel,
        interaction
      );
      return;
    }

    if (fullChannel.parentId !== null) {
      await sendEphemeralReply(
        BotDialogs.continueSessionChannelNotSession,
        interaction
      );
      return;
    }

    try {
      await getSessionById(fullChannel.id, true);
    } catch {
      await sendEphemeralReply(
        BotDialogs.continueSessionNotFound,
        interaction
      );
      return;
    }

    await modifySession(interaction);
  },
};
