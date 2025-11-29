import { PartyMember } from '#modules/party/domain/party.types.js';

export type Session = {
  id: string;
  name: string;
  date: Date;
  timezone: string;
  campaignId: string;
  partyMessageId: string;
  eventId?: string | null;
  status?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
};

export interface CreateSessionData {
  id: string;
  name: string;
  date: Date;
  timezone: string;
  campaignId: string;
  partyMessageId: string;
  eventId?: string | null;
  status?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
}

export interface ListSessionsOptions {
  includeId?: boolean;
  includeTime?: boolean;
  includeCampaign?: boolean;
  includeUserRole?: boolean;
  userId?: string;
  campaignId?: string;
  includeRole?: boolean;
}

export interface ListSessionsResult {
  status: string;
  id: string;
  name: string;
  date: Date;
  userRole?: string;
  campaign?: string;
}

export interface SessionWithParty extends Session {
  partyMembers: PartyMember[];
}

export interface SessionWithPartyPrismaResult {
  id: string;
  name: string;
  date: Date;
  campaignId: string;
  partyMembers: {
    user: { id: string; username: string; channelId: string };
    role: string;
  }[];
}

// Types for session image generation
export interface PartyMemberImgInfo {
  userId: string;
  userAvatarURL: string;
  username: string;
  role: string;
}

export interface AvatarOptions {
  extension: 'png';
  forceStatic: boolean;
}
