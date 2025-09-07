import { SlashCommandBuilder } from 'discord.js';
import { BotCommandOptionInfo } from '../../utils/botDialogStrings.js';
import { ExtendedInteraction } from '../../models/Command.js';
import { cancelSession } from '../../controllers/session.js';
import { sendEphemeralReply } from '../../discord/message.js';

export default {
  data: new SlashCommandBuilder()
    .setName(BotCommandOptionInfo.CancelSession_Name)
    .setDescription(BotCommandOptionInfo.CancelSession_Description)
    .addStringOption((id) =>
      id
        .setName(BotCommandOptionInfo.SessionId_Name)
        .setDescription(BotCommandOptionInfo.SessionId_Description)
        .setRequired(true)
    )
    .addStringOption((reason) =>
      reason
        .setName(BotCommandOptionInfo.CancelSession_ReasonName)
        .setDescription(BotCommandOptionInfo.CancelSession_ReasonDescription)
        .setRequired(true)
    ),
  async execute(interaction: ExtendedInteraction) {
    const sessionId = interaction.options.getString(BotCommandOptionInfo.SessionId_Name, true);
    const reason = interaction.options.getString(BotCommandOptionInfo.CancelSession_ReasonName, true);

    await cancelSession(sessionId, reason);

    await sendEphemeralReply(`Session data has been deleted.`, interaction);
  },
};
