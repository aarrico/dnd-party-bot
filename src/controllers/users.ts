import { getAllUsers } from '../db/user';
import { ListUsersOptions, ListUsersResult } from '../typings/user';

export const listUsers = async (
  options: ListUsersOptions,
  asString: boolean
) => {
  const users = await getAllUsers(options);
  return asString ? formatAsString(users, options) : users;
};

const formatAsString = (
  users: ListUsersResult[],
  options: ListUsersOptions,
  delimiter = ', '
): string => {
  const header = [
    'Username',
    options.includeUserId && 'User Id',
    options.includeUserDMMessageId && 'User Channel Id',
  ].filter(Boolean);

  const data = users.map((user) => {
    return [
      user.username,
      options.includeUserId && user.id,
      options.includeUserDMMessageId && user.channelId,
    ].filter(Boolean);
  });

  return [header, ...data].map((row) => row.join(delimiter)).join('\n');
};
