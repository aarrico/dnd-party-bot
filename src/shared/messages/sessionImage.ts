import fs from 'fs';
import sharp, { OverlayOptions } from 'sharp';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { BotAttachmentFileNames, BotPaths } from './botDialogStrings.js';
import { getRoleByString, RoleType } from '#modules/role/domain/roleManager.js';
import { getRoleImage } from '#modules/role/domain/role.types.js';
import { Session } from '#modules/session/domain/session.types.js';
import { PartyMemberImgInfo } from '#modules/session/domain/session.types.js';
import { formatSessionDate } from '../datetime/dateUtils.js';
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('SessionImage');

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const defaultFontsDir = path.resolve(process.cwd(), 'resources/fonts');
const fallbackFontsDir = path.resolve(moduleDir, '../../resources/fonts');

const resolvedFontsDir = fs.existsSync(path.join(defaultFontsDir, 'Vecna-oppx.ttf'))
  ? defaultFontsDir
  : fallbackFontsDir;

const regularFontPath = path.join(resolvedFontsDir, 'Vecna-oppx.ttf');
const boldFontPath = path.join(resolvedFontsDir, 'VecnaBold-4YY4.ttf');

if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
  throw new Error(`Vecna font files not found in ${resolvedFontsDir}`);
}

const regularFontUrl = pathToFileURL(regularFontPath).href;
const boldFontUrl = pathToFileURL(boldFontPath).href;

const TEXT_WIDTH_RATIO = 0.88;
const TEXT_HEIGHT_RATIO = 0.95;
const MIN_FONT_SIZE = 12;

type FontMeasurement = {
  width: number;
  height: number;
};

const measurementCache = new Map<string, FontMeasurement>();

const escapeXml = (input: string): string =>
  input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getFontConfig = (bold: boolean) => ({
  family: bold ? 'VecnaBold' : 'VecnaRegular',
  url: bold ? boldFontUrl : regularFontUrl,
  weight: bold ? 'bold' : 'normal',
});

