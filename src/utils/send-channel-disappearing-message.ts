import { ChannelType } from "discord.js";

export default function sendChannelDisappearingMessage(
  channel: any,
  messageContentPayload: any,
  duration = 10
) {
  if (!channel || channel.type !== ChannelType.GuildText) return;
  channel.send(messageContentPayload).then((message: any) => {
    if (duration === -1) {
      return;
    }

    setTimeout(() => {
      message.delete();
    }, 1000 * duration);
  });
}
