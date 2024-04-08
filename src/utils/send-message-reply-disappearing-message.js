module.exports = (interaction, messageContentPayload, duration = 10) => {
    {
        interaction.reply(messageContentPayload).then(message => {
        if(duration === -1)
        {
            return
        }

        setTimeout(() => {
            message.delete()
        }, 1000 * duration)
    })
    }
}