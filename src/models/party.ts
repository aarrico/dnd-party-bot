import { RoleType } from '@prisma/client';

export interface PartyMember {
  userId: string;
  username: string;
  role: RoleType;
  channelId: string;
}

export type ListPartyForSessionOptions = {
  addUserRoleInThisSession?: boolean;
  addUserId?: boolean;
  addUserDMMessageId?: boolean;
};

export enum RoleSelectionStatus {
  EXPIRED = 'session-expired',
  PARTY_FULL = 'party-full',
  ADDED_TO_PARTY = 'added-to-party',
  REMOVED_FROM_PARTY = 'removed-from-party',
  ROLE_CHANGED = 'party-member-role-changed',
  INVALID = 'game-master-cannot-be-changed',
  LOCKED = 'session-locked',
  ALREADY_IN_SESSION = 'already-in-session',
  HOSTING_SAME_DAY = 'hosting-same-day',
}
