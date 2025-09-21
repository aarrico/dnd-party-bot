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
  sessionName: { x: 585, y: 940 },
  date: { x: 1035, y: 1140 },
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

  const path = await import('path');
  const outputPath = path.join(BotPaths.TempDir, BotAttachmentFileNames.CurrentSession);

  await sharp(BotPaths.SessionBackdrop)
    .composite([...sessionOverlays, dmOverlay, ...partyOverlays])
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
  return [
    {
      input: await createTextOverlay(session.name),
      left: coords.sessionName.x,
      top: coords.sessionName.y,
    },
    {
      input: await createTextOverlay(session.date.toUTCString()),
      left: coords.date.x,
      top: coords.date.y,
    },
  ];
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
      input: await createTextOverlay(roleData.displayName),
      left: coords.member.x[slot],
      top: coords.role.yName,
    },
  ];
};

const createTextOverlay = async (text: string): Promise<Buffer> => {
  // Create text overlay using SVG
  const svg = `
    <svg width="400" height="100">
      <text
        x="0"
        y="50"
        font-family="Vecna"
        font-size="40"
        fill="white"
      >${text}</text>
    </svg>
  `;

  return await sharp(Buffer.from(svg)).png().toBuffer();
};
