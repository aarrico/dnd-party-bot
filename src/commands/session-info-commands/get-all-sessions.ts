import { Command } from "../../structures/Command";
import { GetAllSessions } from "../../utils/prisma-commands";
import { ApplicationCommandOptionType } from "discord.js";
import { getTxtAttachmentBuilder } from "../../utils/attachmentBuilders";
import {
  BotAttachmentFileNames,
  BotCommandInfo,
  BotCommandOptionInfo,
  BotDialogs,
  BotPaths,
} from "../../utils/botDialogStrings";
import { sendEphemeralReply } from "../../utils/send-ephemeral-reply";

export default new Command({
  name: BotCommandInfo.GetAllSessions_Name,
  description: BotCommandInfo.GetAllSessions_Description,
  cooldown: 0,
  options: [
    {
      name: BotCommandOptionInfo.GetAllSessions_SessionIDName,
      description: BotCommandOptionInfo.GetAllSessions_SessionIDDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllSessions_SessionDateTimeName,
      description:
        BotCommandOptionInfo.GetAllSessions_SessionDateTimeDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: BotCommandOptionInfo.GetAllSessions_SessionMessageIDName,
      description:
        BotCommandOptionInfo.GetAllSessions_SessionMessageIDDescription,
      type: ApplicationCommandOptionType.Boolean,
    },
  ],
  callBack: async ({ interaction }) => {
    try {
      const addSessionID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllSessions_SessionIDName
      )?.value as boolean;
      const addSessionDateTime = interaction?.options?.get(
        BotCommandOptionInfo.GetAllSessions_SessionDateTimeName
      )?.value as boolean;
      const addMessageID = interaction?.options?.get(
        BotCommandOptionInfo.GetAllSessions_SessionMessageIDName
      )?.value as boolean;

      const sessions = await GetAllSessions();
      let list: string = "Session List:\nFormat:\n\nSession Name";

      if (addSessionID) list = list.concat(` : Session ID`);
      if (addSessionDateTime) list = list.concat(` : Session Date`);
      if (addMessageID) list = list.concat(` : Session Message ID`);
      list = list.concat(`\n`);

      sessions.forEach((session) => {
        list = list.concat(`${session.name}`);
        if (addSessionID) list = list.concat(` : ${session.id}`);
        if (addSessionDateTime) list = list.concat(` : ${session.date}`);
        if (addMessageID) list = list.concat(` : ${session.messageId}`);
        list = list.concat(`\n`);
      });

      const attachment = getTxtAttachmentBuilder(
        `${BotPaths.TempDir}${BotAttachmentFileNames.AllSessionInformation}`,
        BotAttachmentFileNames.AllSessionInformation,
        list
      );

      sendEphemeralReply(BotDialogs.GetAllSessions_HereIsTheList, interaction, [
        attachment,
      ]);
    } catch (error) {
      sendEphemeralReply(`There was an error: ${error}`, interaction);
    }
  },
});
