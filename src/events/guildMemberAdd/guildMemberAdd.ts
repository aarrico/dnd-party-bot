import { Events, GuildMember, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } from 'discord.js';
import { Event } from '../../structures/Event.js';
import { AMERICAN_TIMEZONES } from '../../utils/timezoneUtils.js';
import { BotDialogs } from '../../utils/botDialogStrings.js';
import { upsertUser } from '../../db/user.js';

const ONBOARDING_SELECT_MENU_ID = 'onboarding-timezone-select';

export default new Event(Events.GuildMemberAdd, async (member: GuildMember) => {
   if (member.user.bot) {
    return;
  }

  try {
    console.log(`New member joined: ${member.user.displayName} (${member.user.id})`);

    const dmChannel = await member.user.createDM();
    await upsertUser(member.user.id, member.user.username, dmChannel.id);
    console.log(`Added user ${member.user.username} to database`);

    //Create timezone selection menu
    const timezoneSelect = new StringSelectMenuBuilder()
      .setCustomId(ONBOARDING_SELECT_MENU_ID)
      .setPlaceholder('Select your timezone')
      .addOptions(
        AMERICAN_TIMEZONES.map((tz) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(tz.name)
            .setDescription(`${tz.value}`)
            .setValue(tz.value)
        )
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(timezoneSelect);

    // Send welcome DM
    await member.send({
      content: BotDialogs.onboarding.welcome(member.user.username),
      components: [row],
    });

    console.log(`Sent onboarding DM to ${member.user.displayName}`);
  } catch (error) {
    console.error(`Failed to send onboarding DM to ${member.user.displayName}:`, error);
    // Don't throw - we don't want to break the bot if DMs are disabled
  }
});
