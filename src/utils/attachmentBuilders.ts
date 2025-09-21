import { AttachmentBuilder } from 'discord.js';
import { writeFileSync } from 'fs';
import path from 'path';
import { getAbsolutePath } from './getAbsolutePath';

export function getTxtAttachmentBuilder(
  pathStr: string,
  attachmentName: string,
  attachmentContents: string
) {
  writeFileSync(pathStr, attachmentContents, {
    flag: 'w',
  });

  return getAttachmentBuilder(pathStr, attachmentName);
}

export function getImgAttachmentBuilder(
  pathStr: string,
  attachmentName: string
) {
  return getAttachmentBuilder(pathStr, attachmentName);
}

function getAttachmentBuilder(pathStr: string, attachmentName: string) {
  // If the path is already absolute, use it directly
  // Otherwise, resolve it using getAbsolutePath
  const finalPath = path.isAbsolute(pathStr) ? pathStr : getAbsolutePath(pathStr);

  console.log(`Creating attachment builder with path: ${finalPath}`);

  return new AttachmentBuilder(finalPath, {
    name: attachmentName,
  });
}
