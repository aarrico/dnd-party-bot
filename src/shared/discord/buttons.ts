import { Role } from '#generated/prisma/client.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { RoleType } from '#modules/role/domain/roleManager.js';

// Map role types to appropriate Unicode emojis
const roleEmojiMap: Record<RoleType, string> = {
  [RoleType.TANK]: '🛡️', // Shield
  [RoleType.SUPPORT]: '💚', // Green heart
  [RoleType.RANGE_DPS]: '🏹', // Bow and arrow
  [RoleType.MELEE_DPS]: '⚔️', // Crossed swords
  [RoleType.FACE]: '🎭', // Theater masks
  [RoleType.CONTROL]: '🧙', // Mage
  [RoleType.GAME_MASTER]: '👑', // Crown (shouldn't be used in selectable buttons)
};

export const createActionRowOfButtons = (
  roles: Role[]
): ActionRowBuilder<ButtonBuilder>[] => {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const selectable = roles.filter((r) => r.id !== RoleType.GAME_MASTER);

  for (let i = 0; i < selectable.length; i += 3) {
    const rolesForRow = selectable.slice(i, i + 3);
    const row = new ActionRowBuilder<ButtonBuilder>();

    rolesForRow.forEach((role) => {
      const emoji = roleEmojiMap[role.id] || '❓';

      row.components.push(
        new ButtonBuilder()
          .setCustomId(role.id)
          .setStyle(ButtonStyle.Secondary)
          .setEmoji(emoji)
          .setLabel(role.displayName)
      );
    });

    rows.push(row);
  }

  return rows;
};
