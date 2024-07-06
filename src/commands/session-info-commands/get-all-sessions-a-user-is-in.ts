import { ApplicationCommandOptionType, AttachmentBuilder } from "discord.js";
import { Command } from "../../structures/Command";
import {
  GetAllSessionsAUserIsIn,
  GetUserByID,
} from "../../utils/prisma-commands";
import path from "path";
import { writeFileSync } from "fs";

export default new Command({
  name: "get-all-sessions-a-user-is-in",
  description:
    "Retrieves a list of all sessions that a user has signed up for from the db.",
  cooldown: 0,
  options: [
    {
      name: "user-id",
      description: "User UUID string that you are finding the sessions for.",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "session-id",
      description: "UUID of session in DB(unique identifier)",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "user-role-in-this-session",
      description: "User role for session",
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
      const userID = interaction?.options?.get("user-id")?.value as string;
      const sessions = await GetAllSessionsAUserIsIn(userID);
      const addUserRoleInThisSession = interaction?.options?.get(
        "user-role-in-this-session"
      )?.value as boolean;
      const addSessionDateTime = interaction?.options?.get("session-date-time")
        ?.value as boolean;
      const addSessionID = interaction?.options?.get("session-id")
        ?.value as boolean;
      const addMessageID = interaction?.options?.get("session-message-id")
        ?.value as boolean;

      let list = `Session List that ${
        (await GetUserByID(userID)).username
      } has signed up for:\nFormat:\n\nSession Name`;
      if (addUserRoleInThisSession) list = list.concat(` : User Role`);
      if (addSessionDateTime) list = list.concat(` : Session Date Time`);
      if (addSessionID) list = list.concat(` : Session ID`);
      if (addMessageID) list = list.concat(` : Session Message ID`);
      list = list.concat(`\n`);

      sessions.forEach((session) => {
        list = list.concat(`${session.session.sessionName}`);
        if (addUserRoleInThisSession) list = list.concat(` : ${session.role}`);
        if (addSessionDateTime)
          list = list.concat(` : ${session.session.sessionDate}`);
        if (addSessionID) list = list.concat(` : ${session.session.id}`);
        if (addMessageID)
          list = list.concat(` : ${session.session.sessionMessageId}`);
        list = list.concat(`\n`);
      });

      writeFileSync(
        "./src/resources/temp/SessionsUserHasSignedUpFor.txt",
        list,
        {
          flag: "w",
        }
      );

      const attachment = new AttachmentBuilder(
        path
          .resolve("./src/resources/temp/SessionsUserHasSignedUpFor.txt")
          .replace(/\//g, "/"),
        {
          name: "SessionsUserHasSignedUpFor.txt",
        }
      );

      interaction.reply({
        content:
          "Here is the list of Sessions on file this user has signed up for:",
        files: [attachment],
        ephemeral: true,
      });
    } catch (error) {
      console.log(error);
    }
  },
});
