import { writeFileSync } from "fs";
import { Command } from "../../structures/Command";
import { GetAllSessions, GetAllUsers } from "../../utils/prisma-commands";
import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import path from "path";

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

      writeFileSync("./src/resources/temp/AllSessionInformation.txt", list, {
        flag: "w",
      });

      const attachment = new AttachmentBuilder(
        path
          .resolve("./src/resources/temp/AllSessionInformation.txt")
          .replace(/\//g, "/"),
        {
          name: "Session_Info.txt",
        }
      );

      interaction.reply({
        content: "Here is the list of Sessions you currently have on file.",
        files: [attachment],
      });
    } catch (error) {
      interaction.reply(`There was an error: ${error}`);
    }
  },
});
