import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getPNGAttachmentBuilder } from "./attachmentBuilders";
import { BotAttachmentFileNames, BotPaths } from "./botDialogStrings";

export class RoleClass {
  id!: string;
  label!: string;
  emoji!: {
    name: string;
    emoji_id: string;
  };
}

const roles_row1: RoleClass[] = [
  {
    id: "role-one",
    label: "Tank",
    emoji: {
      name: "TankEmoji",
      emoji_id: "1227069036806799440",
    },
  },
  {
    id: "role-two",
    label: "Support",
    emoji: {
      name: "SupportEmoji",
      emoji_id: "1227069035070488618",
    },
  },
  {
    id: "role-three",
    label: "Range DPS",
    emoji: {
      name: "RangeDPS",
      emoji_id: "1227069033094844416",
    },
  },
];

const roles_row2: RoleClass[] = [
  {
    id: "role-four",
    label: "Melee DPS",
    emoji: {
      name: "MeleeDPSEmoji",
      emoji_id: "1227069030590845113",
    },
  },
  {
    id: "role-five",
    label: "Face",
    emoji: {
      name: "FaceEmoji",
      emoji_id: "1227069028930027570",
    },
  },
  {
    id: "role-six",
    label: "Control",
    emoji: {
      name: "ControlEmoji",
      emoji_id: "1227069027172749354",
    },
  },
];

export default async function createSessionMessage(
  client: any,
  channel_id: any
) {
  try {
    const channel = await client.channels.cache.get(channel_id);
    const row1 = createActionRowOfButtons(roles_row1);
    const row2 = createActionRowOfButtons(roles_row2);
    const attachment = getPNGAttachmentBuilder(
      `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`,
      BotAttachmentFileNames.CurrentSession
    );

    const sentMessage = await channel.send({
      content: "Hello everyone, we have a new session for people to join!",
      files: [attachment],
      components: [row1, row2],
    });

    return sentMessage.id;
  } catch (error) {
    return `error caught: ${error}`;
  }
}

function createActionRowOfButtons(roles: RoleClass[]) {
  let row = new ActionRowBuilder<ButtonBuilder>();
  roles.forEach((role) => {
    row.components.push(
      new ButtonBuilder()
        .setCustomId(role.id)
        .setLabel(role.label)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(`<:${role.emoji.name}:${role.emoji.emoji_id}`)
    );
  });
  return row;
}
