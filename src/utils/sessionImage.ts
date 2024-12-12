import { Jimp, loadFont } from 'jimp';
import { GetSessionByMessageId } from '../db/session';
import { getRoleImage, getRoleSTR, roles } from './role';
import { ExtendedClient } from '../structures/ExtendedClient';
import { BotAttachmentFileNames, BotPaths } from './botDialogStrings';
import path from 'path';
import { getPartyMembers } from '../db/user';

const coords = {
  dm: { width: 350, x: 1185, y: 390 },
  member: { width: 300, x: [365, 795, 1225, 1655, 2085], y: 1700 },
  sessionName: { x: 585, y: 940 },
  date: { x: 1035, y: 1140 },
  role: { yImg: 1300, yName: 2150 },
};

export const createSessionImage = async (
  client: ExtendedClient,
  messageID: string
) => {
  const [partyMembers, session, font, backdrop, mask] = await Promise.all([
    getPartyMembers(client, messageID),
    GetSessionByMessageId(messageID),
    loadFont(path.join(__dirname, '..', 'resources/fonts/Vecna-oppx-64.fnt')),
    Jimp.read(BotPaths.BaseSessionImageDir),
    Jimp.read(BotPaths.ProfileMaskImageDir),
  ]);

  placeSessionInfo(session, font, backdrop);

  let memberSlot = 0;
  for (const member of partyMembers) {
    const image = await Jimp.read(member.userAvatarURL);
    const isDM = member.role === roles.DM;

    placeUserAvatar(image, mask, backdrop, isDM, memberSlot);

    if (!isDM) {
      await placeRole(member.role, backdrop, font, memberSlot);
      memberSlot++;
    }
  }

  backdrop.write(`${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`);
};

const placeSessionInfo = (session: any, font: any, backdrop: any) => {
  backdrop.print(
    font,
    coords.sessionName.x,
    coords.sessionName.y,
    session.name
  );
  backdrop.print(
    font,
    coords.date.x,
    coords.date.y,
    `${session.date.toUTCString()}`
  );
};

const placeUserAvatar = (
  image: any,
  mask: any,
  backdrop: any,
  isDM: boolean,
  memberSlot: number
) => {
  const width = isDM ? coords.dm.width : coords.member.width;
  const x = isDM ? coords.dm.x : coords.member.x[memberSlot];
  const y = isDM ? coords.dm.y : coords.member.y;

  image.resize({ h: width, w: width });
  mask.resize({ h: width, w: width });
  image.mask({ src: mask, x: 0, y: 0 });
  backdrop.composite(image, x, y);
};

const placeRole = async (
  role: string,
  backdrop: any,
  font: any,
  slot: number
) => {
  const roleImage = await Jimp.read(getRoleImage(role));
  roleImage.resize({ h: coords.member.width, w: coords.member.width });
  backdrop.composite(roleImage, coords.member.x[slot], coords.role.yImg);
  backdrop.print({
    font,
    x: coords.member.x[slot],
    y: coords.role.yName,
    text: getRoleSTR(role),
  });
};
