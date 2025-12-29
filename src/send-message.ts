import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Client,
  IntentsBitField,
} from 'discord.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('SendMessageScript');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const roles = [
  {
    id: '1213618163963658320',
    label: 'DungeonMaster',
  },
  {
    id: '1220538253405327531',
    label: 'PartyMember',
  },
  {
    id: '1220538355909922877',
    label: 'NPC',
  },
];

client.on('ready', () => {
  void (async () => {
    try {
      const channel = client?.channels?.cache?.get(
        '1213617829996134521'
      );
      if (!channel || channel.type !== ChannelType.GuildText) return;

      const row = new ActionRowBuilder<ButtonBuilder>();
      roles.forEach((role) => {
        row.components.push(
          new ButtonBuilder()
            .setCustomId(role.id)
            .setLabel(role.label)
            .setStyle(ButtonStyle.Primary)
        );
      });
      await channel.send({
        content: 'Claim or remove a role',
        components: [row],
      });
      process.exit();
    } catch (error) {
      logger.error('Failed to send role selection message', { error });
    }
  })();
});

void client.login(process.env.DISCORD_TOKEN);
