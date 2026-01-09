export interface LeaveGroupJobDto {
  groupId: string;
  userId: string;
}

export interface LeaveGroupJobResult {
  left: boolean;
  groupDeleted: boolean;
  newOwnerId?: string;
}

export interface AcceptInviteJobDto {
  inviteToken: string;
  inviteId: string;
  groupId: string;
  userId: string;
}

export interface AcceptInviteJobResult {
  groupId: string;
  alreadyMember: boolean;
}
