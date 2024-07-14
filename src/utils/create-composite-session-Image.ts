import Jimp from "jimp";
import { GetSessionByMessageId, getUsersByMessageId } from "./prisma-commands";
import { getRoleImage, getRoleSTR, roles } from "./role";
import { ExtendedClient } from "../structures/ExtendedClient";
import { BotAttachmentFileNames, BotPaths } from "./botDialogStrings";

export async function CreateCompositeImage(
  client: ExtendedClient,
  messageID: string
) {
  const userImageData = await GetUserImageData(client, messageID);
  const session = await GetSessionByMessageId(messageID);
  //fix this
  const font = await Jimp.loadFont(
    "C:/Users/Shawn/Documents/dnd-party-bot/src/resources/fonts/Vecna-oppx-64.fnt"
  );

  //creates a promise to handle the jimps
  await Promise.all([userImageData, font]).then(async (data) => {
    const baseImage = await Jimp.read(BotPaths.BaseSessionImageDir);
    const mask = await Jimp.read(BotPaths.ProfileMaskImageDir);
    const xValues = [365, 795, 1225, 1655, 2085];
    let spotValue = 0;

    baseImage.print(font, 585, 940, session?.name);
    baseImage.print(font, 1035, 1140, `${session?.date.toUTCString()}`);

    for (var i = 0; i < data[0].length; i++) {
      const image = await Jimp.read(data[0][i].userAvatarURL);

      if (data[0][i].role === roles.DM) {
        image.resize(350, 350);
        mask.resize(350, 350);
        image.mask(mask, 0, 0);
        baseImage.composite(image, 1185, 390); //DM spot
      } else {
        image.resize(300, 300);
        mask.resize(300, 300);
        image.mask(mask, 0, 0);
        baseImage.composite(image, xValues[spotValue], 1700);
        const roleImage = await Jimp.read(getRoleImage(data[0][i].role));
        roleImage.resize(300, 300);
        baseImage.composite(roleImage, xValues[spotValue], 1300);
        baseImage.print(
          font,
          xValues[spotValue],
          2150,
          getRoleSTR(data[0][i].role)
        );
        spotValue++;
      }
    }
    //this saves our modified image
    await baseImage.write(
      `${BotPaths.TempDir}${BotAttachmentFileNames.CurrentSession}`
    );
  });
}

async function GetUserImageData(client: ExtendedClient, messageId: string) {
  const usersInThisSession = await getUsersByMessageId(messageId);

  const guildMembers = await (
    await client.guilds?.fetch(`${process.env.GUILD_ID}`)
  ).members.fetch();

  let sessionMemberData: {
    userAvatarURL: string;
    username: string;
    role: string;
  }[] = [];

  guildMembers.forEach((member) => {
    const matchingUser: any = usersInThisSession.find(
      (user) => user.user.userChannelId === member.id
    );
    const memberImageURL: any = member.displayAvatarURL({
      extension: "png",
      forceStatic: true,
    });

    if (matchingUser && memberImageURL) {
      sessionMemberData = [
        ...sessionMemberData,
        {
          userAvatarURL: memberImageURL,
          username: matchingUser?.user?.username as string,
          role: matchingUser?.role as string,
        },
      ];
    }
  });

  return sessionMemberData;
}
