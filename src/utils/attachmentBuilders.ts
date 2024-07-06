import { AttachmentBuilder } from "discord.js";
import { writeFileSync } from "fs";
import { getAbsolutePath } from "./getAbsolutePath";

export function getTxtAttachmentBuilder(
  pathSTR: string,
  attachmentName: string,
  attachmentContents: string
) {
  writeFileSync(pathSTR, attachmentContents, {
    flag: "w",
  });

  return getAttachmentBuilder(pathSTR, attachmentName);
}

export function getPNGAttachmentBuilder(
  pathSTR: string,
  attachmentName: string
) {
  return getAttachmentBuilder(pathSTR, attachmentName);
}

function getAttachmentBuilder(pathSTR: string, attachmentName: string) {
  return new AttachmentBuilder(getAbsolutePath(pathSTR), {
    name: attachmentName,
  });
}
