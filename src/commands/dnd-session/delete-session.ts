import { SlashCommandBuilder } from 'discord.js';
import { BotCommandOptionInfo } from '../../utils/botDialogStrings';
import { ExtendedInteraction } from '../../typings/Command';
import { cancelSession } from '../../controllers/session';
import { sendEphemeralReply } from '../../discord/message';

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
    const sessionId = interaction.options.get(
      BotCommandOptionInfo.SessionId_Name
    )?.value as string;
    const reason = interaction.options.get(
      BotCommandOptionInfo.CancelSession_ReasonName
    )?.value as string;

    await cancelSession(sessionId, reason);

    await sendEphemeralReply(`Session data has been deleted.`, interaction);
  },
};
