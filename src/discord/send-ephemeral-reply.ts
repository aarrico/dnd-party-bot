import { AttachmentBuilder } from "discord.js";

export function sendEphemeralReply(
  messageContent: string,
  interaction: any,
  files?: AttachmentBuilder[]
) {
  return interaction.reply({
    content: messageContent,
    files: files ? [...files] : undefined,
    ephemeral: true,
  });
}
