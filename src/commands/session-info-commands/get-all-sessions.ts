import { Command } from "../../structures/Command";
import { GetAllSessions } from "../../utils/prisma-commands";
import { ApplicationCommandOptionType } from "discord.js";
import { getTxtAttachmentBuilder } from "../../utils/attachmentBuilders";
import { BotAttachmentFileNames, BotPaths } from "../../utils/botDialogStrings";

export default new Command({
  name: "get-all-sessions",
  description: "Retrieves a list of all sessions added to db by bot.",
  cooldown: 0,
  options: [
    {
      name: "session-id",
      description: "UUID of session in DB(unique identifier)",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "session-date-time",
      description: "Date/Time of session in DB",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "session-message-id",
      description: "discord message id for session",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      const addSessionID = interaction?.options?.get("session-id")
        ?.value as boolean;
      const addSessionDateTime = interaction?.options?.get("session-date-time")
        ?.value as boolean;
      const addMessageID = interaction?.options?.get("session-message-id")
        ?.value as boolean;

      const sessions = await GetAllSessions();
      let list: string = "Session List:\nFormat:\n\nSession Name";

      if (addSessionID) list = list.concat(` : Session ID`);
      if (addSessionDateTime) list = list.concat(` : Session Date`);
      if (addMessageID) list = list.concat(` : Session Message ID`);
      list = list.concat(`\n`);

      sessions.forEach((session) => {
        list = list.concat(`${session.sessionName}`);
        if (addSessionID) list = list.concat(` : ${session.id}`);
        if (addSessionDateTime) list = list.concat(` : ${session.sessionDate}`);
        if (addMessageID) list = list.concat(` : ${session.sessionMessageId}`);
        list = list.concat(`\n`);
      });

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllSessionInformation}`,
        BotAttachmentFileNames.AllSessionInformation,
        list
      );

      interaction.reply({
        content: "Here is the list of Sessions you currently have on file.",
        files: [attachment],
        ephemeral: true,
      });
    } catch (error) {
      interaction.reply(`There was an error: ${error}`);
    }
  },
});
