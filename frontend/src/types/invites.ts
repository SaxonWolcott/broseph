export interface InvitePreview {
  groupName: string;
  invitedByName: string | null;
  expiresAt: string;
  isExpired: boolean;
  isUsed: boolean;
  memberCount: number;
  isGroupFull: boolean;
}

export interface InviteCreatedResponse {
  token: string;
  expiresAt: string;
}

export interface AcceptInviteResponse {
  jobId: string;
  status: string;
  groupId: string;
}

export interface CreateInviteRequest {
  email?: string;
}
