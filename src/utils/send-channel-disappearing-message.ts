export default function sendChannelDisappearingMessage(
  channel: any,
  messageContentPayload: any,
  duration = 10
) {
  {
    channel.send(messageContentPayload).then((message: any) => {
      if (duration === -1) {
        return;
      }

      setTimeout(() => {
        message.delete();
      }, 1000 * duration);
    });
  }
}
