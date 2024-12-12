import { ExtendedClient } from '../structures/ExtendedClient';
import { getUsersByMessageId } from './session';

export type UserData = {
  username: string;
  userChannelId: string;
};

export async function getPartyMembers(
  client: ExtendedClient,
  messageId: string
) {
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
      extension: 'png',
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