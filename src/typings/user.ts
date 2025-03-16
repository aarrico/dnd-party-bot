import { ListSessionsResult } from './session';

export interface ListUsersOptions {
  includeUserId: boolean;
  includeUserDMMessageId: boolean;
}

export interface ListUsersResult {
  id?: string;
  username: string;
  channelId?: string;
}

export interface ListUserWithSessionsResult extends ListUsersResult {
  sessions: ListSessionsResult[];
}
