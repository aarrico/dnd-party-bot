export interface ListSessionsOptions {
  includeSessionId: boolean;
  includeTime: boolean;
  includeCampaign: boolean;
  userId?: string;
  campaignId?: string;
}

export interface ListSessionsResult {
  id: string;
  name: string;
  date: Date;
  userRole?: string;
  campaign?: string;
}
