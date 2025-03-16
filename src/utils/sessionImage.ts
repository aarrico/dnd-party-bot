import sharp, { OverlayOptions } from 'sharp';

import { getSessionById } from '../db/session';
import { getRoleImage, getRoleName, roles } from './role';
import { BotAttachmentFileNames, BotPaths } from './botDialogStrings';
import { getPartyInfoForImg } from '../controllers/session';
import { Session } from '../typings/session';

const coords = {
  dm: { width: 350, height: 350, x: 1185, y: 390 },
  member: { width: 300, height: 300, x: [365, 795, 1225, 1655, 2085], y: 1700 },
  sessionName: { x: 585, y: 940 },
  date: { x: 1035, y: 1140 },
  role: { yImg: 1300, yName: 2150, width: 300, height: 300 },
};

export const createSessionImage = async (channelId: string): Promise<void> => {
  const [users, session] = await Promise.all([
    getPartyInfoForImg(channelId),
    getSessionById(channelId),
  ]);

  const sessionOverlays = await placeSessionInfo(session);

  const dm = users.find((member) => member.role === roles.DM);
  if (!dm) {
    console.error(`No Dungeon Master found for session ${session.name}`);
    throw new Error('no dungeon master');
  }
  const dmOverlay = await placeUserAvatar(
    dm.userAvatarURL,
    coords.dm.width,
    coords.dm.height,
    coords.dm.x,
    coords.dm.y
  );

  const partyMembers = users.filter((member) => member.role !== roles.DM);
  const partyOverlays = (
    await Promise.all(
      partyMembers.flatMap((member, index) => [
        placeUserAvatar(
          member.userAvatarURL,
          coords.member.width,
          coords.member.height,
          coords.member.x[index],
          coords.member.y
        ),
        placeRole(member.role, index),
      ])
    )
  ).flat();

  await sharp(BotPaths.SessionBackdrop)
    .composite([...sessionOverlays, dmOverlay, ...partyOverlays])
    .toFile(BotPaths.TempDir + BotAttachmentFileNames.CurrentSession);
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
  const roleImage = await sharp(getRoleImage(role))
    .resize(coords.role.width, coords.role.height)
    .toBuffer();

  return [
    { input: roleImage, left: coords.member.x[slot], top: coords.role.yImg },
    {
      input: await createTextOverlay(getRoleName(role)),
      left: coords.member.x[slot],
      top: coords.role.yName,
    },
  ];
};

const createTextOverlay = async (text: string): Promise<Buffer> => {
  // Create text overlay using SVG
  const svg = `
    <svg width="500" height="100">
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