const buildTextSvg = (
  text: string,
  {
    width,
    height,
    fontSize,
    bold,
    anchor,
    x,
    y,
    dominantBaseline,
  }: {
    width: number;
    height: number;
    fontSize: number;
    bold: boolean;
    anchor: 'start' | 'middle';
    x: number;
    y: number;
    dominantBaseline?: string;
  }
): string => {
  const { family, url, weight } = getFontConfig(bold);

  const baselineAttr = dominantBaseline
    ? `dominant-baseline="${dominantBaseline}"`
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <style>
        @font-face {
          font-family: '${family}';
          src: url('${url}') format('truetype');
          font-weight: ${weight};
        }
      </style>
      <text
        x="${x}"
        y="${y}"
        font-family="${family}"
        font-size="${fontSize}"
        font-weight="${weight}"
        fill="white"
        text-anchor="${anchor}"
        ${baselineAttr}
      >${escapeXml(text)}</text>
    </svg>
  `;
};

const measureTextDimensions = async (
  text: string,
  fontSize: number,
  bold: boolean
): Promise<FontMeasurement> => {
  const cacheKey = `${bold ? 'b' : 'n'}|${fontSize}|${text}`;
  const cached = measurementCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const measurementWidth = Math.max(64, Math.ceil(fontSize * (text.length + 2)));
  const measurementHeight = Math.max(64, Math.ceil(fontSize * 2));

  const svg = buildTextSvg(text, {
    width: measurementWidth,
    height: measurementHeight,
    fontSize,
    bold,
    anchor: 'start',
    x: fontSize * 0.1,
    y: fontSize,
    dominantBaseline: 'alphabetic',
  });

  const trimmedBuffer = await sharp(Buffer.from(svg)).png().trim().toBuffer();
  const metadata = await sharp(trimmedBuffer).metadata();
  const measurement = {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };

  measurementCache.set(cacheKey, measurement);
  return measurement;
};

const calculateOptimalFontMetrics = async (
  text: string,
  maxWidth: number,
  maxHeight: number,
  bold: boolean
): Promise<{ fontSize: number; textWidth: number; textHeight: number }> => {
  if (!text.trim()) {
    return { fontSize: MIN_FONT_SIZE, textWidth: 0, textHeight: 0 };
  }

  const targetWidth = maxWidth * TEXT_WIDTH_RATIO;
  const targetHeight = maxHeight * TEXT_HEIGHT_RATIO;

  let low = MIN_FONT_SIZE;
  let high = Math.max(low, Math.floor(maxHeight));
  let bestFontSize = low;
  let bestWidth = 0;
  let bestHeight = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const { width, height } = await measureTextDimensions(text, mid, bold);

    const fitsWidth = width <= targetWidth || width === 0;
    const fitsHeight = height <= targetHeight || height === 0;

    if (fitsWidth && fitsHeight) {
      bestFontSize = mid;
      bestWidth = width;
      bestHeight = height;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (bestWidth === 0 && bestHeight === 0) {
    const { width, height } = await measureTextDimensions(text, bestFontSize, bold);
    bestWidth = width;
    bestHeight = height;
  }

  return { fontSize: bestFontSize, textWidth: bestWidth, textHeight: bestHeight };
};

const coords = {
  member: { width: 300, height: 300, x: [365, 795, 1225, 1655, 2085], y: 1700 },
  dm: { width: 380, height: 380, x: 1170, y: 380 },
  sessionName: { x: 585, y: 925, maxWidth: 1600, maxHeight: 160, visualCenterX: 1358 },
  date: { x: 1000, y: 1140, maxWidth: 1300, maxHeight: 160, visualCenterX: 1358 },
  role: { yImg: 1300, yName: 2150, width: 300, height: 300 },
};

export const createSessionImage = async (
  session: Session,
  partyMembers: PartyMemberImgInfo[]
): Promise<void> => {
  // Create a snapshot of the data for logging to avoid race conditions
  const memberSnapshot = partyMembers.map(u => ({ userId: u.userId, username: u.username, role: u.role }));
  logger.debug('Creating session image', {
    sessionId: session.id,
    sessionName: session.name,
    members: memberSnapshot,
  });

  // Ensure temp directory exists
  const tempDir = BotPaths.TempDir;
  if (!fs.existsSync(tempDir)) {
    logger.debug('Creating temp directory for session image assets', { tempDir });
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Check if backdrop image exists
  if (!fs.existsSync(BotPaths.SessionBackdrop)) {
    throw new Error(`Backdrop image not found at: ${BotPaths.SessionBackdrop}`);
  }

  const dm = partyMembers.find((member) => {
    const roleData = getRoleByString(member.role);
    return roleData.id === RoleType.GAME_MASTER;
  });

  if (!dm) {
    logger.error('No dungeon master found while rendering session image', { sessionId: session.id, partyMembers });
    throw new Error('no dungeon master');
  }

  logger.debug('Found DM for session image', {
    sessionId: session.id,
    username: dm.username,
    role: dm.role,
  });

  const dmOverlay = await placeUserAvatar(
    dm.userAvatarURL,
    coords.dm.width,
    coords.dm.height,
    coords.dm.x,
    coords.dm.y
  );

  // Filter out the game master from party members
  const nonDmPartyMembers = partyMembers.filter((member) => {
    const roleData = getRoleByString(member.role);
    return roleData.id !== RoleType.GAME_MASTER;
  });

  const partyOverlays: OverlayOptions[] = [];
  for (const [index, member] of nonDmPartyMembers.entries()) {
    const avatarOverlay = await placeUserAvatar(
      member.userAvatarURL,
      coords.member.width,
      coords.member.height,
      coords.member.x[index],
      coords.member.y
    );
    const roleOverlays = await placeRole(member.role, index);
    partyOverlays.push(avatarOverlay, ...roleOverlays);
  }

  const sessionOverlays = await placeSessionInfo(session);

  // Add status border overlay
  const status = session.status || 'SCHEDULED';
  const borderOverlay = await createStatusBorder(status);

  const outputPath = path.join(BotPaths.TempDir, BotAttachmentFileNames.CurrentSession);

  await sharp(BotPaths.SessionBackdrop)
    .composite([borderOverlay, ...sessionOverlays, dmOverlay, ...partyOverlays])
    .toFile(outputPath);

  // Verify the file was created
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    logger.info('Session image created', {
      sessionId: session.id,
      outputPath,
      sizeBytes: stats.size,
    });
  } else {
    throw new Error(`Failed to create session image at: ${outputPath}`);
  }
};

const placeSessionInfo = async (
  session: Session
): Promise<OverlayOptions[]> => {
  const sessionNameOverlay = await createTextOverlay(
    session.name,
    coords.sessionName.maxWidth,
    coords.sessionName.maxHeight,
    true
  );

  const sessionDate = formatSessionDate(session.date, session.timezone ?? 'America/Los_Angeles');

  const dateOverlay = await createTextOverlay(
    sessionDate,
    coords.date.maxWidth,
    coords.date.maxHeight
  );

  return [
    {
      input: sessionNameOverlay,
      left: coords.sessionName.visualCenterX - Math.floor(await getImageWidth(sessionNameOverlay) / 2),
      top: coords.sessionName.y,
    },
    {
      input: dateOverlay,
      left: coords.date.visualCenterX - Math.floor(await getImageWidth(dateOverlay) / 2),
      top: coords.date.y,
    },
  ];
};

const getImageWidth = async (imageBuffer: Buffer): Promise<number> => {
  const metadata = await sharp(imageBuffer).metadata();
  return metadata.width || 0;
};

const placeUserAvatar = async (
  image: string,
  width: number,
  height: number,
  x: number,
  y: number
): Promise<OverlayOptions> => {
  const mask = Buffer.from(
    `<svg width="${width}" height="${width}">
        <circle cx="${width / 2}" cy="${width / 2}" r="${width / 2}" fill="white" />
     </svg>`
  );

  const res = await fetch(image);
  const buffer = Buffer.from(await res.arrayBuffer());

  const userImg = await sharp(buffer)
    .resize(width, height)
    .composite([{ input: mask, blend: 'dest-in' }])
    .toBuffer();

  return { input: userImg, left: x, top: y };
};

const placeRole = async (
  role: string,
  slot: number
): Promise<OverlayOptions[]> => {
  const roleData = getRoleByString(role);
  const roleImage = await sharp(getRoleImage(roleData))
    .resize(coords.role.width, coords.role.height)
    .toBuffer();

  return [
    { input: roleImage, left: coords.member.x[slot], top: coords.role.yImg },
  ];
};

const createTextOverlay = async (
  text: string,
  maxWidth: number,
  maxHeight: number,
  bold: boolean = true
): Promise<Buffer> => {
  const { fontSize, textWidth } = await calculateOptimalFontMetrics(
    text,
    maxWidth,
    maxHeight,
    bold
  );

  logger.debug('Creating text overlay', {
    text,
    fontSize,
    textWidth,
    maxWidth,
    maxHeight,
    bold,
  });

  const effectiveWidth = textWidth || maxWidth * TEXT_WIDTH_RATIO;
  const paddedWidth = Math.min(
    maxWidth,
    Math.max(
      Math.ceil(effectiveWidth / TEXT_WIDTH_RATIO),
      Math.ceil(effectiveWidth + 4)
    )
  );

  logger.debug('Text overlay width calculation', { effectiveWidth, paddedWidth });

  const svgWidth = bold ? maxWidth : paddedWidth;
  const svgHeight = maxHeight;
  const textX = svgWidth / 2;

  // Push baseline slightly downward so tall glyphs keep their ascenders
  const baselineAdjustment = Math.ceil(fontSize * 0.12);
  const textY = Math.floor(svgHeight / 2) + baselineAdjustment;

  logger.debug('Text overlay SVG dimensions', {
    svgWidth,
    svgHeight,
    textX,
    textY,
  });

  const svg = buildTextSvg(text, {
    width: svgWidth,
    height: svgHeight,
    fontSize,
    bold,
    anchor: 'middle',
    x: textX,
    y: textY,
    dominantBaseline: 'middle',
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
};

/**
 * Create a colored border overlay based on session status
 */
const createStatusBorder = async (status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED'): Promise<OverlayOptions> => {
  // Define colors for each status
  const statusColors = {
    SCHEDULED: '#00FF00', // Green
    ACTIVE: '#FFD700',    // Gold
    COMPLETED: '#0080FF', // Blue
    CANCELED: '#FF0000'   // Red
  };

  const color = statusColors[status];
  const borderWidth = 20; // Width of the border

  // Get the actual backdrop dimensions
  const imageWidth = 2717;
  const imageHeight = 2746;

  // Create SVG border (frame around the image)
  const borderSvg = `
    <svg width="${imageWidth}" height="${imageHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .border-frame {
            fill: none;
            stroke: ${color};
            stroke-width: ${borderWidth};
            opacity: 0.8;
          }
        </style>
      </defs>
      <rect 
        x="${borderWidth / 2}" 
        y="${borderWidth / 2}" 
        width="${imageWidth - borderWidth}" 
        height="${imageHeight - borderWidth}" 
        class="border-frame"
      />
    </svg>
  `;

  const borderBuffer = await sharp(Buffer.from(borderSvg)).png().toBuffer();

  return {
    input: borderBuffer,
    left: 0,
    top: 0
  };
};