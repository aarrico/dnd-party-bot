require('dotenv').config();
const {Client, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');

const roles_row1 = [
    {
        id: 'role-one',
        label: 'Paladin',
        emoji: {
            name: 'angyphonesearch',
            emoji_id: '1224037722839060490'
        }
    },
    {
        id: 'role-two',
        label: 'Barbarian',
        emoji: {
            name: 'Exodia',
            emoji_id: '1224037625665687687'
        }
    },
    {
        id: 'role-three',
        label: 'Wizard',
        emoji: {
            name: 'kermitbayo',
            emoji_id: '1224037567767380039'
        }
    }
]

const roles_row2 = [
    {
        id: 'role-four',
        label: 'Cleric',
        emoji: {
            name: 'angyphonesearch',
            emoji_id: '1224037722839060490'
        }
    },
    {
        id: 'role-five',
        label: 'Ranger',
        emoji: {
            name: 'Exodia',
            emoji_id: '1224037625665687687'
        }
    },
    {
        id: 'role-six',
        label: 'Warlock',
        emoji: {
            name: 'kermitbayo',
            emoji_id: '1224037567767380039'
        }
    }
]

module.exports = async (client, channel_id) => {
    try {
        const channel = await client.channels.cache.get(channel_id);
        // console.log(client.channels.cache);
        // if(!channel) return;
        // return;
        const row1 = createActionRowOfButtons(roles_row1);
        const row2 = createActionRowOfButtons(roles_row2);

        await channel.send({
            content: 'Hello everyone, we have a new session for people to join!',
            components: [row1, row2]
        })
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