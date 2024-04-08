module.exports = (channel, messageContentPayload, duration = 10) => {
    {
        channel.send(messageContentPayload).then(message => {
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