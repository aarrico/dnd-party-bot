require('dotenv').config();
const path = require('path');
const imageToSend = './src/utils/TW_ui_menu_backplate.png';

const {ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder} = require('discord.js');

const roles_row1 = [
    {
        id: 'role-one',
        label: 'Tank',
        emoji: {
            name: 'TankEmoji',
            emoji_id: '1227069036806799440'
        }
    },
    {
        id: 'role-two',
        label: 'Support',
        emoji: {
            name: 'SupportEmoji',
            emoji_id: '1227069035070488618'
        }
    },
    {
        id: 'role-three',
        label: 'Range DPS',
        emoji: {
            name: 'RangeDPS',
            emoji_id: '1227069033094844416'
        }
    }
]

const roles_row2 = [
    {
        id: 'role-four',
        label: 'Melee DPS',
        emoji: {
            name: 'MeleeDPSEmoji',
            emoji_id: '1227069030590845113'
        }
    },
    {
        id: 'role-five',
        label: 'Face',
        emoji: {
            name: 'FaceEmoji',
            emoji_id: '1227069028930027570'
        }
    },
    {
        id: 'role-six',
        label: 'Control',
        emoji: {
            name: 'ControlEmoji',
            emoji_id: '1227069027172749354'
        }
    }
]

module.exports = async (client, channel_id) => {
    try {
        const channel = await client.channels.cache.get(channel_id);

        let absolutePath = path.resolve(imageToSend).replace(/\//g, "/");
        const attachment = new AttachmentBuilder(absolutePath, { name: 'TW_ui_menu_backplate.png' });
        const row1 = createActionRowOfButtons(roles_row1);
        const row2 = createActionRowOfButtons(roles_row2);

        await channel.send(
        {
            content: "Hello everyone, we have a new session for people to join!",
            files: [attachment], 
            components: [row1, row2]});

    } catch (error) {
        console.log(error);
    }
}

function createActionRowOfButtons(roles)
{
    let row = new ActionRowBuilder();
    roles.forEach(role => {
        row.components.push(new ButtonBuilder()
        .setCustomId(role.id)
        .setLabel(role.label)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(`<:${role.emoji.name}:${role.emoji.emoji_id}`));
    });
    return row;
}