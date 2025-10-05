import { PartyMember } from './party';

export type Session = {
  id: string;
  name: string;
  date: Date;
  timezone: string;
  campaignId: string;
  partyMessageId: string;
  status?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
};

export interface CreateSessionData {
  id: string;
  name: string;
  date: Date;
  timezone: string;
  campaignId: string;
  partyMessageId: string;
  status?: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
}

export interface ListSessionsOptions {
  includeId: boolean;
  includeTime: boolean;
  includeCampaign: boolean;
  includeUserRole: boolean;
  userId?: string;
  campaignId?: string;
  includeRole?: boolean;
}

export interface ListSessionsResult {
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
