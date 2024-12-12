import sharp, { OverlayOptions } from 'sharp';
import { GetSessionByMessageId, SessionData } from '../db/session';
import { getRoleImage, getRoleName, roles } from './role';
import { ExtendedClient } from '../structures/ExtendedClient';
import { BotAttachmentFileNames, BotPaths } from './botDialogStrings';
import path from 'path';
import { getPartyMembers } from '../db/user';

const coords = {
  dm: { width: 350, height: 350, x: 1185, y: 390 },
  member: { width: 300, height: 300, x: [365, 795, 1225, 1655, 2085], y: 1700 },
  sessionName: { x: 585, y: 940 },
  date: { x: 1035, y: 1140 },
  role: { yImg: 1300, yName: 2150, width: 300, height: 300 },
};

const fontName = 'Vecna';
const fontPath = path.resolve(
  path.join(__dirname, '..', 'resources/fonts/Vecna-oppx-64.fnt')
);

export const createSessionImage = async (
  client: ExtendedClient,
  messageID: string
) => {
  const [users, session] = await Promise.all([
    getPartyMembers(client, messageID),
    GetSessionByMessageId(messageID),
  ]);

  const sessionOverlays = placeSessionInfo(session);

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

const placeSessionInfo = (session: SessionData): OverlayOptions[] => {
  return [
    {
      input: {
        text: {
          text: session.name,
          font: fontName,
          fontfile: fontPath,
        },
      },
      left: coords.sessionName.x,
      top: coords.sessionName.y,
    },
    {
      input: {
        text: {
          text: session.date.toUTCString(),
          font: fontName,
          fontfile: fontPath,
        },
      },
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
      input: {
        text: { text: getRoleName(role), font: fontName, fontfile: fontPath },
      },
      left: coords.member.x[slot],
      top: coords.role.yName,
    },
  ];
};
