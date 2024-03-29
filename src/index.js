require('dotenv').config();
const {Client, IntentsBitField, EmbedBuilder, User} = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
]});

//structure
// sessionStack: any = {
//     sessions: {
//         sessionId: Number,
//         sessionName: String,
//         sessionDM: User,
//         sessionDate: {
//             day: Number,
//             month: Number,
//             year: Number,
//             time: String
//         },
//         sessionParty: {
//             username: String,
//             userChannelId: String,
//             role: String
//         }
//     }
// };


eventHandler(client);

client.login(process.env.TOKEN);
