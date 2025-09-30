import sharp, { OverlayOptions } from 'sharp';
import { getSessionById } from '../db/session.js';
import { BotAttachmentFileNames, BotPaths } from './botDialogStrings.js';
import { getPartyInfoForImg } from '../controllers/session.js';
import {
  getRoleByString,
  getRoleImage,
  RoleType,
} from '../models/role.js';
import { Session } from '../models/session.js';

const coords = {
  member: { width: 300, height: 300, x: [365, 795, 1225, 1655, 2085], y: 1700 },
  dm: { width: 300, height: 300, x: 1225, y: 400 }, // Added missing dm coordinates
  sessionName: { x: 585, y: 940, maxWidth: 1200, maxHeight: 120, visualCenterX: 1350 }, // Visual center of the name area
  date: { x: 1035, y: 1140, maxWidth: 1000, maxHeight: 100, visualCenterX: 1435 }, // Visual center of the date area
  role: { yImg: 1300, yName: 2150, width: 300, height: 300 },
};

export const createSessionImage = async (sessionId: string): Promise<void> => {
  console.log(`Starting createSessionImage for sessionId: ${sessionId}`);

  const users = await getPartyInfoForImg(sessionId);
  console.log(`Retrieved ${users.length} users for session:`, users.map(u => ({ username: u.username, role: u.role })));

  const session = await getSessionById(sessionId);
  console.log(`Retrieved session: ${session?.name}`);

  // Ensure temp directory exists
  const tempDir = BotPaths.TempDir;
  const fs = await import('fs');
  if (!fs.existsSync(tempDir)) {
    console.log(`Creating temp directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Check if backdrop image exists
  if (!fs.existsSync(BotPaths.SessionBackdrop)) {
    throw new Error(`Backdrop image not found at: ${BotPaths.SessionBackdrop}`);
  }

  // Find the game master using our new role system
  const dm = users.find((member) => {
    const roleData = getRoleByString(member.role);
    return roleData.id === RoleType.GAME_MASTER;
  });

  if (!dm) {
    console.error(`No dungeon master found! Available users:`, users);
    throw new Error('no dungeon master');
  }

  console.log(`Found DM: ${dm.username} with role: ${dm.role}`);

  const dmOverlay = await placeUserAvatar(
    dm.userAvatarURL,
    coords.dm.width,
    coords.dm.height,
    coords.dm.x,
    coords.dm.y
  );

  // Filter out the game master from party members
  const partyMembers = users.filter((member) => {
    const roleData = getRoleByString(member.role);
    return roleData.id !== RoleType.GAME_MASTER;
  });

  const partyOverlays: OverlayOptions[] = [];
  for (const [index, member] of partyMembers.entries()) {
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
  const status = (session.status || 'SCHEDULED') as 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
  const borderOverlay = await createStatusBorder(status);

  const path = await import('path');
  const outputPath = path.join(BotPaths.TempDir, BotAttachmentFileNames.CurrentSession);

  await sharp(BotPaths.SessionBackdrop)
    .composite([borderOverlay, ...sessionOverlays, dmOverlay, ...partyOverlays])
    .toFile(outputPath);

  // Verify the file was created
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log(`Session image created successfully at: ${outputPath}, Size: ${stats.size} bytes`);
  } else {
    throw new Error(`Failed to create session image at: ${outputPath}`);
  }
};

const placeSessionInfo = async (
  session: Session
): Promise<OverlayOptions[]> => {
  // Calculate centered positions for the text overlays
  const sessionNameOverlay = await createTextOverlay(
    session.name,
    coords.sessionName.maxWidth,
    coords.sessionName.maxHeight,
    true
  );

  // Format date in Pacific timezone
  const pacificDate = new Date(session.date).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const dateOverlay = await createTextOverlay(
    pacificDate,
    coords.date.maxWidth,
    coords.date.maxHeight,
    true
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

// Helper function to get image width from buffer
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
    {
      input: await createTextOverlay(
        roleData.displayName,
        coords.role.width,
        80,
        true // Center the role name
      ),
      left: coords.member.x[slot], // Role containers are already centered since they align with the avatars
      top: coords.role.yName,
    },
  ];
};

const createTextOverlay = async (text: string, maxWidth?: number, maxHeight?: number, centered: boolean = false): Promise<Buffer> => {
  const fontSize = maxWidth && maxHeight ?
    calculateOptimalFontSize(text, maxWidth, maxHeight) :
    100;

  // If centering, create a smaller container based on estimated text width
  let svgWidth, textX, textAnchor;

  if (centered) {
    // Estimate actual text width for a more precise container
    const estimatedTextWidth = estimateTextWidth(text, fontSize);
    svgWidth = Math.min(estimatedTextWidth * 1.1, maxWidth || 400); // Add 10% padding
    textX = svgWidth / 2;
    textAnchor = "middle";
  } else {
    svgWidth = maxWidth || 400;
    textX = 0;
    textAnchor = "start";
  }

  const svgHeight = maxHeight || 100;

  const svg = `
    <svg width="${svgWidth}" height="${svgHeight}">
      <text
        x="${textX}"
        y="${fontSize * 0.8}"
        font-family="Vecna"
        font-size="${fontSize}"
        fill="white"
        text-anchor="${textAnchor}"
      >${text}</text>
    </svg>
  `;

  return await sharp(Buffer.from(svg)).png().toBuffer();
};

// Helper function to estimate text width (extracted from calculateOptimalFontSize)
const estimateTextWidth = (text: string, fontSize: number): number => {
  let totalWidth = 0;
  for (const char of text) {
    if (/[A-Z]/.test(char)) {
      totalWidth += fontSize * 0.7; // Capital letters are wider
    } else if (/[a-z]/.test(char)) {
      totalWidth += fontSize * 0.5; // Lowercase letters
    } else if (/[0-9]/.test(char)) {
      totalWidth += fontSize * 0.6; // Numbers
    } else if (/[\s]/.test(char)) {
      totalWidth += fontSize * 0.3; // Spaces
    } else {
      totalWidth += fontSize * 0.4; // Other characters (punctuation, etc.)
    }
  }
  return totalWidth;
};/**
 * Calculates the optimal font size to fit text within given dimensions
 * Uses an approximation based on typical font characteristics
 */
const calculateOptimalFontSize = (text: string, maxWidth: number, maxHeight: number): number => {
  // Start with maximum possible font size based on height
  let fontSize = Math.floor(maxHeight * 0.8); // Leave some padding

  // Character width estimation for different types of characters
  // This accounts for the fact that some characters are wider than others
  const estimateTextWidth = (text: string, fontSize: number): number => {
    let totalWidth = 0;
    for (const char of text) {
      if (/[A-Z]/.test(char)) {
        totalWidth += fontSize * 0.7; // Capital letters are wider
      } else if (/[a-z]/.test(char)) {
        totalWidth += fontSize * 0.5; // Lowercase letters
      } else if (/[0-9]/.test(char)) {
        totalWidth += fontSize * 0.6; // Numbers
      } else if (/[\s]/.test(char)) {
        totalWidth += fontSize * 0.3; // Spaces
      } else {
        totalWidth += fontSize * 0.4; // Other characters (punctuation, etc.)
      }
    }
    return totalWidth;
  };

  let estimatedWidth = estimateTextWidth(text, fontSize);

  if (estimatedWidth > maxWidth) {
    fontSize = Math.floor((maxWidth / estimatedWidth) * fontSize);
    estimatedWidth = estimateTextWidth(text, fontSize);
  }

  const minFontSize = 16;
  fontSize = Math.max(fontSize, minFontSize);

  fontSize = Math.min(fontSize, Math.floor(maxHeight * 0.9));


  return fontSize;
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