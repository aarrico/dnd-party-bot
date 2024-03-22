require('dotenv').config();
const {Client, IntentsBitField, EmbedBuilder} = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent
]});

// client.on('messageCreate', (message)=> {
//     if(message.author.bot)
//     {
//         return
//     }

//     if(message.content.toLowerCase() === 'hello')
//     {
//         message.reply('hello');
//     }

//     if(message.content.toLowerCase() === 'yorgy')
//     {
//         message.reply('shmorgy!');
//     }
// })

// client.on('interactionCreate', async (interaction) => {
//     // if(!interaction.isChatInputCommand()) return;
    
//     // if(interaction.commandName.toLowerCase() === 'hey')
//     // {
//     //     interaction.reply('hello!')
//     // }

//     // if(interaction.commandName.toLowerCase() === 'ping')
//     // {
//     //     interaction.reply('pong!')
//     // }

//     // if(interaction.commandName.toLowerCase() === 'add')
//     // {
//     //     const num1 = interaction.options.get('first-number').value;
//     //     const num2 = interaction.options.get('second-number').value;
//     //     const sum = num1 + num2;
//     //     interaction.reply(`${num1} + ${num2} = ${sum}`);
//     // }

//     // if(interaction.commandName.toLowerCase() === 'embed')
//     // {
//     //     const embed = new EmbedBuilder()
//     //     .setTitle('Embed Title')
//     //     .setDescription('This is an embed desc')
//     //     .setColor('Blue')
//     //     .addFields(
//     //         {name: 'Field Title 1', value: 'Some 1st Random Value', inline: true}, 
//     //         {name: 'Field Title 2', value: 'Some 2nd Random Value', inline: true}
//     //         );
//     //     interaction.reply({embeds: [embed]});
//     //     // this is used to send a message without replying. causes error on command side with this.
//     //     // use with message for now
//     //     // interaction.channel.send({embeds: [embed]});

//     // }

//     try {
//         if(!interaction.isButton()) return;

//         await interaction.deferReply({ephemeral: true});

//         const role = interaction.guild.roles.cache.get(interaction.customId);
//         if(!role)
//         {
//             interaction.editReply({
//                 content: "I could not find that role."
//             });
//             return;
//         }

//         const hasRole = interaction.member.roles.cache.has(role.id)
//         if(hasRole)
//         {
//             await interaction.member.roles.remove(role);
//             await interaction.editReply(`The role ${role} has been removed.`);
//             return;
//         }
//         await interaction.member.roles.add(role);
//         await interaction.editReply(`The role ${role} has been added.`);
//         } catch (error) {
//             console.log(error);
//         }

    
// })

eventHandler(client);

client.login(process.env.TOKEN);
