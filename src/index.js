require('dotenv').config();
const {Client, IntentsBitField, EmbedBuilder, User, AttachmentBuilder} = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const path = require('path');
const imageToSend = './src/utils/Exodia.jpg';
const sendMessageReplyDisappearingMessage = require('./utils/send-message-reply-disappearing-message');

const client = new Client({intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
]});

let sessionStack = {
    sessions: {}
};

client.on('ready', (c)=> {
    let sessionStack = {
        sessions: [{}]
    };

    console.log(sessionStack);
})



client.on('interactionCreate', async interaction =>{
    if (!interaction.isButton()) return;
    // console.log(interaction);
    const channel = client.channels.cache.get(process.env.SESSION_CHANNEL_ID);
    const message = channel.messages.cache.get(interaction.message.id);

    let absolutePath = path.resolve(imageToSend).replace(/\//g, "/");
    const attachment = new AttachmentBuilder(absolutePath, { name: 'Exodia.jpg' });

    message.edit({
        content: "Hello everyone, we have a new session for people to join!",
        files: [attachment], 
    });

    interaction.message.components.forEach(component => {
        // console.log(component);
        component.components.forEach(subComp => {
            if(subComp.customId === interaction.customId)
            {
                let sessionPMData = 
                {
                    userId: interaction.user.id,
                    username: interaction.user.username,
                    role: subComp.label
                };
                
                sendMessageReplyDisappearingMessage(
                    interaction, 
                    {
                        content: `Welcome to the Party ${sessionPMData.username}. You have been added as a ${sessionPMData.role}!`,
                        ephemeral: true
                    },
                    10);
            }
        })
    })

})

eventHandler(client);

client.login(process.env.TOKEN);
