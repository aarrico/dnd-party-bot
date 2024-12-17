import { ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../structures/Command";
import {
  GetAllSessionsAUserIsIn,
  GetUserById,
} from "../../db/session";
import { getTxtAttachmentBuilder } from "../../utils/attachmentBuilders";
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from "../../utils/botDialogStrings";
import { sendEphemeralReply } from "../../discord/send-ephemeral-reply";

export default new Command({
  name: BotCommandInfo.GetAllUserSessions_Name,
  description: BotCommandInfo.GetAllUserSessions_Description,
  cooldown: 0,
  options: [
    {
      name: BotCommandOptionInfo.GetAllUserSessions_UserIDName,
      description: BotCommandOptionInfo.GetAllUserSessions_UserIDDescription,
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: BotCommandOptionInfo.GetAllUserSessions_SessionIDName,
      description: BotCommandOptionInfo.GetAllUserSessions_SessionIDDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllUserSessions_UserRoleName,
      description: BotCommandOptionInfo.GetAllUserSessions_UserRoleDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllUserSessions_SessionDateTimeName,
      description:
        BotCommandOptionInfo.GetAllUserSessions_SessionDateTimeDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllUserSessions_SessionMessageIDName,
      description:
        BotCommandOptionInfo.GetAllUserSessions_SessionMessageIDDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      const userID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUserSessions_UserIDName
      )?.value as string;
      const sessions = await GetAllSessionsAUserIsIn(userID);
      const addUserRoleInThisSession = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUserSessions_UserRoleName
      )?.value as boolean;
      const addSessionDateTime = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUserSessions_SessionDateTimeName
      )?.value as boolean;
      const addSessionID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUserSessions_SessionIDName
      )?.value as boolean;
      const addMessageID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllUserSessions_SessionMessageIDName
      )?.value as boolean;

      let list = `Session List that ${
        (await GetUserById(userID)).username
      } has signed up for:\nFormat:\n\nSession Name`;
      if (addUserRoleInThisSession) list = list.concat(` : User Role`);
      if (addSessionDateTime) list = list.concat(` : Session Date Time`);
      if (addSessionID) list = list.concat(` : Session ID`);
      if (addMessageID) list = list.concat(` : Session Message ID`);
      list = list.concat(`\n`);

      sessions.forEach((session) => {
        list = list.concat(`${session.session.name}`);
        if (addUserRoleInThisSession) list = list.concat(` : ${session.role}`);
        if (addSessionDateTime)
          list = list.concat(` : ${session.session.date}`);
        if (addSessionID) list = list.concat(` : ${session.session.id}`);
        if (addMessageID) list = list.concat(` : ${session.session.messageId}`);
        list = list.concat(`\n`);
      });

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.SessionsUserHasSignedUpFor}`,
        BotAttachmentFileNames.SessionsUserHasSignedUpFor,
        list
      );

      sendEphemeralReply(
        BotDialogs.GetAllUserSessions_HereIsTheList,
        interaction,
        [attachment]
      );
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
});
