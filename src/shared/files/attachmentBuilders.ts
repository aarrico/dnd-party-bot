import { AttachmentBuilder } from 'discord.js';
import { writeFileSync } from 'fs';
import path from 'path';
import { getAbsolutePath } from './getAbsolutePath.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('AttachmentBuilders');

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

/**
 * Create an attachment from an in-memory buffer.
 * This avoids file I/O and race conditions from concurrent image generation.
 */
export function getImgAttachmentBuilderFromBuffer(
  buffer: Buffer,
  attachmentName: string
) {
  logger.debug('Creating attachment from buffer', {
    attachmentName,
    sizeBytes: buffer.length,
  });

  return new AttachmentBuilder(buffer, {
    name: attachmentName,
  });
}

function getAttachmentBuilder(pathStr: string, attachmentName: string) {
  // If the path is already absolute, use it directly
  // Otherwise, resolve it using getAbsolutePath
  const finalPath = path.isAbsolute(pathStr)
    ? pathStr
    : getAbsolutePath(pathStr);

  logger.debug('Creating attachment builder', { finalPath, attachmentName });

  return new AttachmentBuilder(finalPath, {
    name: attachmentName,
  });
}
