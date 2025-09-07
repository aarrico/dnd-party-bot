import { Role } from '@prisma/client';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { RoleType } from '../models/role.js';

export const createActionRowOfButtons = (
  roles: Role[]
): ActionRowBuilder<ButtonBuilder>[] => {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const selectable = roles.filter((r) => r.id !== RoleType.GAME_MASTER);

  for (let i = 0; i < selectable.length; i += 3) {
    const rolesForRow = selectable.slice(i, i + 3);
    const row = new ActionRowBuilder<ButtonBuilder>();

    rolesForRow.forEach((role) => {
      row.components.push(
        new ButtonBuilder()
          .setCustomId(role.id)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(`<:${role.displayName}:${role.emojiId}>`)
      );
    });

    rows.push(row);
  }

  return rows;
};
