import {
  AttachmentBuilder,
  ButtonInteraction,
  CacheType,
  ChannelType,
  CommandInteractionOptionResolver,
} from "discord.js";
import { client } from "../..";
import { Event } from "../../structures/Event";
import { ExtendedInteraction } from "../../typings/Command";
import path from "path";
import sendMessageReplyDisappearingMessage from "../../utils/send-message-reply-disappearing-message";
import {
  CreateNewSessionUserInDB,
  CreateNewUserInDB,
} from "../../utils/prisma-commands";
import { CreateCompositeImage } from "../../utils/create-composite-session-Image";
import { getPNGAttachmentBuilder } from "../../utils/attachmentBuilders";
import {
  BotAttachmentFileNames,
  BotDialogs,
  BotPaths,
} from "../../utils/botDialogStrings";

export default new Event("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) {
      return await interaction.reply(
        BotDialogs.InteractionCreate_NonexistentCommand
      );
    }
    command.callBack({
      args: interaction.options as CommandInteractionOptionResolver,
      client,
      interaction: interaction as ExtendedInteraction,
    });
  } else if (interaction.isButton() && interaction.message) {
    const channel = client?.channels?.cache?.get(
      process.env.SESSION_CHANNEL_ID as string
    );
    if (channel?.type === ChannelType.GuildText) {
      const message = channel?.messages?.cache?.get(interaction.message.id);
      addUserToDB(interaction);
      setTimeout(async () => {
        await CreateCompositeImage(client, message?.id as string);

        const attachment = getPNGAttachmentBuilder(
          `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
          BotAttachmentFileNames.CurrentSession
        );

        message?.edit({
          content: BotDialogs.InteractionCreate_HereIsANewSessionMessage,
          files: [attachment],
        });
      }, 250);
    }
  }
});

function addUserToDB(interaction: ButtonInteraction<CacheType>) {
  interaction.message.components.forEach((component) => {
    component.components.forEach(async (subComp: any) => {
      if (subComp.customId === interaction.customId) {
        let sessionPMData = {
          userId: interaction.user.id,
          username: interaction.user.username,
          role: subComp.label,
        };

        let userData = {
          username: interaction.user.displayName,
          userChannelId: interaction.user.id,
        };

        // these could all be done in the same database query.
        // similarly to how i pulled SessionUser data in the get session query
        // you can create related data in a natural way in prisma.
        // https://www.prisma.io/docs/orm/prisma-client/queries/relation-queries#connect-multiple-records
        // in the link's example, sessions would take the place of posts. look past the first section that links to
        // this gives a lot of prisma way to handle relations without querying SessionUser directly, you shouldn't have to. 
        // if you just have one record, you can get rid of the array
        // then you pass the session id like
        // sessions: { connect: { id: sessionID } }
        await CreateNewUserInDB(userData);
        const actionTaken = await CreateNewSessionUserInDB(
          interaction,
          interaction.message.id,
          subComp.label
        );

        const messageContent = GetMessageContent(actionTaken, sessionPMData);

        sendMessageReplyDisappearingMessage(
          interaction,
          {
            content: messageContent,
            ephemeral: true,
          },
          10
        );
      }
    });
  });
}

function GetMessageContent(
  actionTaken: string | undefined,
  sessionPMData: { userId: string; username: string; role: any }
) {
  switch (actionTaken) {
    case "created":
      return `${BotDialogs.RoleChosenMessageContent_WelcomeToTheParty1}${sessionPMData.username}
      ${BotDialogs.RoleChosenMessageContent_WelcomeToTheParty2}${sessionPMData.role}
      ${BotDialogs.RoleChosenMessageContent_WelcomeToTheParty3}`;
    case "deleted":
      return `${BotDialogs.RoleChosenMessageContent_Farewell1}${sessionPMData.username}
      ${BotDialogs.RoleChosenMessageContent_Farewell2}`;
    case "updated":
      return `${BotDialogs.RoleChosenMessageContent_RoleSwap1}${sessionPMData.username}
      ${BotDialogs.RoleChosenMessageContent_RoleSwap2}${sessionPMData.role}
      ${BotDialogs.RoleChosenMessageContent_RoleSwap3}`;
    case "role taken":
      return BotDialogs.RoleChosenMessageContent_RoleTaken;
    case "party full":
      return BotDialogs.RoleChosenMessageContent_PartyFull;
    case "Cant Change DM":
      return BotDialogs.RoleChosenMessageContent_DMCantSwap;
    default:
      return BotDialogs.RoleChosenMessageContent_NoActionTaken;
  }
}
