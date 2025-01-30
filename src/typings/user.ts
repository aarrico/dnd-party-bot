export interface ListUsersOptions {
  includeUserId: boolean;
  includeUserDMMessageId: boolean;
}

export interface ListUsersResult {
  id?: string;
  username: string;
  channelId?: string;
}
