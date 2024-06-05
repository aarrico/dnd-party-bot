export default function sendMessageReplyDisappearingMessage(
  interaction: any,
  messageContentPayload: any,
  duration = 10
) {
  {
    interaction.reply(messageContentPayload).then((message: any) => {
      if (duration === -1) {
        return;
      }

      setTimeout(() => {
        message.delete();
      }, 1000 * duration);
    });
  }
}
