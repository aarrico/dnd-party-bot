import { Role } from '@prisma/client';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const createActionRowOfButtons = (
  roles: Role[]
): ActionRowBuilder<ButtonBuilder>[] => {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < roles.length; i += 3) {
    const rolesForRow = roles.slice(i, i + 3);
    const row = new ActionRowBuilder<ButtonBuilder>();

    rolesForRow.forEach((role) => {
      row.components.push(
        new ButtonBuilder()
          .setCustomId(role.id)
          .setLabel(role.name)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(`<:${role.name}:${role.emojiId}`)
      );
    });
    rows.push(row);
  }

  return rows;
};
